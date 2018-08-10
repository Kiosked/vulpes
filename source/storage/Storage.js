/**
 * Storage base class
 * Provides a storage mechanism for the job handling framework,
 * allowing jobs to persist between restarts. This is an
 * interface and does not actually perform any operations.
 */
class Storage {
    /**
     * Get all keys in the storage
     * @returns {Promise.<Array.<String>>} A promise that resolves with an array of
     *  all the keys
     * @memberof Storage
     */
    getAllKeys() {
        return Promise.resolve([]);
    }

    /**
     * Get an item by its key
     * @param {String} key The key to fetch
     * @returns {Promise.<String|null>} A promise that resolves with the item, or
     *  null if the item doesn't exist
     * @memberof Storage
     */
    getItem(key) {
        return Promise.resolve(null);
    }

    /**
     * Get the base key prefix
     * This prefix is prepended to all keys before writing to storage
     * @returns {String}
     * @memberof Storage
     */
    getKeyPrefix() {
        return "";
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
     * @param {String} value The value to set
     * @returns {Promise} A promise that resolves once the value has been
     *  stored
     * @memberof Storage
     */
    setItem(key, value) {
        return Promise.resolve();
    }
}

module.exports = Storage;
