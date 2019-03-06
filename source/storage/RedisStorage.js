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
        const key = `${this.getKeyPrefix()}${id}`;
        const json = await this.redis.get(key);
        return json ? JSON.parse(json) : null;
    }

    /**
     * Remove an item by its ID
     * @returns {Promise}
     * @memberof RedisStorage
     */
    async removeItem(id) {
        const key = `${this.getKeyPrefix()}${id}`;
        await this.redis.del(key);
    }

    /**
     * Set an item for an ID
     * @param {String} id The ID to set
     * @param {Object} item The item to set
     * @returns {Promise}
     * @memberof RedisStorage
     */
    async setItem(id, item) {
        const key = `${this.getKeyPrefix()}${id}`;
        await this.redis.set(key, JSON.stringify(item));
    }

    /**
     * Shutdown the adapter (and disconnect Redis)
     * @memberof RedisStorage
     */
    shutdown() {
        super.shutdown();
        this.redis.quit();
    }

    /**
     * Stream all items
     * @returns {Promise.<ReadableStream>} A readable stream
     * @memberof RedisStorage
     */
    async streamItems() {
        const outStream = new Readable({ objectMode: true });
        outStream._read = NOOP;
        const inStream = this.redis.scanStream({
            match: `${this.getKeyPrefix()}*`,
            count: STREAM_READ_COUNT
        });
        const usedKeys = [];
        inStream.on("data", keys =>
            this._queue.channel("streamOut").enqueue(async () => {
                inStream.pause();
                const uniqueKeys = keys.filter(key => !usedKeys.includes(key));
                usedKeys.push(...uniqueKeys);
                if (uniqueKeys.length > 0) {
                    await Promise.all(
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
                inStream.resume();
            })
        );
        endOfStream(inStream, () => {
            this._queue.channel("streamOut").enqueue(() => {
                outStream.push(null);
            });
        });
        return Promise.resolve(outStream);
    }
}

module.exports = RedisStorage;
