const multisort = require("multisort");

const JOB_PRIORITY_SORT_CRITERIA = [
    "!priority", // Priority is descending (higher prio first)
    "created" // Created is ascending (older timestamp first)
];

function sortJobsByPriority(jobs) {
    return multisort([...jobs], JOB_PRIORITY_SORT_CRITERIA);
}

module.exports = {
    sortJobsByPriority
};
