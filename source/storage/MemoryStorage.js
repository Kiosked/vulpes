const objectStream = require("@kiosked/object-stream");
const filterStream = require("stream-filter");
const Storage = require("./Storage.js");
const { waitForStream } = require("../streams.js");
const { clone } = require("../cloning.js");

/**
 * @typedef {Object} MemoryStorageOptions
 * @property {FileStorage|null} fileStorage Optional filestorage reference
 *  for sync'ing memory -> file system
 * @property {Number=} flushDelay Delay in milliseconds between flushing
 *  the memory to disk
 */

/**
 * Memory storage adapter
 * Stores jobs in memory. Once application is closed all jobs are
 * purged - do not use this storage if you desire persistence.
 * @augments Storage
 * @memberof module:Vulpes
 */
class MemoryStorage extends Storage {
    /**
     * Constructor for the storage instance
     * @param {MemoryStorageOptions=} opts Optional configuration for
     *  the memory storage instance
     */
    constructor(opts = {}) {
        super();
        this._store = {};
        const { fileStorage = null, flushDelay = 5000 } = opts;
        this._fileStorage = fileStorage;
        this._dirty = [];
        this._flushing = false;
        this._flushDelay = flushDelay;
    }

    /**
     * The job store
     * @type {Object}
     * @readonly
     * @memberof MemoryStorage
     */
    get store() {
        return this._store;
    }

    /**
     * Get an item's value
     * @param {String} key Get the value of a key
     * @returns {Promise.<*|null>} A promise that resolves with the value of
     *  the key or null if not found
     * @memberof MemoryStorage
     */
    getItem(key) {
        let value = this.store[key] || null;
        if (value !== null) {
            value = clone(value);
        }
        return Promise.resolve(value);
    }

    /**
     * Initialise the memory storage
     * @returns {Promise}
     * @memberof MemoryStorage
     */
    async initialise() {
        await super.initialise();
        if (this._fileStorage) {
            await this._fileStorage.initialise();
            const itemStream = await this._fileStorage.streamItems();
            itemStream.on("data", item => {
                this.store[item.id] = item;
            });
            await waitForStream(itemStream);
        }
    }

    /**
     * Remove an item from the memory store
     * @param {String} key The key of the item to remove
     * @returns {Promise} A promise that resolves once the key has been removed
     * @memberof MemoryStorage
     */
    removeItem(key) {
        this.store[key] = null;
        delete this.store[key];
        this._flagDirtyKey(key);
        return Promise.resolve();
    }

    /**
     * Set an item in the memory store
     * @param {String} key The key to store under
     * @param {Object} value The value to store
     * @returns {Promise} Returns a promise that resolves once the item has
     *  been stored
     * @memberof MemoryStorage
     */
    setItem(key, value) {
        this.store[key] = clone(value);
        this._flagDirtyKey(key);
        return Promise.resolve();
    }

    /**
     * Stream all items
     * @returns {Promise.<ReadableStream>} A promise that resolves with the readable stream
     * @memberof MemoryStorage
     */
    streamItems() {
        return new Promise(resolve => {
            resolve(
                objectStream
                    .fromArray(Object.keys(this.store).map(key => this.store[key]))
                    .pipe(filterStream.obj(item => !!item))
            );
        });
    }

    _flagDirtyKey(key) {
        // Skip if no filestorage is used
        if (this._fileStorage === null) return;
        if (this._dirty.includes(key) === false) {
            this._dirty.push(key);
        }
        setTimeout(() => this._flushDirty(), 0);
    }

    async _flushDirty() {
        if (this._flushing) return;
        this._flushing = true;
        const dirtyKeys = [...this._dirty];
        this._dirty = [];
        const items = dirtyKeys.reduce(
            (output, key) =>
                Object.assign(output, {
                    [key]: this.store[key] ? clone(this.store[key]) : null
                }),
            {}
        );
        try {
            await this._fileStorage.setItems(items);
        } catch (err) {
            console.error(err);
            // Put back marked keys
            this._dirty = [...new Set([...this._dirty, ...dirtyKeys])];
        }
        setTimeout(() => {
            this._flushing = false;
            if (this._dirty.length > 0) {
                this._flushDirty();
            }
        }, this._flushDelay);
    }
}

module.exports = MemoryStorage;
