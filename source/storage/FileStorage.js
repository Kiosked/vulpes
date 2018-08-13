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

    removeItem(key) {
        return super
            .removeItem(key)
            .then(() => this.writeStateToFile());
    }

    setItem(key, value) {
        return super
            .setItem(key, value)
            .then(() => this.writeStateToFile());
    }

    _getSerialisedState() {
        return JSON.stringify(this.store);
    }

    _writeStateToFile() {
        this._queue.channel("write").enqueue(() => {
            return writeFile(this._filename, this._getSerialisedState())
                .then(() => sleep(100));
        });
    }
}

module.exports = FileStorage;
