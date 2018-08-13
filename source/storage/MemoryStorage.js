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
     * @memberof MemoryStorage
     */
    get store() {
        return this._store;
    }

    /**
     * Get all items in the storage
     * @returns {Promise.<Array.<*>>} A promise that resolves with all items
     * @memberof MemoryStorage
     */
    getAllItems() {
        return Promise.resolve(
            this.getAllKeys().map(key => this.getItem(key))
        );
    }

    /**
     * Get all storage keys
     * @returns {Promise.<Array.<String>>} A promise that resolves with an array of
     *  all the keys in storage
     * @memberof MemoryStorage
     */
    getAllKeys() {
        const keyPrefixLen = this.getKeyPrefix().length;
        return Promise.resolve(
            Object.keys(this.store).map(key =>
                key.substr(keyPrefixLen)
            )
        );
    }

    /**
     * Get an item's value
     * @param {String} key Get the value of a key
     * @returns {Promise.<*|null>} A promise that resolves with the value of
     *  the key or null if not found
     * @memberof MemoryStorage
     */
    getItem(key) {
        const trueKey = `${this.getKeyPrefix()}${key}`;
        const value = this.store[trueKey] || null;
        return Promise.resolve(value);
    }

    /**
     * Remove an item from the memory store
     * @param {String} key The key of the item to remove
     * @returns {Promise} A promise that resolves once the key has been removed
     * @memberof MemoryStorage
     */
    removeItem(key) {
        const trueKey = `${this.getKeyPrefix()}${key}`;
        this.store[trueKey] = null;
        delete this.store[trueKey];
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
        const trueKey = `${this.getKeyPrefix()}${key}`;
        this.store[trueKey] = value;
        return Promise.resolve();
    }
}

module.exports = MemoryStorage;
