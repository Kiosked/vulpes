const ms = require("ms");

/**
 * @typedef {Object} TrackerJobStats
 * @property {Number} totalJobs - Total number of jobs
 * @property {Number} stoppedJobs - Total number of currently stopped jobs
 * @property {Number} runningJobs - Total number of currently running jobs
 * @property {Number} pendingJobs - Total number of currently pending jobs
 * @property {Number} succeededJobs - Total succeeded jobs
 * @property {Number} failedJobs - Total failed jobs
 * @property {Number} jobsInLastHour - Total number of jobs completed successfully in the last hour
 */

const STATS = {
    totalJobs: 0,
    stoppedJobs: 0,
    runningJobs: 0,
    pendingJobs: 0,
    succeededJobs: 0,
    failedJobs: 0,
    jobsInLastHour: 0
};

/**
 * @typedef {Object} RegisteredWorker
 * @property {String} id The worker ID
 * @property {Number} updated The last updated timestamp
 * @property {Number} count The number of times the worker has updated
 */

class Tracker {
    constructor(service) {
        this._service = service;
        this._workers = [];
        this._stats = this.statsTemplate;
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
     * Get a new stats template (zeroed)
     * @returns {TrackerJobStats}
     * @memberof Tracker
     */
    get statsTemplate() {
        return Object.assign({}, STATS);
    }

    /**
     * Fetch job stats
     * @returns {Promise.<TrackerJobStats>}
     * @memberof Tracker
     */
    async fetchStats() {
        // Run a query to process all jobs
        await this._service.queryJobs({});
        return Object.assign(this.statsTemplate, this._stats);
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

    /**
     * Update job stats
     * @param {TrackerJobStats} newStats
     * @memberof Tracker
     */
    updateStats(newStats) {
        this._stats = Object.assign(this.statsTemplate, newStats);
    }
}

module.exports = Tracker;
