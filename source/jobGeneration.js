const uuid = require("uuid/v4");
const ms = require("ms");
const nested = require("nested-property");
const { getTimestamp } = require("./time.js");
const { cloneJob } = require("./cloning.js");
const {
    ITEM_TYPE,
    ITEM_TYPE_JOB,
    JOB_PRIORITY_NORMAL,
    JOB_RESULT_TYPES_REXP,
    JOB_STATUS_PENDING,
    JOB_STATUS_REXP
} = require("./symbols.js");

/**
 * New job data
 * @typedef {Object} NewJob
 * @property {String=} type - The type of job (custom, controlled by the consumer)
 * @property {Priority=} priority - The priority of the job (defaults to normal priority)
 * @property {Array.<String>=} parents - Parents of this job
 * @property {String=} predicate - The predicate function that should evaluate to true
 *  before this job can run
 * @property {Object=} data - Data for this job
 * @property {Number=} timeLimit - Time limit in milliseconds (defaults to the default
 *  timelimit on the Service instance). Set to null to disable timeouts.
 * @property {Number=} attemptsMax - The maximum number of soft failures that can occur
 *  before this job
 * @property {Boolean=} archived - Determining if job will be excluded from queries or not
 */

const CONFIGURABLE_JOB_KEYS = [
    "data",
    "parents",
    "predicate",
    "priority",
    "result.data",
    "result.type",
    "timeLimit",
    "type"
];
const DEFAULT_JOB_TYPE = "generic";
const JOB_VALIDATION = {
    archived: [a => typeof a === "boolean"],
    data: [d => typeof d === "object" && d !== null, () => ({})],
    created: [c => c > 0, () => Date.now()],
    parents: [p => Array.isArray(p), () => []],
    predicate: [p => typeof p === "object" && p !== null, () => generateEmptyJob().predicate],
    "predicate.attemptsMax": [a => a === null || a > 0, null],
    "predicate.locked": [l => typeof l === "boolean", false],
    "predicate.timeBetweenRetries": [
        t => t === null || t >= 0,
        () => generateEmptyJob().predicate.timeBetweenRetries
    ],
    priority: [p => typeof p === "number" && !isNaN(p), JOB_PRIORITY_NORMAL],
    "result.data": [d => typeof d === "object" && d !== null, () => ({})],
    "result.type": [t => t === null || JOB_RESULT_TYPES_REXP.test(t), null],
    timeLimit: [t => t === null || t > 0, null],
    type: [t => typeof t === "string", DEFAULT_JOB_TYPE],
    status: [s => JOB_STATUS_REXP.test(s), JOB_STATUS_PENDING]
};

function filterJobInitObject(info) {
    const output = {};
    CONFIGURABLE_JOB_KEYS.forEach(key => {
        const value = nested.get(info, key);
        if (typeof value !== "undefined") {
            nested.set(output, key, value);
        }
    });
    return output;
}

/**
 * A job
 * @typedef {Object} Job
 * @property {String} id - The job's ID
 * @property {String} type - The job type (consumer controlled)
 * @property {Status} status - The current job state
 * @property {Priority} priority - The job's priority
 * @property {Number} created - The creation timestamp of the job
 * @property {Array.<String>} parents - An array of IDs of the job's parents
 * @property {Object} predicate - Predicate restraints for the job
 * @property {Number} predicate.attemptsMax - Maximum attempts that can be undertaken
 *  on the job before it is failed
 * @property {Number} predicate.timeBetweenRetries - Milliseconds between retries
 *  (minimum)
 * @property {Object} data - The data for the job (incoming)
 * @property {Object} result - Result information
 * @property {ResultType|null} result.type - The type of result (null if not
 *  stopped at least once)
 * @property {Object} result.data - Resulting data from the last execution
 *  (outgoing)
 * @property {Object} times - Collection of notable timestamps for the job
 * @property {Number|null} times.firstStarted - Timestamp for when the job was
 *  first started
 * @property {Number|null} times.started - Timestamp for when the job was last
 *  started
 * @property {Number|null} times.stopped - Timestamp for when the job was last
 *  stopped
 * @property {Number|null} times.completed - Timestamp for when the job was
 *  completed successfully
 * @property {Number|null} timeLimit - Time limitation for the job's
 *  execution. null means no limit.
 * @property {Number} attempts - Number of attempts the job has had
 * @property {Boolean} archived - True means the job will be archived and excluded from queries
 */

/**
 * Generate an empty job
 * @returns {Job} A new empty job
 */
function generateEmptyJob() {
    const id = uuid();
    return {
        [ITEM_TYPE]: ITEM_TYPE_JOB,
        id,
        type: DEFAULT_JOB_TYPE,
        status: JOB_STATUS_PENDING,
        priority: JOB_PRIORITY_NORMAL,
        created: getTimestamp(),
        parents: [],
        predicate: {
            attemptsMax: null,
            locked: false,
            timeBetweenRetries: ms("30s")
        },
        data: {},
        result: {
            data: {},
            type: null
        },
        times: {
            archived: null,
            firstStarted: null,
            started: null,
            stopped: null,
            completed: null
        },
        timeLimit: null,
        attempts: 0,
        archived: false
    };
}

function validateJobProperties(job) {
    const output = cloneJob(job);
    Object.keys(JOB_VALIDATION).forEach(key => {
        const [test, defaultValue] = JOB_VALIDATION[key];
        const value = nested.get(output, key);
        if (!test(value)) {
            const newValue = typeof defaultValue === "function" ? defaultValue() : defaultValue;
            nested.set(output, key, newValue);
        }
    });
    return output;
}

module.exports = {
    filterJobInitObject,
    generateEmptyJob,
    validateJobProperties
};
