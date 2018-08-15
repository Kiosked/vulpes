const uuid = require("uuid/v4");
const { getTimestamp } = require("./time.js");
const {
    JOB_PRIORITY_NORMAL,
    JOB_STATUS_PENDING
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
 */

const CONFIGURABLE_JOB_KEYS = [
    "type",
    "priority",
    "parents",
    "predicate",
    "data",
    "timeLimit",
    "attemptsMax"
];

function filterJobInitObject(info) {
    return Object.keys(info).reduce((output, nextKey) => {
        if (CONFIGURABLE_JOB_KEYS.indexOf(nextKey) >= 0) {
            output[nextKey] = info[nextKey];
        }
        return output;
    }, {});
}

/**
 * A job
 * @typedef {Object} Job
 * @property {String} id - The job's ID
 * @property {Array.<String>} chain - An array of IDs that form the job's chain
 * @property {String} type - The job type (consumer controlled)
 * @property {Status} status - The current job state
 * @property {Priority} priority - The job's priority
 * @property {Number} created - The creation timestamp of the job
 * @property {Array.<String>} parents - An array of IDs of the job's parents
 * @property {String} predicate - Predicate function for the job
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
 * @property {Number} attemptsMax - Maximum attempts that can be undertaken
 *  on the job before it is failed
 */

/**
 * Generate an empty job
 * @returns {Job} A new empty job
 */
function generateEmptyJob() {
    const id = uuid();
    return {
        ["@@type"]: "vulpes/job",
        id,
        chain: [id],
        type: "generic",
        status: JOB_STATUS_PENDING,
        priority: JOB_PRIORITY_NORMAL,
        created: getTimestamp(),
        parents: [],
        predicate: "",
        data: {},
        result: {
            data: {},
            type: null
        },
        times: {
            firstStarted: null,
            started: null,
            stopped: null,
            completed: null
        },
        timeLimit: null,
        attempts: 0,
        attemptsMax: 1
    };
}

module.exports = {
    filterJobInitObject,
    generateEmptyJob
};
