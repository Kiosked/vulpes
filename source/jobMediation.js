const VError = require("verror");
const nested = require("nested-property");
const {
    ERROR_CODE_JOB_BATCH_DEPENDENCIES,
    ERROR_CODE_JOB_BATCH_IDS,
    ERROR_CODE_JOB_BATCH_ID_FORMAT,
    ERROR_CODE_JOB_BATCH_PARENT_RESOLUTION,
    ERROR_CODE_PARENTS_INCOMPLETE,
    JOB_RESULT_TYPE_SUCCESS,
    JOB_RESULT_TYPES_RESTARTABLE_REXP,
    JOB_STATUS_PENDING,
    JOB_STATUS_STOPPED,
    UUID_REXP
} = require("./symbols.js");

async function addJobBatch(service, jobs) {
    const results = JSON.parse(JSON.stringify(jobs));
    // Create empty array to track resolutions
    const resolvedIDs = jobs.map(() => "");
    for (let i = 0; i < jobs.length; i += 1) {
        if (typeof jobs[i].id === "undefined" || jobs[i].id === null) {
            throw new VError(
                { info: { code: ERROR_CODE_JOB_BATCH_IDS } },
                "Failed adding job batch: All jobs must have an ID (non-UUID)"
            );
        }
    }
    const processBatch = async () => {
        let workPerformed = false,
            work = Promise.resolve();
        results
            .filter((pendingJob, index) => !resolvedIDs[index])
            .forEach(pendingJob => {
                const { id, parents: parentsRaw = [] } = pendingJob;
                let parents = parentsRaw;
                if (UUID_REXP.test(id)) {
                    throw new VError(
                        { info: { code: ERROR_CODE_JOB_BATCH_ID_FORMAT } },
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
                                throw new VError(
                                    { info: { code: ERROR_CODE_JOB_BATCH_PARENT_RESOLUTION } },
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
            throw new VError(
                { info: { code: ERROR_CODE_JOB_BATCH_DEPENDENCIES } },
                "Failed adding job batch: Stalled while resolving dependencies"
            );
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

function checkParentsComplete(service, job) {
    if (job.parents.length === 0) {
        return Promise.resolve(true);
    }
    return Promise.all(
        job.parents.map(parentID =>
            service.getJob(parentID).then(job => ({
                status: job.status,
                result: job.result.type
            }))
        )
    ).then(jobStates =>
        jobStates.every(
            jobState =>
                jobState.status === JOB_STATUS_STOPPED &&
                jobState.result === JOB_RESULT_TYPE_SUCCESS
        )
    );
}

async function ensureParentsComplete(service, job) {
    const complete = await checkParentsComplete(service, job);
    if (!complete) {
        throw new VError(
            { info: { code: ERROR_CODE_PARENTS_INCOMPLETE } },
            `Job ${job.id} has parents that have not completed successfully`
        );
    }
}

function jobCanBeRestarted(job) {
    return (
        job.status === JOB_STATUS_STOPPED &&
        (JOB_RESULT_TYPES_RESTARTABLE_REXP.test(job.result.type) || job.result.type === null)
    );
}

/**
 * @typedef {Object} PredicatesTestResult
 * @property {Boolean} satisfies - True if all predicates satisfied, false otherwise
 * @property {String=} predicate - Name of the failing predicate
 */

/**
 * Test if a job satisfies all of its predicates
 * @param {Service} service The service
 * @param {Job} job The job to test
 * @returns {PredicatesTestResult} Test results
 */
function jobSatisfiesPredicates(service, job) {
    return Promise.resolve().then(() => {
        const { attemptsMax, locked, timeBetweenRetries } = job.predicate;
        const { attempts, status } = job;
        const { stopped: lastStopped } = job.times;
        const now = Date.now();
        if (typeof attemptsMax === "number" && attempts >= attemptsMax) {
            return { satisfies: false, predicate: "attemptsMax" };
        }
        if (
            attempts > 0 &&
            now - lastStopped < timeBetweenRetries &&
            status !== JOB_STATUS_PENDING // If in pending state, the job has been restarted and can begin
        ) {
            return { satisfies: false, predicate: "timeBetweenRetries" };
        }
        // @todo CRON timings
        return locked ? { satisfies: false, predicate: "locked" } : { satisfies: true };
    });
}

function normaliseJobData(data) {
    return data && typeof data === "object" ? data : {};
}

function pickFirstJob(service, jobs) {
    const jobsCollection = [...jobs];
    const tryNext = async () => {
        const job = jobsCollection.shift();
        if (!job) {
            return Promise.resolve(null);
        }
        const { satisfies } = await jobSatisfiesPredicates(service, job);
        if (!satisfies) {
            return await tryNext();
        }
        const parentsComplete = await checkParentsComplete(service, job);
        if (!parentsComplete) {
            return await tryNext();
        }
        return Promise.resolve(job);
    };
    return tryNext();
}

function pickOnlySticky(data) {
    return Object.keys(data)
        .filter(key => /^\$/.test(key))
        .reduce((output, key) => Object.assign(output, { [key]: data[key] }), {});
}

function prepareJobForWorker(service, job) {
    const { id, type, data, result, parents, priority, status, timeLimit } = job;
    // Create the job structure (data is added later)
    const workerJob = {
        id,
        type,
        data: {},
        priority,
        status,
        timeLimit
    };
    return service
        .queryJobs({
            id: jobID => parents.indexOf(jobID) >= 0
        })
        .then(parentJobs => {
            // Add data from parents first
            parentJobs.forEach(parentJob => {
                Object.assign(
                    workerJob.data,
                    stripLazyProperties(normaliseJobData(parentJob.data)),
                    stripLazyProperties(normaliseJobData(parentJob.result.data))
                );
            });
            // Update data to merge actual job's data and its previous sticky
            // results if it has been run earlier
            Object.assign(
                workerJob.data,
                normaliseJobData(data),
                pickOnlySticky(normaliseJobData(result.data))
            );
            workerJob.data = resolveLazyProperties(workerJob.data);
            return workerJob;
        });
}

function resolveLazyProperties(dataset) {
    const output = Object.assign({}, dataset);
    (function __resolveLevel(lvl) {
        Object.keys(lvl).forEach(key => {
            if (/^\?/.test(key) && /^\?/.test(lvl[key]) === false) {
                const newKey = key.replace(/^\?/, "");
                nested.set(lvl, newKey, nested.get(lvl, lvl[key]));
                lvl[key] = undefined;
                delete lvl[key];
            }
        });
        Object.keys(lvl).forEach(key => {
            if (lvl[key] && typeof lvl[key] === "object") {
                __resolveLevel(lvl[key]);
            }
        });
    })(output);
    return output;
}

function stripLazyProperties(dataset) {
    const output = Object.assign({}, dataset);
    (function __resolveLevel(lvl) {
        Object.keys(lvl).forEach(key => {
            if (/^\?/.test(key)) {
                lvl[key] = undefined;
                delete lvl[key];
            } else if (lvl[key] && typeof lvl[key] === "object") {
                __resolveLevel(lvl[key]);
            }
        });
    })(output);
    return output;
}

module.exports = {
    addJobBatch,
    ensureParentsComplete,
    jobCanBeRestarted,
    jobSatisfiesPredicates,
    pickFirstJob,
    prepareJobForWorker,
    resolveLazyProperties
};
