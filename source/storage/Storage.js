const objectStream = require("@kiosked/object-stream");

/**
 * Storage base class
 * Provides a storage mechanism for the job handling framework,
 * allowing jobs to persist between restarts. This is an
 * interface and does not actually perform any operations.
 * @memberof module:Vulpes
 */
class Storage {
    /**
     * Get an item by its key
     * @param {String} key The key to fetch
     * @returns {Promise.<*|null>} A promise that resolves with the item, or
     *  null if the item doesn't exist
     * @memberof Storage
     */
    getItem(key) {
        return Promise.resolve(null);
    }

    /**
     * Initialise the storage
     * This usually entails reading the store from the storage so that it is
     * immediately available
     * @returns {Promise} A promise that resolves once initialisation has
     *  completed
     * @memberof Storage
     */
    initialise() {
        return Promise.resolve();
    }

    /**
     * Remove an item from storage
     * @param {String} key The key to remove
     * @returns {Promise} A promise that resolves once the key has been removed
     * @memberof Storage
     */
    removeItem(key) {
        return Promise.resolve();
    }

    /**
     * Set an item
     * @param {String} key The key to set the value for
     * @param {*} value The value to set
     * @returns {Promise} A promise that resolves once the value has been
     *  stored
     * @memberof Storage
     */
    setItem(key, value) {
        return Promise.resolve();
    }

    /**
     * Shutdown the storage instance
     * @returns {Promise} A promise that resolves once the shutdown procedure is complete
     * @memberof Storage
     */
    shutdown() {
        return Promise.resolve();
    }

    /**
     * Stream all items
     * @returns {Promise.<ReadableStream>} A promise that resolves with the readable stream
     * @memberof Storage
     */
    streamItems() {
        return Promise.resolve(objectStream.fromArray([]));
    }
}

module.exports = Storage;
