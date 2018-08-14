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
    ERROR_CODE_INVALID_JOB_RESULT,
    ERROR_CODE_INVALID_JOB_STATUS,
    JOB_PRIORITY_HIGH,
    JOB_PRIORITY_LOW,
    JOB_PRIORITY_NORMAL,
    JOB_RESULT_TYPE_FAILURE,
    JOB_RESULT_TYPE_SUCCESS,
    JOB_RESULT_TYPE_TIMEOUT,
    JOB_RESULT_TYPES_REXP,
    JOB_STATUS_PENDING,
    JOB_STATUS_RUNNING,
    JOB_STATUS_STOPPED,
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

/**
 * Job result types
 * @name JobResultTypes
 * @readonly
 * @enum {String}
 */
const JOB_RESULTS = {
    Failure: JOB_RESULT_TYPE_FAILURE,
    Success: JOB_RESULT_TYPE_SUCCESS,
    Timeout: JOB_RESULT_TYPE_TIMEOUT
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

    startJob(jobID, { executePredicate = false, restart = false } = {}) {
        return this.jobQueue.enqueue(() =>
            this.getJob(jobID)
                .then(job => {
                    // @todo restart
                    if (job.status !== JOB_STATUS_PENDING) {
                        throw new VError(
                            { info: { code: ERROR_CODE_INVALID_JOB_STATUS } },
                            `Invalid job status: ${job.status}`
                        );
                    }
                    // @todo parent completion
                    if (executePredicate) {
                        // @todo predicates
                    }
                    job.status = JOB_STATUS_RUNNING;
                    job.times.started = getTimestamp();
                    if (job.times.firstStarted === null) {
                        job.times.firstStarted = job.times.started;
                    }
                    job.attempts += 1;
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

    stopJob(jobID, resultType, resultData = {}) {
        return this.jobQueue.enqueue(() =>
            this.getJob(jobID)
                .then(job => {
                    if (job.status !== JOB_STATUS_RUNNING) {
                        throw new VError(
                            { info: { code: ERROR_CODE_INVALID_JOB_STATUS } },
                            `Invalid job status: ${job.status}`
                        );
                    }
                    if (JOB_RESULT_TYPES_REXP.test(resultType) === false) {
                        throw new VError(
                            { info: { code: ERROR_CODE_INVALID_JOB_RESULT } },
                            `Invalid job result type: ${resultType}`
                        );
                    }
                    job.status = JOB_STATUS_STOPPED;
                    job.result.type = resultType;
                    Object.assign(job.result.data, resultData);
                    job.times.stopped = getTimestamp();
                    if (resultType === JOB_RESULT_TYPE_SUCCESS) {
                        job.times.completed = job.times.stopped;
                    }
                    return this.storage
                        .setItem(`job/${job.id}`, job)
                        .then(() => {
                            this.emit("jobStopped", { id: job.id });
                            if (resultType === JOB_RESULT_TYPE_SUCCESS) {
                                this.emit("jobCompleted", { id: job.id });
                            } else {
                                this.emit("jobFailed", { id: job.id });
                            }
                            return prepareJobForWorker(this, job);
                        });
                })
                .catch(err => {
                    throw new VError(err, `Failed stopping job (${jobID})`);
                })
        );
    }

    use(helper) {
        // @todo
    }
}

/**
 * Job priority
 * @memberof Service
 * @type {JobPriorities}
 * @static
 */
Service.JobPriority = Object.freeze(JOB_PRIORITIES);

/**
 * Job result type
 * @memberof Service
 * @type {JobResultTypes}
 * @static
 */
Service.JobResult = Object.freeze(JOB_RESULTS);

module.exports = Service;
