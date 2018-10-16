const nested = require("nested-property");

function jobMatches(job, query) {
    const keys = Object.keys(query);
    if (keys.length <= 0) {
        return true;
    }
    return keys.every(key => {
        const value = nested.get(job, key);
        const validator = query[key];
        if (validator instanceof RegExp) {
            return validator.test(value);
        } else if (typeof validator === "function") {
            return !!validator(value);
        } else if (["number", "string", "boolean"].includes(typeof validator)) {
            return validator === value;
        }
        throw new Error(
            `Failed validating job query: Invalid query property '${key}' is of an unrecognised type`
        );
    });
}

function selectJob(jobs, query = {}) {
    const [job] = selectJobs(jobs, query);
    return job || null;
}

function selectJobs(jobs, query = {}) {
    return jobs.filter(job => jobMatches(job, query));
}

module.exports = {
    selectJob,
    selectJobs
};
