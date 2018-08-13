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
    updateJobChainForParents
};
