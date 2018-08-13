const { find } = require("simple-object-query");

function selectJob(jobs, query) {
    const [job] = selectJobs(jobs, query);
    return job || null;
}

function selectJobs(jobs, query) {
    return find(jobs, query);
}

module.exports = {
    selectJob,
    selectJobs
};
