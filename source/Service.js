const EventEmitter = require("eventemitter3");
const merge = require("merge");
const VError = require("verror");
const ChannelQueue = require("@buttercup/channel-queue");
const endOfStream = require("end-of-stream");
const Scheduler = require("./Scheduler.js");
const Tracker = require("./Tracker.js");
const Storage = require("./storage/Storage.js");
const MemoryStorage = require("./storage/MemoryStorage.js");
const Helper = require("./helper/Helper.js");
const ArtifactManager = require("./ArtifactManager.js");
const {
    filterJobInitObject,
    generateEmptyJob,
    validateJobProperties
} = require("./jobGeneration.js");
const { jobMatches } = require("./jobQuery.js");
const {
    addJobBatch,
    ensureParentsComplete,
    jobCanBeRestarted,
    jobSatisfiesPredicates,
    pickFirstJob,
    prepareJobForWorker
} = require("./jobMediation.js");
const { getTimestamp } = require("./time.js");
const { filterDuplicateJobs, sortJobs, sortJobsByPriority } = require("./jobSorting.js");
const { updateStatsForJob } = require("./jobStats.js");
const { removeAllLegacyLogs } = require("./migrations.js");
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
    ITEM_TYPE,
    ITEM_TYPE_JOB,
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

const ITEM_JOB_PREFIX = /^job\//;

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
    /**
     * @typedef {Object} ServiceOptions
     * @property {ArtifactManager=} artifactManager - Override for the ArtifactManager instance
     * @property {Boolean=} enableScheduling - Control whether or not the scheduling piece of the Service
     *  is enabled or not. Default is true.
     */

    /**
     * Contrsuctor for the Service class
     * @param {ServiceOptions=} param0 Options for the new service
     */
    constructor() {
        super();
        let storage,
            options = {};
        if (arguments[0] instanceof Storage) {
            storage = arguments[0];
            options = arguments[1] || {};
        } else if (arguments[0] && typeof arguments[0] === "object") {
            options = arguments[0];
        }
        storage = storage || options.storage || new MemoryStorage();
        const { artifactManager = new ArtifactManager(), enableScheduling = true } = options;
        if (storage instanceof Storage !== true) {
            throw new Error("Failed instantiating Service: Provided storage is of invalid type");
        }
        this._storage = storage;
        this._artifactManager = artifactManager;
        this._timeLimit = JOB_TIMELIMIT_DEFAULT;
        this._channelQueue = new ChannelQueue();
        this._scheduler = new Scheduler(this);
        if (!enableScheduling) {
            this._scheduler.enabled = false;
        }
        this._tracker = new Tracker(this);
        this._helpers = [];
        this._initialised = false;
        this._shutdown = false;
    }

    /**
     * Check that the instance is alive and not shut down
     * @type {Boolean}
     * @readonly
     * @memberof Service
     */
    get alive() {
        return !this._shutdown;
    }

    /**
     * Artifact manager instance
     * @type {ArtifactManager}
     * @readonly
     * @memberof Service
     */
    get artifactManager() {
        return this._artifactManager;
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
     * Whether the instance is initialised or not
     * @type {Boolean}
     * @readonly
     * @memberof Service
     */
    get initialised() {
        return this._initialised;
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
     * The scheduler instance for scheduling tasks
     * @type {Scheduler}
     * @readonly
     * @memberof Service
     */
    get scheduler() {
        return this._scheduler;
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

    /**
     * Analytics tracking instance
     * @type {Tracker}
     * @readonly
     * @memberof Service
     */
    get tracker() {
        return this._tracker;
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
            const job = validateJobProperties(
                merge.recursive(generateEmptyJob(), { timeLimit: this.timeLimit }, initProps)
            );
            await this.storage.setItem(job.id, job);
            this.emit("jobAdded", { id: job.id });
            return job.id;
        });
    }

    /**
     * Add an array of new jobs (a batch)
     * @param {NewJob[]} jobs An array of new job objects
     * @returns {Promise.<Job[]>} An array of newly created jobs
     * @memberof Service
     */
    async addJobs(jobs) {
        if (!this._initialised) {
            return Promise.reject(newNotInitialisedError());
        }
        return await addJobBatch(this, jobs);
    }

    /**
     * Archive a job so it will be removed from queries
     * @param {String} jobID The job ID
     * @returns {Promise}
     * @memberof Service
     */
    async archiveJob(jobID) {
        await this.updateJob(
            jobID,
            { archived: true, times: { archived: getTimestamp() } },
            { filterProps: false }
        );
        this.emit("jobArchived", { id: jobID });
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
        return await this.storage.getItem(jobID);
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
        await this.storage.initialise();
        await this.artifactManager.initialise(this);
        await this.scheduler.initialise();
        this._initialised = true;
        await removeAllLegacyLogs(this);
        for (const helper of this.helpers) {
            await helper.initialise();
        }
        this.emit("initialised");
    }

    /**
     * @typedef {Object} QueryJobsOptions
     * @property {Number=} limit - Limit the number of jobs that are returned by the
     *  query. Defaults to Infinity.
     * @property {String=} sort - Property to sort by. Defaults to "created". Can be
     *  set to created/status/priority/type.
     * @property {String=} order - Sorting order: asc/desc (default "desc")
     * @property {Number=} start - The starting offset (index) for when to start
     *  collecting search results. Should be used together with `limit` to perform
     *  pagination. Defaults to 0.
     */

    /**
     * Perform a jobs query
     * Query for an array of jobs by the job's properties. This method streams all
     * jobs from storage, testing each individually against the query. Once a group
     * of jobs is collected, further sorting and limiting are applied before once
     * again streaming the jobs to find the full matches to return.
     * @param {Object=} query The object query to perform
     * @param {QueryJobsOptions=} options Options for querying jobs, like sorting
     * @returns {Promise.<Array.<Job>>} Returns a promise that resolves with
     *  an array of jobs
     * @memberof Service
     */
    async queryJobs(
        query = {},
        { start = 0, limit = Infinity, sort = "created", order = "desc" } = {}
    ) {
        if (!this._initialised) {
            throw newNotInitialisedError();
        }
        const waitForStream = stream =>
            new Promise((resolve, reject) =>
                endOfStream(stream, err => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                })
            );
        query.archived =
            typeof query.archived === "boolean"
                ? query.archived
                : archived => archived === false || archived === undefined;
        const jobStreamInitial = await this.storage.streamItems();
        const stats = this.tracker.statsTemplate;
        // First build an index of all job results
        const jobsIndex = [];
        jobStreamInitial.on("data", job => {
            if (job[ITEM_TYPE] === ITEM_TYPE_JOB) {
                // Handle query check first
                if (jobMatches(job, query)) {
                    jobsIndex.push({
                        id: job.id,
                        type: job.type,
                        status: job.status,
                        priority: job.priority,
                        created: job.created
                    });
                }
                // Process jobs for stats updates
                updateStatsForJob(stats, job);
            }
        });
        await waitForStream(jobStreamInitial);
        // Update stats
        this.tracker.updateStats(stats);
        // Sort initial list
        const allJobsSorted = sortJobs(jobsIndex, [
            {
                property: sort,
                direction: order
            }
        ]);
        // Select range
        const finalRange = allJobsSorted.slice(start, limit === Infinity ? limit : start + limit);
        // Final selection
        const jobs = [];
        const jobStreamFinal = await this.storage.streamItems();
        jobStreamFinal.on("data", job => {
            if (finalRange.find(stub => stub.id === job.id)) {
                // Job is in the set
                jobs.push(job);
            }
        });
        await waitForStream(jobStreamFinal);
        // Final sort
        const output = sortJobs(jobs, [
            {
                property: sort,
                direction: order
            }
        ]);
        output.total = allJobsSorted.length;
        return output;
    }

    /**
     * Completely delete a job
     * @param {String} jobID The ID of the job to reset
     * @returns {Promise} A promise that resolves once the job has
     *  been removed
     * @memberof Service
     */
    async removeJob(jobID) {
        await this.storage.removeItem(jobID);
        this.emit("jobDeleted", { id: jobID });
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
        if (
            typeof job.predicate.attemptsMax === "number" &&
            job.attempts >= job.predicate.attemptsMax
        ) {
            job.predicate.attemptsMax = job.attempts + 1;
        }
        job.status = JOB_STATUS_PENDING;
        job.result.type = null;
        await this.storage.setItem(job.id, job);
        this.emit("jobReset", { id: job.id });
    }

    /**
     * Shutdown the instance
     * @returns {Promise}
     * @memberof Service
     */
    async shutdown() {
        this.scheduler.shutdown();
        this.helpers.forEach(helper => {
            helper.shutdown();
        });
        await this.artifactManager.shutdown();
        await this.storage.shutdown();
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
                    const { satisfies, predicate } = await jobSatisfiesPredicates(this, job);
                    if (!satisfies) {
                        throw new VError(
                            { info: { code: ERROR_CODE_PREDICATE_NOT_SATISFIED, predicate } },
                            `Predicate '${predicate}' not satisfied for job: ${job.id}`
                        );
                    }
                }
                job.status = JOB_STATUS_RUNNING;
                job.times.started = getTimestamp();
                if (job.times.firstStarted === null) {
                    job.times.firstStarted = job.times.started;
                }
                job.attempts += 1;
                await this.storage.setItem(job.id, job);
                this.emit("jobStarted", { id: job.id });
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
    stopJob(jobID, resultType, resultData = {}) {
        if (!this._initialised) {
            return Promise.reject(newNotInitialisedError());
        }
        return this.jobQueue.enqueue(() =>
            this.getJob(jobID)
                .then(job => {
                    if (job.status === JOB_STATUS_STOPPED) {
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
                    // Merge data payloads
                    Object.assign(job.result.data, job.data, resultData);
                    job.times.stopped = getTimestamp();
                    if (resultType === JOB_RESULT_TYPE_SUCCESS) {
                        job.times.completed = job.times.stopped;
                    }
                    return this.storage.setItem(job.id, job).then(() => {
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
     * Update job options
     * @typedef {Object} UpdateJobOptions
     * @property {Boolean=} filterProps - Filter all properties that should
     *  NOT be overwritten. This is true by default. Using 'false' here may
     *  result in unpredictable and dangerous behaviour. Use at our own
     *  peril.
     * @property {Boolean=} stripResults - Remove existing results before
     *  updating the job data. Default is false.
     */

    /**
     * Update a job's properties
     * @param {String} jobID The job ID
     * @param {Object} mergedProperties The properties to merge (overwrite)
     * @param {UpdateJobOptions=} options Update method options
     * @memberof Service
     */
    updateJob(jobID, mergedProperties = {}, { filterProps = true, stripResults = false } = {}) {
        if (!this._initialised) {
            return Promise.reject(newNotInitialisedError());
        }
        return this.jobQueue.enqueue(() =>
            this.getJob(jobID)
                .then(async job => {
                    if (stripResults) {
                        job.result.data = {};
                    }
                    const updateProps = filterProps
                        ? filterJobInitObject(mergedProperties)
                        : mergedProperties;
                    const updatedJob = validateJobProperties(merge.recursive({}, job, updateProps));
                    await this.storage.setItem(job.id, updatedJob);
                    this.emit("jobUpdated", {
                        id: job.id,
                        original: job,
                        updated: updatedJob
                    });
                })
                .catch(err => {
                    throw new VError(err, `Failed updating job (${jobID})`);
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
