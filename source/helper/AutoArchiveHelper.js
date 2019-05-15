const ms = require("ms");
const Helper = require("./Helper.js");
const { clearDelayedInterval, setDelayedInterval } = require("delayable-setinterval");
const {
    JOB_RESULT_TYPE_FAILURE,
    JOB_RESULT_TYPE_SUCCESS,
    JOB_STATUS_STOPPED
} = require("../symbols.js");
const { getTimestamp } = require("../time.js");

class AutoArchiveHelper extends Helper {
    constructor({ checkInterval = ms("10m"), archivePeriod = ms("2w"), queryLimit = 50 } = {}) {
        super();
        this._checkInterval = checkInterval;
        this._archivePeriod = archivePeriod;
        this._queryLimit = queryLimit;
    }

    async archiveJobs() {
        const now = getTimestamp();
        const oldJobs = await this.service.queryJobs(
            {
                "result.type": type =>
                    type === JOB_RESULT_TYPE_FAILURE || type === JOB_RESULT_TYPE_SUCCESS,
                status: JOB_STATUS_STOPPED,
                "times.stopped": stopped => stopped && now - stopped >= this._archivePeriod
            },
            { limit: this._queryLimit }
        );
        const processedIDs = [];
        for (let i = 0; i < oldJobs.length; i += 1) {
            if (processedIDs.includes(oldJobs[i].id)) {
                continue;
            }
            const jobTree = await this.service.getJobTree(oldJobs[i].id);
            processedIDs.push(...jobTree.map(job => job.id));
            const readyToArchive = jobTree.every(
                job =>
                    (job.status === JOB_STATUS_STOPPED &&
                        job.result.type === JOB_RESULT_TYPE_FAILURE) ||
                    JOB_RESULT_TYPE_SUCCESS
            );
            if (readyToArchive) {
                for (let j = 0; j < jobTree.length; j += 1) {
                    await this.service.archiveJob(jobTree[j].id);
                }
            }
        }
    }

    attach(service) {
        super.attach(service);
        this._timer = setDelayedInterval(() => this.archiveJobs(), this._checkInterval);
    }

    shutdown() {
        clearDelayedInterval(this._timer);
        super.shutdown();
    }
}

module.exports = AutoArchiveHelper;
