const fs = require("fs");
const debounce = require("debounce");
const ChannelQueue = require("@buttercup/channel-queue");
const pify = require("pify");
const tmp = require("tmp");
const endOfStream = require("end-of-stream");
const pump = require("pump");
const JSONStream = require("JSONStream");
const fileExists = require("file-exists");
const objectStream = require("@kiosked/object-stream");
const Storage = require("./Storage.js");

const JSON_PARSE_ARGS = ["*"];

/**
 * File storage adapter
 * Stores and streams jobs in a local file (very inefficiently)
 * @augments Storage
 * @memberof module:Vulpes
 */
class FileStorage extends Storage {
    /**
     * Constructor for a new FileStorage instance
     * @param {String} filename The file to store/stream jobs to and from
     * @memberof FileStorage
     */
    constructor(filename) {
        super();
        this._filename = filename;
        this._queue = new ChannelQueue();
        this._unlinkFile = pify(fs.unlink);
        this._writeFile = pify(fs.writeFile);
    }

    /**
     * Get an item by its ID
     * @param {String} id The item ID
     * @returns {Promise.<Object|null>} A promise that resolves with the item or
     *  null if not found
     * @memberof FileStorage
     */
    async getItem(id) {
        const stream = await this.streamItems();
        return new Promise((resolve, reject) => {
            let found = false;
            stream.on("data", item => {
                if (item.id === id) {
                    found = true;
                    stream.destroy();
                    resolve(item);
                }
            });
            endOfStream(stream, err => {
                if (err && !found) {
                    return reject(err);
                }
                if (!found) {
                    resolve(null);
                }
            });
        });
    }

    /**
     * Remove an item by its ID
     * @param {String} id The item ID
     * @returns {Promise} A promise that resolves when the item's been removed
     * @memberof FileStorage
     */
    async removeItem(id) {
        await this.setItem(id, null);
    }

    /**
     * Set an item using its ID
     * @param {String} id The item ID to set
     * @param {Object|null} item The item to set (or null to remove)
     * @returns {Promise} A promise that resolves when the operation has been
     *  completed
     * @see setItems
     * @memberof FileStorage
     */
    async setItem(id, item) {
        await this.setItems({ [id]: item });
    }

    /**
     * Set many items by specifying a hash map
     * @param {Object.<String, Object|null>} itemsInd The items hash map
     * @param {String} method Method of writing. Defaults to "append".
     *  When set to "clear" all other jobs are wiped during this action.
     * @returns {Promise}
     * @memberof FileStorage
     * @example
     *  await fileStorage.setItems({
     *      "abc123": {}, // Set/Create item
     *      "def456": null // Delete item
     *  });
     */
    async setItems(itemsInd, method = "append") {
        await this._queue.channel("stream").enqueue(async () => {
            // Prepare jobs file
            const originalExists = await fileExists(this._filename);
            if (!originalExists) {
                await this._writeFile(this._filename, "{}");
            }
            // Prepare temp file
            const { tmpPath, cleanup } = await new Promise((resolve, reject) =>
                tmp.file((err, tmpPath, fd, cleanup) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve({ tmpPath, cleanup });
                })
            );
            // Create a read stream with JSON parsing
            const rs = fs
                .createReadStream(this._filename)
                .pipe(JSONStream.parse(...JSON_PARSE_ARGS));
            const ws = JSONStream.stringifyObject();
            // Track whether or not the item exists in the stream:
            //  - If it doesn't, it should be added at the end of the stream
            //  - If it does, it should be replaced mid-stream
            const newItems = Object.keys(itemsInd);
            rs.on("data", currentItem => {
                // Item found, replace
                if (itemsInd.hasOwnProperty(currentItem.id)) {
                    const newItemInd = newItems.indexOf(currentItem.id);
                    if (newItemInd >= 0) {
                        newItems.splice(newItemInd, 1);
                    }
                    if (itemsInd[currentItem.id] === null) {
                        // Delete
                        return;
                    }
                    ws.write([currentItem.id, itemsInd[currentItem.id]]);
                    return;
                }
                // Another item we're not looking for, write it immediately
                if (method === "append") {
                    ws.write([currentItem.id, currentItem]);
                }
            });
            // Wait for the read stream to end
            endOfStream(rs, () => {
                newItems.forEach(newItemID => {
                    // Item wasn't found, so add it
                    ws.write([newItemID, itemsInd[newItemID]]);
                });
                ws.end();
            });
            // Now pump the new write stream into the temp file (as we can't simply overwrite
            //  the current live file)
            await new Promise((resolve, reject) =>
                pump(ws, fs.createWriteStream(tmpPath), err => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                })
            );
            // Pump the temp file back into the live file
            await new Promise((resolve, reject) =>
                pump(fs.createReadStream(tmpPath), fs.createWriteStream(this._filename), err => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                })
            );
            // Cleanup the temp file, without waiting
            cleanup();
        });
    }

    /**
     * Stream all items
     * @returns {Promise.<ReadableStream>} A promise that resolves with a readable stream
     * @memberof FileStorage
     */
    async streamItems() {
        // Check if file exists
        const originalExists = await fileExists(this._filename);
        if (!originalExists) {
            return super.streamItems();
        }
        // Return a promise that resolves with the stream instance
        return await new Promise(async consumerResolve => {
            await this._queue.channel("stream").enqueue(
                () =>
                    new Promise(channelResolve => {
                        const stream = fs
                            .createReadStream(this._filename)
                            .pipe(JSONStream.parse(...JSON_PARSE_ARGS));
                        // Resolve the consumer's promise with the stream instance, while
                        // we wait for the stream to end next..
                        consumerResolve(stream);
                        // We resolve the channel later as we need to wait for the stream
                        // to close naturally
                        endOfStream(stream, () => channelResolve());
                    })
            );
        });
    }
}

module.exports = FileStorage;
