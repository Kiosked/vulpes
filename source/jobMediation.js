const VError = require("verror");
const {
    ERROR_CODE_PARENTS_INCOMPLETE,
    JOB_RESULT_TYPE_SUCCESS,
    JOB_RESULT_TYPES_RESTARTABLE_REXP,
    JOB_STATUS_STOPPED
} = require("./symbols.js");

function ensureParentsComplete(service, job) {
    if (job.parents.length === 0) {
        return Promise.resolve();
    }
    return Promise
        .all(job.parents.map(parentID =>
            service
                .getJob(parentID)
                .then(job => ({
                    status: job.status,
                    result: job.result.type
                }))
        ))
        .then(jobStates => {
            if (!jobStates.every(jobState => jobState.status === JOB_STATUS_STOPPED && jobState.result === JOB_RESULT_TYPE_SUCCESS)) {
                throw new VError(
                    { info: { code: ERROR_CODE_PARENTS_INCOMPLETE } },
                    `Job ${job.id} has parents that have not completed successfully`
                );
            }
        });
}

function jobCanBeRestarted(job) {
    return job.status === JOB_STATUS_STOPPED &&
        (JOB_RESULT_TYPES_RESTARTABLE_REXP.test(job.result.type) || job.result.type === null);
}

function prepareJobForWorker(service, job) {
    const {
        id,
        type,
        data,
        parents,
        priority,
        status,
        timeLimit
    } = job;
    const workerJob = {
        id,
        type,
        data,
        priority,
        status,
        timeLimit
    };
    return service
        .queryJobs({
            id: jobID => parents.indexOf(jobID) >= 0
        })
        .then(parentJobs => {
            parentJobs.forEach(parentJob => {
                workerJob.data = Object.assign(
                    {},
                    parentJob.data,
                    parentJob.result.data,
                    workerJob.data
                );
            });
            return workerJob;
        });
}

function updateJobChainForParents(service, job) {
    const chain = [];
    let work = Promise.resolve();
    job.parents.forEach(parentJobID => {
        work = work.then(() => {
            return service.getJob(parentJobID).then(parentJob => {
                chain.push(...parentJob.chain);
            });
        });
    });
    return work.then(() => {
        if (chain.length > 0) {
            job.chain = chain;
        }
        return job;
    });
}

module.exports = {
    ensureParentsComplete,
    jobCanBeRestarted,
    prepareJobForWorker,
    updateJobChainForParents
};
