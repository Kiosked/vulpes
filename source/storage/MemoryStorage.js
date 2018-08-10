const Storage = require("./Storage.js");

class MemoryStorage extends Storage {
    constructor() {
        super();
        this._store = {};
    }

    getAllKeys() {
        return Promise.resolve(Object.keys(this._store));
    }

    getItem(key) {
        const trueKey = `${this.getKeyPrefix()}${key}`;
        const value = this._store[trueKey] || null;
        return Promise.resolve(value);
    }

    removeItem(key) {
        const trueKey = `${this.getKeyPrefix()}${key}`;
        this._store[trueKey] = null;
        delete this._store[trueKey];
        return Promise.resolve();
    }

    setItem(key, value) {
        const trueKey = `${this.getKeyPrefix()}${key}`;
        this._store[trueKey] = value;
        return Promise.resolve();
    }
}

module.exports = MemoryStorage;
