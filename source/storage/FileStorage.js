const fs = require("fs");
const debounce = require("debounce");
const ChannelQueue = require("@buttercup/channel-queue");
const pify = require("pify");
const fileExists = require("file-exists");
const sleep = require("sleep-promise");
const MemoryStorage = require("./MemoryStorage.js");

const FILE_WRITE_DELAY = 500;

const readFile = pify(fs.readFile);
const writeFile = pify(fs.writeFile);

/**
 * File storage interface
 * Extends memory storage with persistent disk writes so that a
 * full copy of all jobs is kept on-disk.
 * @augments MemoryStorage
 */
class FileStorage extends MemoryStorage {
    /**
     * Constructor for the FileStorage adapter
     * @param {String} filename The filename to store the state in
     * @memberof FileStorage
     */
    constructor(filename) {
        super();
        this._filename = filename;
        this._queue = new ChannelQueue();

        /**
         * Debounced method for writing to the file
         * @type {Function}
         * @memberof FileStorage
         * @see _writeStateToFile
         */
        this.writeStateToFile = debounce(
            this._writeStateToFile.bind(this),
            FILE_WRITE_DELAY,
            /* immediate: */ false
        );
    }

    /**
     * Initialise the file storage
     * This method reads the contents of the file into memory
     * @returns {Promise} A promise that resolves once the cached
     *  file storage is loaded
     * @memberof FileStorage
     */
    initialise() {
        return super
            .initialise()
            .then(() => fileExists(this._filename))
            .then(exists => {
                if (!exists) {
                    return;
                }
                return readFile(this._filename, "utf8")
                    .then(JSON.parse)
                    .then(store => {
                        this._store = store;
                    });
            });
    }

    /**
     * Remove an item from storage
     * @param {String} key The key to remove
     * @returns {Promise} A promise that resolves once the item
     *  has been removed
     * @memberof FileStorage
     */
    removeItem(key) {
        return super.removeItem(key).then(() => this.writeStateToFile());
    }

    /**
     * Set an item in storage
     * @param {String} key The key to set
     * @param {*} value The value to store
     * @returns {Promise} A promise that resolves once the
     *  value has been stored
     * @memberof FileStorage
     */
    setItem(key, value) {
        return super.setItem(key, value).then(() => this.writeStateToFile());
    }

    /**
     * Get the serialised state
     * @returns {String} The state in serialised form
     * @protected
     * @memberof FileStorage
     */
    _getSerialisedState() {
        return JSON.stringify(this.store);
    }

    /**
     * Write the state to a file
     * Enqueues write operations for storing the state in
     * the specified file
     * @protected
     * @memberof FileStorage
     */
    _writeStateToFile() {
        this._queue.channel("write").enqueue(() => {
            return writeFile(this._filename, this._getSerialisedState()).then(() => sleep(100));
        });
    }
}

module.exports = FileStorage;
