const EventEmitter = require("eventemitter3");
const merge = require("merge");
const VError = require("verror");
const ChannelQueue = require("@buttercup/channel-queue");
const Storage = require("./storage/Storage.js");
const MemoryStorage = require("./storage/MemoryStorage.js");
const { generateEmptyJob } = require("./jobGeneration.js");
const { selectJobs } = require("./jobQuery.js");
const { prepareJobForWorker, updateJobChainForParents } = require("./jobMediation.js");
const { getTimestamp } = require("./time.js");
const {
    JOB_PRIORITY_HIGH,
    JOB_PRIORITY_LOW,
    JOB_PRIORITY_NORMAL,
    JOB_STATUS_PENDING,
    JOB_STATUS_RUNNING,
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
    constructor(storage = new MemoryStorage()) {
        super();
        if (storage instanceof Storage !== true) {
            throw new Error("Failed instantiating Service: Provided storage is of invalid type");
        }
        this._storage = storage;
        this._timeLimit = JOB_TIMELIMIT_DEFAULT;
        this._channelQueue = new ChannelQueue();
    }

    get jobQueue() {
        return this._channelQueue.channel("job");
    }

    get storage() {
        return this._storage;
    }

    get timeLimit() {
        return this._timeLimit;
    }

    set timeLimit(tl) {
        if (typeof tl !== "number" || tl < 0) {
            throw new Error(`Failed setting time limit: Invalid number: ${tl}`);
        }
        this._timeLimit = tl;
    }

    addJob(properties = {}) {
        return this.jobQueue.enqueue(() =>
            Promise
                .resolve()
                .then(() => {
                    const job = merge.recursive(
                        generateEmptyJob(),
                        { timeLimit: this.timeLimit },
                        properties
                    );
                    return updateJobChainForParents(this, job);
                })
                .then(job => {
                    return this.storage
                        .setItem(`job/${job.id}`, job)
                        .then(() => {
                            this.emit("jobAdded", { id: job.id });
                            return job.id;
                        });
                })
        );
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

    startJob(jobID, { executePredicate = false } = {}) {
        return this.jobQueue.enqueue(() =>
            this.getJob(jobID)
                .then(job => {
                    if (job.status !== JOB_STATUS_PENDING) {
                        throw new Error(`Invalid job status: ${job.status}`);
                    }
                    if (executePredicate) {
                        // @todo predicates
                    }
                    job.status = JOB_STATUS_RUNNING;
                    job.times.started = getTimestamp();
                    if (job.times.firstStarted === null) {
                        job.times.firstStarted = job.times.started;
                    }
                    return this.storage
                        .setItem(`job/${job.id}`, job)
                        .then(() => {
                            this.emit("jobStarted", { id: job.id });
                            return prepareJobForWorker(this, job);
                        });
                })
                .catch(err => {
                    throw new VError(err, `Failed starting job (${jobID})`);
                })
        );
    }

    use(helper) {
        // @todo
    }
}

/**
 * Job priority helper
 * @memberof Service
 * @type {JobPriorities}
 * @static
 */
Service.JobPriority = Object.freeze(JOB_PRIORITIES);

module.exports = Service;
