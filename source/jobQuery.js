const { find } = require("simple-object-query");

function selectJob(jobs, query = {}) {
    const [job] = selectJobs(jobs, query);
    return job || null;
}

function selectJobs(jobs, query = {}) {
    const results = find(jobs, query);
    return results.length > 0 && Array.isArray(results[0]) ? results[0] : results;
}

module.exports = {
    selectJob,
    selectJobs
};
