function prepareJobForWorker(service, job) {
    const {
        id,
        type,
        data,
        parents,
        timeLimit
    } = job;
    const workerJob = {
        id,
        type,
        data,
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
    prepareJobForWorker,
    updateJobChainForParents
};
