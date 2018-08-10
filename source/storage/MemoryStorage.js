const Storage = require("./Storage.js");

class MemoryStorage extends Storage {
    constructor() {
        super();
        this._store = {};
    }

    get store() {
        return this._store;
    }

    getAllKeys() {
        return Promise.resolve(Object.keys(this.store));
    }

    getItem(key) {
        const trueKey = `${this.getKeyPrefix()}${key}`;
        const value = this.store[trueKey] || null;
        return Promise.resolve(value);
    }

    removeItem(key) {
        const trueKey = `${this.getKeyPrefix()}${key}`;
        this.store[trueKey] = null;
        delete this.store[trueKey];
        return Promise.resolve();
    }

    setItem(key, value) {
        const trueKey = `${this.getKeyPrefix()}${key}`;
        this.store[trueKey] = value;
        return Promise.resolve();
    }
}

module.exports = MemoryStorage;
