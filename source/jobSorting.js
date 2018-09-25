const multisort = require("multisort");

const SORT_MAP = {
    created: {
        asc: "created",
        desc: "!created"
    },
    priority: {
        asc: "priority",
        desc: "!priority"
    },
    type: {
        asc: "type",
        desc: "!type"
    }
};

// const JOB_PRIORITY_SORT_CRITERIA = [
//     "!priority", // Priority is descending (higher prio first)
//     "created" // Created is ascending (older timestamp first)
// ];

function filterDuplicateJobs(jobs) {
    return jobs.filter((job, index, original) => {
        const jobIndex = original.findIndex(searchJob => job.id === searchJob.id);
        return jobIndex === index;
    });
}

// function sortJobsByPriority(jobs) {
//     return multisort([...jobs], JOB_PRIORITY_SORT_CRITERIA);
// }

module.exports = {
    filterDuplicateJobs
    // sortJobsByPriority
};
