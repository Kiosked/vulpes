const { Readable } = require("stream");
const Redis = require("ioredis");
const endOfStream = require("end-of-stream");
const sleep = require("sleep-promise");
const ChannelQueue = require("@buttercup/channel-queue");
const Storage = require("./Storage.js");

const NOOP = () => {};
const STREAM_READ_COUNT = 2;

/**
 * Redis storage adapter
 * Stores items in a Redis database
 * @augments Storage
 */
class RedisStorage extends Storage {
    /**
     * Create a new Redis storage instance
     * @see https://www.npmjs.com/package/ioredis
     * @param {Object=} redisOptions The options for ioredis
     * @memberof RedisStorage
     */
    constructor(redisOptions = {}) {
        super();
        this.redis = new Redis(redisOptions);
        this._queue = new ChannelQueue();
    }

    /**
     * Get an item by its ID
     * @returns {Promise.<Object|null>} The found item or null if not found
     * @memberof RedisStorage
     */
    async getItem(id) {
        const json = await this.redis.get(id);
        return json ? JSON.parse(json) : null;
    }

    /**
     * Remove an item by its ID
     * @returns {Promise}
     * @memberof RedisStorage
     */
    async removeItem(id) {
        await this.redis.del(id);
    }

    /**
     * Set an item for an ID
     * @param {String} id The ID to set
     * @param {Object} item The item to set
     * @returns {Promise}
     * @memberof RedisStorage
     */
    async setItem(id, item) {
        await this.redis.set(id, JSON.stringify(item));
    }

    /**
     * Shutdown the adapter (and disconnect Redis)
     * @memberof RedisStorage
     * @returns {Promise} A promise that resolves when shutdown has completed
     */
    async shutdown() {
        await super.shutdown();
        await this.redis.quit();
    }

    /**
     * Stream all items
     * @returns {Promise.<ReadableStream>} A readable stream
     * @memberof RedisStorage
     */
    async streamItems() {
        // Create a readable stream for the consumer to read
        // job items from
        const outStream = new Readable({ objectMode: true });
        outStream._read = NOOP;
        // Create a stream for the reading from Redis
        const inStream = this.redis.scanStream({
            match: `*`,
            count: STREAM_READ_COUNT
        });
        const usedKeys = [];
        inStream.on("data", keys =>
            // We queue on portions of the stream to ensure that uniqueness
            // is maintained while reading asynchronously
            this._queue.channel("streamOut").enqueue(async () => {
                // Pause the redis stream so we can process
                inStream.pause();
                // Track unique keys already used
                const uniqueKeys = keys.filter(key => !usedKeys.includes(key));
                usedKeys.push(...uniqueKeys);
                if (uniqueKeys.length > 0) {
                    await Promise.all(
                        // Push all new unique items into the out stream
                        uniqueKeys.map(async itemKey => {
                            const json = await this.redis.get(itemKey);
                            if (json) {
                                outStream.push(JSON.parse(json));
                            }
                        })
                    );
                } else {
                    await sleep(50);
                }
                // Continue processing
                inStream.resume();
            })
        );
        endOfStream(inStream, () => {
            this._queue.channel("streamOut").enqueue(() => {
                // Mark the stream as finished
                outStream.push(null);
            });
        });
        return Promise.resolve(outStream);
    }
}

module.exports = RedisStorage;
