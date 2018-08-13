const assert = require("assert");
const EventEmitter = require("eventemitter3");
const merge = require("merge");
const Storage = require("./storage/Storage.js");
const MemoryStorage = require("./storage/MemoryStorage.js");
const { generateEmptyJob } = require("./jobGeneration.js");
const { selectJobs } = require("./jobQuery.js");
const {
    JOB_PRIORITY_HIGH,
    JOB_PRIORITY_LOW,
    JOB_PRIORITY_NORMAL,
    JOB_TIMELIMIT_DEFAULT
} = require("./symbols.js");

/**
 * Job priorities
 * @name JobPriorities
 * @readonly
 * @enum {String}
 */
const JOB_PRIORITIES = {
    High: JOB_PRIORITY_HIGH,
    Normal: JOB_PRIORITY_NORMAL,
    Low: JOB_PRIORITY_LOW
};

class Service extends EventEmitter {
    /**
     * Job priority helper
     * @memberof Service
     * @type {JobPriorities}
     * @static
     */
    static JobPriority = Object.freeze(JOB_PRIORITIES);

    constructor(storage = new MemoryStorage()) {
        super();
        if (storage instanceof Storage !== true) {
            throw new Error("Failed instantiating Service: Provided storage is of invalid type");
        }
        this._storage = storage;
        this._timeLimit = JOB_TIMELIMIT_DEFAULT;
    }

    get storage() {
        return this._storage;
    }

    addJob(properties = {}) {
        return Promise
            .resolve()
            .then(() => {
                assert(
                    properties.data && Object.keys(properties.data).length > 0,
                    "Job data must be provided"
                );
                const job = merge.recursive(
                    generateEmptyJob(),
                    properties
                );
                return this.storage.setItem(`job/${job.id}`, job);
            });
    }

    getJob(jobID) {
        return this.storage
            .getItem(`job/${jobID}`)
            // Clone job
            .then(job => merge(true, job));
    }

    queryJobs(query) {
        return this.storage
            .getAllItems()
            // Search
            .then(items => selectJobs(items, query))
            // Clone
            .then(items => items.map(item => merge(true, item)));
    }
}

module.exports = Service;
