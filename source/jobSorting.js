const multisort = require("multisort");

/**
 * Job sorting step configuration
 * @typedef {Object} JobSortingStep
 * @property {String} property - The job property to sort by
 * @property {String} direction - The direction to sort in (desc/asc)
 */

const SORT_STEPS_DEFAULT = [
    {
        property: "created",
        direction: "desc"
    }
];
const SORT_MAP = {
    created: {
        asc: "created",
        desc: "!created"
    },
    priority: {
        asc: "priority",
        desc: "!priority"
    },
    status: {
        asc: "status",
        desc: "!status"
    },
    type: {
        asc: "type",
        desc: "!type"
    }
};

function filterDuplicateJobs(jobs) {
    return jobs.filter((job, index, original) => {
        const jobIndex = original.findIndex(searchJob => job.id === searchJob.id);
        return jobIndex === index;
    });
}

/**
 * Sort jobs by some criteria
 * @param {Array.<Job>} jobs The jobs to sort
 * @param {JobSortingStep=} sortSteps Sorting criteia for sorting the jobs
 * @example
 *  // Sort jobs by priority:
 *  sortJobs(
 *      [{ id: "some job" }],
 *      [
 *          { property: "priority", direction: "desc" },
 *          { property: "created", direction: "asc" }
 *      ]
 *  );
 *  // This sorts the jobs by priority (highest) first, and then by created
 *  // (oldest) second..
 * @returns {Array.<Job>} An array of sorted jobs
 */
function sortJobs(jobs, sortSteps = SORT_STEPS_DEFAULT) {
    const sortCriteria = sortSteps.reduce((criteria, step) => {
        const { property, direction } = step;
        if (!/^(asc|desc)$/i.test(direction)) {
            throw new Error(`Failed sorting jobs: Invalid sort direction: ${direction}`);
        } else if (Object.keys(SORT_MAP).includes(property) === false) {
            throw new Error(`Failed sorting jobs: Invalid sort property: ${property}`);
        }
        return [...criteria, SORT_MAP[property][direction.toLowerCase()]];
    }, []);
    return multisort([...jobs], sortCriteria);
}

/**
 * Sort jobs by priority
 * @param {Array.<Job>} jobs An array of jobs
 * @returns {Array.<Job>} An array of sorted jobs
 * @see sortJobs
 */
function sortJobsByPriority(jobs) {
    return sortJobs(jobs, [
        { property: "priority", direction: "desc" },
        { property: "created", direction: "asc" }
    ]);
}

module.exports = {
    filterDuplicateJobs,
    sortJobs,
    sortJobsByPriority
};
