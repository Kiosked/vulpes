const EventEmitter = require("eventemitter3");
const merge = require("merge");
const VError = require("verror");
const ChannelQueue = require("@buttercup/channel-queue");
const Storage = require("./storage/Storage.js");
const MemoryStorage = require("./storage/MemoryStorage.js");
const Helper = require("./helper/Helper.js");
const { generateEmptyJob } = require("./jobGeneration.js");
const { selectJobs } = require("./jobQuery.js");
const { prepareJobForWorker, updateJobChainForParents } = require("./jobMediation.js");
const { getTimestamp } = require("./time.js");
const {
    ERROR_CODE_ALREADY_INIT,
    ERROR_CODE_HELPER_INVALID,
    ERROR_CODE_INVALID_JOB_RESULT,
    ERROR_CODE_INVALID_JOB_STATUS,
    ERROR_CODE_NOT_INIT,
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

/**
 * Job statuses
 * @name JobStatuses
 * @readonly
 * @enum {String}
 */
const JOB_STATUSES = {
    Pending: JOB_STATUS_PENDING,
    Running: JOB_STATUS_RUNNING,
    Stopped: JOB_STATUS_STOPPED
};

const newNotInitialisedError = () => new VError(
    { info: { code: ERROR_CODE_NOT_INIT } },
    "Service not initialised"
);

class Service extends EventEmitter {
    constructor(storage = new MemoryStorage()) {
        super();
        if (storage instanceof Storage !== true) {
            throw new Error("Failed instantiating Service: Provided storage is of invalid type");
        }
        this._storage = storage;
        this._timeLimit = JOB_TIMELIMIT_DEFAULT;
        this._channelQueue = new ChannelQueue();
        this._helpers = [];
        this._initialised = false;
    }

    get helpers() {
        return this._helpers;
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
        if (!this._initialised) {
            return Promise.reject(newNotInitialisedError());
        }
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
        if (!this._initialised) {
            return Promise.reject(newNotInitialisedError());
        }
        return this.storage
            .getItem(`job/${jobID}`)
            // Clone job
            .then(job => merge(true, job));
    }

    queryJobs(query) {
        if (!this._initialised) {
            return Promise.reject(newNotInitialisedError());
        }
        return this.storage
            .getAllItems()
            // Search
            .then(items => selectJobs(items, query))
            // Clone
            .then(items => items.map(item => merge(true, item)));
    }

    initialise() {
        if (this._initialised) {
            return Promise.reject(new VError(
                { info: { code: ERROR_CODE_ALREADY_INIT } },
                "Service already initialised"
            ));
        }
        this._initialised = true;
        return this.storage.initialise();
    }

    shutdown() {
        this.helpers.forEach(helper => {
            helper.shutdown();
        });
        this._helpers = [];
    }

    startJob(jobID, { executePredicate = false, restart = false } = {}) {
        if (!this._initialised) {
            return Promise.reject(newNotInitialisedError());
        }
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
        if (!this._initialised) {
            return Promise.reject(newNotInitialisedError());
        }
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
                            if (resultType === JOB_RESULT_TYPE_TIMEOUT) {
                                this.emit("jobTimeout", { id: job.id });
                            }
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
        if (!helper || helper instanceof Helper === false) {
            throw new VError(
                { info: { code: ERROR_CODE_HELPER_INVALID } },
                "Failed attaching helper: Invalid helper instance"
            );
        }
        this.helpers.push(helper);
        helper.attach(this);
        return this;
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

/**
 * Job status
 * @memberof Service
 * @type {JobStatus}
 * @static
 */
Service.JobStatus = Object.freeze(JOB_STATUSES);

module.exports = Service;
