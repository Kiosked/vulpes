const EventEmitter = require("eventemitter3");
const merge = require("merge");
const VError = require("verror");
const ChannelQueue = require("@buttercup/channel-queue");
const Storage = require("./storage/Storage.js");
const MemoryStorage = require("./storage/MemoryStorage.js");
const Helper = require("./helper/Helper.js");
const { filterJobInitObject, generateEmptyJob } = require("./jobGeneration.js");
const { selectJobs } = require("./jobQuery.js");
const { jobCanBeRestarted, prepareJobForWorker, updateJobChainForParents } = require("./jobMediation.js");
const { getTimestamp } = require("./time.js");
const { sortJobsByPriority } = require("./jobSorting.js");
const {
    ERROR_CODE_ALREADY_INIT,
    ERROR_CODE_CANNOT_RESTART,
    ERROR_CODE_HELPER_INVALID,
    ERROR_CODE_INVALID_JOB_RESULT,
    ERROR_CODE_INVALID_JOB_STATUS,
    ERROR_CODE_NO_JOB_FOR_ID,
    ERROR_CODE_NOT_INIT,
    JOB_PRIORITY_HIGH,
    JOB_PRIORITY_LOW,
    JOB_PRIORITY_NORMAL,
    JOB_RESULT_TYPE_FAILURE,
    JOB_RESULT_TYPE_FAILURE_SOFT,
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
    SoftFailure: JOB_RESULT_TYPE_FAILURE_SOFT,
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

/**
 * Service for managing jobs
 * @augments EventEmitter
 */
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
        this._shutdown = false;
    }

    /**
     * Helpers attached to the Service
     * @type {Array.<Helper>}
     * @readonly
     * @memberof Service
     */
    get helpers() {
        return this._helpers;
    }

    /**
     * Execute queue for job manipulations
     * @type {Channel}
     * @readonly
     * @memberof Service
     */
    get jobQueue() {
        return this._channelQueue.channel("job");
    }

    /**
     * The storage mechanism used by the Service
     * @type {Storage}
     * @readonly
     * @memberof Service
     */
    get storage() {
        return this._storage;
    }

    /**
     * The current default time-limit (milliseconds)
     * The timelimit is applied to *new* jobs as they're added, and
     * changes to this value do not affect existing jobs.
     * @type {Number}
     * @memberof Service
     */
    get timeLimit() {
        return this._timeLimit;
    }

    set timeLimit(tl) {
        if (typeof tl !== "number" || tl < 0) {
            throw new Error(`Failed setting time limit: Invalid number: ${tl}`);
        }
        this._timeLimit = tl;
    }

    /**
     * Add a new job
     * @param {NewJob=} properties The new job's properties
     * @returns {Promise.<String>} A promise that resolves with the job's ID
     * @memberof Service
     */
    addJob(properties = {}) {
        if (!this._initialised) {
            return Promise.reject(newNotInitialisedError());
        }
        return this.jobQueue.enqueue(() =>
            Promise
                .resolve()
                .then(() => {
                    const initProps = filterJobInitObject(properties);
                    const job = merge.recursive(
                        generateEmptyJob(),
                        { timeLimit: this.timeLimit },
                        initProps
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

    /**
     * Get a job by its ID
     * @param {String} jobID The job ID
     * @returns {Promise.<Object|null>} A promise that resolves with the job
     *  or null if not found
     * @memberof Service
     */
    getJob(jobID) {
        if (!this._initialised) {
            return Promise.reject(newNotInitialisedError());
        }
        return this.storage
            .getItem(`job/${jobID}`)
            // Clone job
            .then(job => job ? merge(true, job) : null);
    }

    /**
     * Get the next job that should be started
     * This method is expensive as it sorts available jobs by priority first,
     * before returning the very next job that should be started.
     * @returns {Promise.<Object|null>} A promise that resolves with the job
     *  or null if none available
     * @memberof Service
     */
    getNextJob() {
        return this
            .queryJobs({
                status: status => [JOB_STATUS_PENDING, JOB_STATUS_STOPPED].includes(status),
                "result.type": type => !type || type === JOB_RESULT_TYPE_FAILURE_SOFT
            })
            .then(sortJobsByPriority)
            .then(jobs => jobs[0] || null);
    }

    /**
     * Perform a jobs query
     * Query for an array of jobs by the job's properties. This uses a library
     * called simple-object-query to query each job. This method uses the
     * library's `find` method.
     * @see https://www.npmjs.com/package/simple-object-query
     * @param {Object} query The object query to perform
     * @returns {Promise.<Array.<Job>>} Returns a promise that resolves with
     *  an array of jobs
     * @memberof Service
     */
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

    /**
     * Initialise the Service instance
     * Must be called before any other operation
     * @returns {Promise} A promise that resolves once initialisation
     *  has been completed
     * @memberof Service
     */
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

    /**
     * Shutdown the instance
     * @memberof Service
     */
    shutdown() {
        this.helpers.forEach(helper => {
            helper.shutdown();
        });
        this._helpers = [];
        this._shutdown = true;
        this._initialised = false;
    }

    /**
     * Start a job
     * @param {String=} jobID The job ID to start. If none provided the Service
     *  will attempt to start the next job by priority. If none is found it
     *  will simply resolve with null. If the job ID is specified by not found
     *  an exception will be thrown.
     * @param {Object=} options Configuration options
     * @returns {Promise.<Object>} A promise that resolves with job data for a
     *  worker
     * @memberof Service
     */
    startJob(jobID = null, { executePredicate = false, restart = false } = {}) {
        if (!this._initialised) {
            return Promise.reject(newNotInitialisedError());
        }
        return this.jobQueue.enqueue(() =>
            (jobID === null || jobID === undefined ? this.getNextJob() : this.getJob(jobID))
                .then(job => {
                    if (!job && !jobID) {
                        // no job to start
                        return Promise.resolve(null);
                    } else if (!job) {
                        // no job found
                        throw new VError(
                            { info: { code: ERROR_CODE_NO_JOB_FOR_ID } },
                            `No job found for ID: ${jobID}`
                        );
                    }
                    if (job.status === JOB_STATUS_STOPPED && (jobCanBeRestarted(job) === false) || restart === true) {
                        throw new VError(
                            { info: { code: ERROR_CODE_CANNOT_RESTART } },
                            `Job not valid to restart: ${job.id}`
                        );
                    } else if (job.status !== JOB_STATUS_PENDING && job.status !== JOB_STATUS_STOPPED) {
                        throw new VError(
                            { info: { code: ERROR_CODE_INVALID_JOB_STATUS } },
                            `Invalid job status (${job.status}): ${job.id}`
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
                            if (!jobID) {
                                this.emit("jobRestarted", { id: job.id });
                            }
                            return prepareJobForWorker(this, job);
                        });
                })
                .catch(err => {
                    throw new VError(err, `Failed starting job (${jobID})`);
                })
        );
    }

    /**
     * Stop a job
     * @param {String} jobID The job's ID to stop
     * @param {ResultType} resultType The result type to set
     * @param {Object=} resultData Optional results data
     * @returns {Promise} A promise that resolves once the job has been
     *  stopped successfully
     * @memberof Service
     */
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
                        });
                })
                .catch(err => {
                    throw new VError(err, `Failed stopping job (${jobID})`);
                })
        );
    }

    /**
     * Attach a helper to the Service instance
     * @param {Helper} helper The helper to attach
     * @return {Service} Returns self, for chaining
     * @memberof Service
     * @throws {VError} Throws if the helper instance is invalid
     */
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
