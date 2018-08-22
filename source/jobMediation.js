const VError = require("verror");
const {
    ERROR_CODE_PARENTS_INCOMPLETE,
    JOB_RESULT_TYPE_SUCCESS,
    JOB_RESULT_TYPES_RESTARTABLE_REXP,
    JOB_STATUS_STOPPED,
    UUID_REXP
} = require("./symbols.js");

async function addJobBatch(service, jobs) {
    const results = JSON.parse(JSON.stringify(jobs));
    // Create empty array to track resolutions
    const resolvedIDs = jobs.map(() => "");
    jobs.forEach(job => {
        if (typeof job.id === "undefined" || job.id === null) {
            return Promise.reject(
                new Error("Failed adding job batch: All jobs must have an ID (non-UUID)")
            );
        }
    });
    const processBatch = async () => {
        let workPerformed = false,
            work = Promise.resolve();
        results.filter((pendingJob, index) => !resolvedIDs[index]).forEach(pendingJob => {
            const { id, parents: parentsRaw = [] } = pendingJob;
            let parents = parentsRaw;
            if (UUID_REXP.test(id)) {
                throw new Error(
                    `Failed adding job batch: Cannot add jobs with pre-set UUID: ${id}`
                );
            }
            // First check if the parents are resolved
            if (parents && parents.length > 0) {
                const resolvedParents = parents.map(parentID => {
                    if (UUID_REXP.test(parentID) === false) {
                        // Try to find job in resolved IDs
                        const targetIndex = jobs.findIndex(job => job.id === parentID);
                        if (targetIndex >= 0 === false && !resolvedIDs[targetIndex]) {
                            throw new Error(
                                `Failed adding job batch: Failed resolving parent ID: ${parentID}`
                            );
                        }
                        return resolvedIDs[targetIndex];
                    }
                    return parentID;
                });
                const allResolved = resolvedParents.every(parentID => UUID_REXP.test(parentID));
                if (!allResolved) {
                    // Some IDs could not be resolved
                    return;
                }
                parents = resolvedParents;
            }
            // Add this job to the service
            workPerformed = true;
            work = work.then(async () => {
                const jobID = await service.addJob(
                    Object.assign(pendingJob, {
                        id: null,
                        parents
                    })
                );
                const index = jobs.findIndex(job => job.id === id);
                resolvedIDs[index] = jobID;
                results[index] = await service.getJob(jobID);
            });
        });
        if (!workPerformed) {
            throw new Error("Failed adding job batch: Stalled while resolving dependencies");
        }
        // Wait for all work to complete
        await work;
        if (resolvedIDs.every(id => !!id) === false) {
            // Not all IDs resolved, so run again
            await processBatch();
        }
    };
    await processBatch();
    return results;
}

function ensureParentsComplete(service, job) {
    if (job.parents.length === 0) {
        return Promise.resolve();
    }
    return Promise.all(
        job.parents.map(parentID =>
            service.getJob(parentID).then(job => ({
                status: job.status,
                result: job.result.type
            }))
        )
    ).then(jobStates => {
        if (
            !jobStates.every(
                jobState =>
                    jobState.status === JOB_STATUS_STOPPED &&
                    jobState.result === JOB_RESULT_TYPE_SUCCESS
            )
        ) {
            throw new VError(
                { info: { code: ERROR_CODE_PARENTS_INCOMPLETE } },
                `Job ${job.id} has parents that have not completed successfully`
            );
        }
    });
}

function jobCanBeRestarted(job) {
    return (
        job.status === JOB_STATUS_STOPPED &&
        (JOB_RESULT_TYPES_RESTARTABLE_REXP.test(job.result.type) || job.result.type === null)
    );
}

function jobSatisfiesPredicates(service, job) {
    return Promise.resolve().then(() => {
        const { attemptsMax, locked, timeBetweenRetries } = job.predicate;
        const { attempts } = job;
        const { stopped: lastStopped } = job.times;
        const now = Date.now();
        if (typeof attemptsMax === "number" && attempts >= attemptsMax) {
            return false;
        }
        if (attempts > 0 && now - lastStopped < timeBetweenRetries) {
            return false;
        }
        // @todo CRON timings
        return !locked;
    });
}

function pickFirstJob(service, jobs) {
    const jobsCollection = [...jobs];
    const tryNext = () => {
        const job = jobsCollection.shift();
        if (!job) {
            return Promise.resolve(null);
        }
        return jobSatisfiesPredicates(service, job).then(
            satisfies => (satisfies ? job : tryNext())
        );
    };
    return tryNext();
}

function prepareJobForWorker(service, job) {
    const { id, type, data, parents, priority, status, timeLimit } = job;
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

module.exports = {
    addJobBatch,
    ensureParentsComplete,
    jobCanBeRestarted,
    jobSatisfiesPredicates,
    pickFirstJob,
    prepareJobForWorker
};
