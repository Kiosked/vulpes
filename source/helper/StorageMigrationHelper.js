const endOfStream = require("end-of-stream");
const ChannelQueue = require("@buttercup/channel-queue");
const Helper = require("./Helper.js");

const { TASK_TYPE_TAIL } = ChannelQueue.Task;

const waitForStream = stream =>
    new Promise((resolve, reject) =>
        endOfStream(stream, err => {
            if (err) {
                return reject(err);
            }
            resolve();
        })
    );

/**
 * Storage migration helper
 * @augments Helper
 */
class StorageMigrationHelper extends Helper {
    /**
     * Constructor for the storage migration helper
     * @param {Storage} originStorage The storage to migrate from
     * @memberof StorageMigrationHelper
     */
    constructor(originStorage) {
        super();
        this._originStorage = originStorage;
    }

    async initialise() {
        const queue = new ChannelQueue();
        const readStream = await this._originStorage.streamItems();
        const allKeys = [];
        readStream.on("data", item => {
            allKeys.push(item.id);
            queue.channel("item").enqueue(async () => this.service.storage.setItem(item.id, item));
        });
        // Wait for the read stream to finish
        await waitForStream(readStream);
        // Wait for the queue to flush
        await queue.channel("item").enqueue(() => {}, TASK_TYPE_TAIL);
        // Purge previous storage
        for (const itemID of allKeys) {
            await this._originStorage.removeItem(itemID);
        }
    }
}

module.exports = StorageMigrationHelper;
