const objectStream = require("@kiosked/object-stream");
const filterStream = require("stream-filter");
const Storage = require("./Storage.js");

/**
 * Memory storage adapter
 * Stores jobs in memory. Once application is closed all jobs are
 * purged - do not use this storage if you desire persistence.
 * @augments Storage
 */
class MemoryStorage extends Storage {
    constructor() {
        super();
        this._store = {};
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
        const value = this.store[key] || null;
        return Promise.resolve(value);
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
        return Promise.resolve();
    }

    /**
     * Set an item in the memory store
     * @param {String} key The key to store under
     * @param {*} value The value to store
     * @returns {Promise} Returns a promise that resolves once the item has
     *  been stored
     * @memberof MemoryStorage
     */
    setItem(key, value) {
        this.store[key] = value;
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
}

module.exports = MemoryStorage;
