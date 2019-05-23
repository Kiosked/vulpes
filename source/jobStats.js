const ms = require("ms");
const {
    JOB_RESULT_TYPE_FAILURE,
    JOB_RESULT_TYPE_FAILURE_SOFT,
    JOB_RESULT_TYPE_SUCCESS,
    JOB_RESULT_TYPE_TIMEOUT,
    JOB_STATUS_PENDING,
    JOB_STATUS_RUNNING,
    JOB_STATUS_STOPPED
} = require("./symbols.js");

const HOUR = ms("1h");

/**
 * Updates the properties in `jobStats` according to the state
 * of the `job`
 * @param {Object} jobStats Job stats - mutated during execution (not pure)
 * @param {Job} job A raw job
 */
function updateStatsForJob(jobStats, job) {
    jobStats.totalJobs += 1;
    switch (job.status) {
        case JOB_STATUS_PENDING:
            jobStats.pendingJobs += 1;
            break;
        case JOB_STATUS_RUNNING:
            jobStats.runningJobs += 1;
            break;
        case JOB_STATUS_STOPPED:
            jobStats.stoppedJobs += 1;
            break;
    }
    if (
        [JOB_RESULT_TYPE_FAILURE, JOB_RESULT_TYPE_FAILURE_SOFT, JOB_RESULT_TYPE_TIMEOUT].indexOf(
            job.result.type
        ) >= 0
    ) {
        jobStats.failedJobs += 1;
    } else if (job.result.type === JOB_RESULT_TYPE_SUCCESS) {
        jobStats.succeededJobs += 1;
    }
    const now = Date.now();
    if (job.times.completed && now - job.times.completed <= HOUR) {
        jobStats.jobsInLastHour += 1;
    }
}

module.exports = {
    updateStatsForJob
};
