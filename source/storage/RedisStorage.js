const { Readable } = require("stream");
const Redis = require("ioredis");
const endOfStream = require("end-of-stream");
const sleep = require("sleep-promise");
const ChannelQueue = require("@buttercup/channel-queue");
const Storage = require("./Storage.js");

const NOOP = () => {};
const STREAM_READ_COUNT = 2;

class RedisStorage extends Storage {
    constructor(redisOptions = {}) {
        super();
        this.redis = new Redis(redisOptions);
        this._queue = new ChannelQueue();
    }

    async getItem(id) {
        const key = `${this.getKeyPrefix()}${id}`;
        const json = await this.redis.get(key);
        return json ? JSON.parse(json) : null;
    }

    async removeItem(id) {
        const key = `${this.getKeyPrefix()}${id}`;
        await this.redis.del(key);
    }

    async setItem(id, item) {
        const key = `${this.getKeyPrefix()}${id}`;
        await this.redis.set(key, JSON.stringify(item));
    }

    shutdown() {
        super.shutdown();
        this.redis.quit();
    }

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
