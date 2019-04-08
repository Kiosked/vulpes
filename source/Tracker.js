const ms = require("ms");

/**
 * @typedef {Object} RegisteredWorker
 * @property {String} id The worker ID
 * @property {Number} updated The last updated timestamp
 * @property {Number} count The number of times the worker has updated
 */

class Tracker {
    constructor() {
        this._workers = [];
        this.liveWorkerTolerance = ms("60s");
    }

    /**
     * The current live workers
     * @type {RegisteredWorker}
     * @readonly
     * @memberof Tracker
     */
    get liveWorkers() {
        const validUpdatedTime = Date.now() - this.liveWorkerTolerance;
        return this._workers.filter(worker => worker.updated >= validUpdatedTime);
    }

    /**
     * Register a worker
     * @param {String} workerID The ID of the worker
     * @memberof Tracker
     */
    registerWorker(workerID) {
        const worker = this._workers.find(worker => worker.id === workerID);
        if (worker) {
            worker.updated = Date.now();
            worker.count += 1;
            return;
        }
        this._workers.push({
            id: workerID,
            updated: Date.now(),
            count: 1
        });
    }
}

module.exports = Tracker;
