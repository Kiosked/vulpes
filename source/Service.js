const EventEmitter = require("eventemitter3");
const merge = require("merge");
const VError = require("verror");
const ChannelQueue = require("@buttercup/channel-queue");
const Storage = require("./storage/Storage.js");
const MemoryStorage = require("./storage/MemoryStorage.js");
const Helper = require("./helper/Helper.js");
const { filterJobInitObject, generateEmptyJob } = require("./jobGeneration.js");
const { selectJobs } = require("./jobQuery.js");
const {
    addJobBatch,
    ensureParentsComplete,
    jobCanBeRestarted,
    jobSatisfiesPredicates,
    pickFirstJob,
    prepareJobForWorker
} = require("./jobMediation.js");
const { getTimestamp } = require("./time.js");
const { filterDuplicateJobs, sortJobsByPriority } = require("./jobSorting.js");
const {
    ERROR_CODE_ALREADY_INIT,
    ERROR_CODE_ALREADY_SUCCEEDED,
    ERROR_CODE_CANNOT_RESTART,
    ERROR_CODE_HELPER_INVALID,
    ERROR_CODE_INVALID_JOB_RESULT,
    ERROR_CODE_INVALID_JOB_STATUS,
    ERROR_CODE_NO_JOB_FOR_ID,
    ERROR_CODE_NOT_INIT,
    ERROR_CODE_PREDICATE_NOT_SATISFIED,
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

const newNotInitialisedError = () =>
    new VError({ info: { code: ERROR_CODE_NOT_INIT } }, "Service not initialised");

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
    async addJob(properties = {}) {
        if (!this._initialised) {
            return Promise.reject(newNotInitialisedError());
        }
        return this.jobQueue.enqueue(async () => {
            const initProps = filterJobInitObject(properties);
            const job = merge.recursive(
                generateEmptyJob(),
                { timeLimit: this.timeLimit },
                initProps
            );
            await this.storage.setItem(`job/${job.id}`, job);
            this.emit("jobAdded", { id: job.id });
            return job.id;
        });
    }

    async addJobs(jobs) {
        if (!this._initialised) {
            return Promise.reject(newNotInitialisedError());
        }
        return await addJobBatch(this, jobs);
    }

    /**
     * Get a job by its ID
     * @param {String} jobID The job ID
     * @returns {Promise.<Object|null>} A promise that resolves with the job
     *  or null if not found
     * @memberof Service
     */
    async getJob(jobID) {
        if (!this._initialised) {
            return Promise.reject(newNotInitialisedError());
        }
        return await this.storage
            .getItem(`job/${jobID}`)
            // Clone job
            .then(job => (job ? merge(true, job) : null));
    }

    /**
     * Options for fetching job children
     * @typedef {Object} GetJobChildrenOptions
     * @property {Boolean=} fullProgeny - Fetch the full progeny of the job
     *  (all of the children and their children)
     */

    /**
     * Get a job's children (shallow)
     * @param {String} jobID The job ID
     * @param {GetJobChildrenOptions=} options Options for fetching
     * @returns {Promise.<Array.<Job>>} A promise that resolves with an array
     *  of child jobs
     * @memberof Service
     */
    async getJobChildren(jobID, { fullProgeny = false } = {}) {
        const children = await this.queryJobs({
            parents: parents => parents.includes(jobID)
        });
        if (fullProgeny) {
            const [, options] = arguments;
            await Promise.all(
                children.map(async child => {
                    const childJobs = await this.getJobChildren(child.id, options);
                    children.push(...childJobs);
                })
            );
        }
        return filterDuplicateJobs(children);
    }

    /**
     * Options for fetching job parents
     * @typedef {Object} GetJobParentsOptions
     * @property {Boolean=} fullAncestry - Fetch the full fullAncestry of the job
     *  (all of the parents and their parents)
     */

    /**
     * Get the parents of a job
     * @param {String} jobID The ID of the job
     * @param {GetJobParentsOptions=} options Job fetching options
     * @returns {Promise.<Array.<Job>>} A promise that resolves with an array of
     *  jobs
     * @memberof Service
     */
    async getJobParents(jobID, { fullAncestry = false } = {}) {
        const job = await this.getJob(jobID);
        if (job.parents.length <= 0) {
            return Promise.resolve([]);
        }
        const parents = await Promise.all(job.parents.map(parentID => this.getJob(parentID)));
        if (fullAncestry) {
            const [, options] = arguments;
            const parentsParents = await Promise.all(
                job.parents.map(parentID => this.getJobParents(parentID, options))
            );
            parentsParents.forEach(jobs => {
                parents.push(...jobs);
            });
        }
        return filterDuplicateJobs(parents);
    }

    /**
     * Options for fetching a job tree
     * @typedef {Object} GetJobTreeOptions
     * @property {Boolean=} resolveParents - Fetch the ancestry of the specified
     *  job, not just the children. Defaults to true (full tree).
     */

    /**
     * Get a job tree
     * Fetches an array of jobs that form the relationship tree
     * (parents-children) of a certain job.
     * @param {String} jobID The job ID to branch from
     * @param {GetJobTreeOptions=} options Fetch options for the tree
     *  processing
     * @returns {Promise.<Array.<Job>>} A deduplicated array of jobs containing,
     *  if configured, all of the job's ancestry and progeny. Will also contain
     *  the job itself.
     * @memberof Service
     */
    async getJobTree(jobID, { resolveParents = true } = {}) {
        const job = await this.getJob(jobID);
        if (!job) {
            return [];
        }
        const tree = [job];
        if (resolveParents) {
            const parents = await this.getJobParents(jobID, { fullAncestry: true });
            tree.push(...parents);
        }
        const children = await this.getJobChildren(jobID, { fullProgeny: true });
        tree.push(...children);
        return filterDuplicateJobs(tree);
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
        return this.queryJobs({
            status: status => [JOB_STATUS_PENDING, JOB_STATUS_STOPPED].includes(status),
            "result.type": type => !type || type === JOB_RESULT_TYPE_FAILURE_SOFT
        })
            .then(sortJobsByPriority)
            .then(jobs => pickFirstJob(this, jobs))
            .then(job => job || null);
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
        return (
            this.storage
                .getAllItems()
                // Search
                .then(items => selectJobs(items, query))
                // Clone
                .then(items => items.map(item => merge(true, item)))
        );
    }

    /**
     * Initialise the Service instance
     * Must be called before any other operation
     * @returns {Promise} A promise that resolves once initialisation
     *  has been completed
     * @memberof Service
     */
    async initialise() {
        if (this._initialised) {
            return Promise.reject(
                new VError(
                    { info: { code: ERROR_CODE_ALREADY_INIT } },
                    "Service already initialised"
                )
            );
        }
        this._initialised = true;
        await this.storage.initialise();
    }

    /**
     * Reset a failed job
     * @param {String} jobID The ID of the job to reset
     * @returns {Promise} A promise that resolves once the job has
     *  been reset
     * @memberof Service
     */
    async resetJob(jobID) {
        if (!this._initialised) {
            return Promise.reject(newNotInitialisedError());
        }
        const job = await this.getJob(jobID);
        if (job.status !== JOB_STATUS_STOPPED) {
            throw new VError(
                { info: { code: ERROR_CODE_INVALID_JOB_STATUS } },
                `Invalid job status (${job.status}): ${job.id}`
            );
        } else if (job.result.type === JOB_RESULT_TYPE_SUCCESS) {
            throw new VError(
                { info: { code: ERROR_CODE_ALREADY_SUCCEEDED } },
                `Job already succeeded: ${job.id}`
            );
        }
        if (job.attempts >= job.predicate.attemptsMax) {
            job.predicate.attemptsMax += 1;
        }
        job.status = JOB_STATUS_PENDING;
        if (job.result.type === JOB_RESULT_TYPE_TIMEOUT) {
            job.result.type = JOB_RESULT_TYPE_FAILURE_SOFT;
        }
        await this.storage.setItem(`job/${job.id}`, job);
        this.emit("jobReset", { id: job.id });
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
     * Start job options
     * @typedef {Object} StartJobOptions
     * @property {Boolean=} executePredicate - Execute the predicate function
     *  before running the task
     */

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
    async startJob(jobID = null, { executePredicate = true } = {}) {
        if (!this._initialised) {
            return Promise.reject(newNotInitialisedError());
        }
        return this.jobQueue
            .enqueue(async () => {
                const job = await (jobID === null || jobID === undefined
                    ? this.getNextJob()
                    : this.getJob(jobID));
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
                if (job.status === JOB_STATUS_STOPPED && jobCanBeRestarted(job) === false) {
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
                await ensureParentsComplete(this, job);
                if (executePredicate) {
                    const satisfiesPredicate = await jobSatisfiesPredicates(this, job);
                    if (!satisfiesPredicate) {
                        throw new VError(
                            { info: { code: ERROR_CODE_PREDICATE_NOT_SATISFIED } },
                            `Predicate not satisfied for job: ${job.id}`
                        );
                    }
                }
                job.status = JOB_STATUS_RUNNING;
                job.times.started = getTimestamp();
                if (job.times.firstStarted === null) {
                    job.times.firstStarted = job.times.started;
                }
                job.attempts += 1;
                await this.storage.setItem(`job/${job.id}`, job);
                this.emit("jobStarted", { id: job.id });
                if (!jobID) {
                    this.emit("jobRestarted", { id: job.id });
                }
                return await prepareJobForWorker(this, job);
            })
            .catch(err => {
                throw new VError(err, `Failed starting job (${jobID})`);
            });
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
    stopJob(jobID, resultType, resultData = {}, merge = true) {
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
                    if (merge) {
                        Object.assign(job.result.data, resultData);
                    } else {
                        job.result.data = Object.assign({}, resultData);
                    }
                    job.times.stopped = getTimestamp();
                    if (resultType === JOB_RESULT_TYPE_SUCCESS) {
                        job.times.completed = job.times.stopped;
                    }
                    return this.storage.setItem(`job/${job.id}`, job).then(() => {
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

    // updateJob(jobID, mergedProperties = {}, { filterProps = true } = {}) {
    //     if (!this._initialised) {
    //         return Promise.reject(newNotInitialisedError());
    //     }
    //     return this.jobQueue.enqueue(() =>
    //         this.getJob(jobID)
    //             .then(async job => {
    //                 const updateProps = filterProps
    //                     ? filterJobInitObject(mergedProperties)
    //                     : mergedProperties;
    //                 const updatedJob = merge.recursive(
    //                     {},
    //                     job,
    //                     updateProps
    //                 );
    //                 await this.storage.setItem(`job/${job.id}`, updatedJob);
    //                 this.emit("jobUpdated", {
    //                     id: job.id,
    //                     original: job,
    //                     updated: updatedJob
    //                 });
    //             })
    //             .catch(err => {
    //                 throw new VError(err, `Failed updating job (${jobID})`);
    //             })
    //     );
    // }

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
