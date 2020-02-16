const ms = require("ms");
const Helper = require("./Helper.js");
const { clearDelayedInterval, setDelayedInterval } = require("delayable-setinterval");
const {
    JOB_RESULT_TYPE_FAILURE,
    JOB_RESULT_TYPE_SUCCESS,
    JOB_RESULT_TYPE_TIMEOUT,
    JOB_STATUS_STOPPED
} = require("../symbols.js");
const { getTimestamp } = require("../time.js");

/**
 * Auto archive helper
 * @augments Helper
 * @memberof module:Vulpes
 */
class AutoArchiveHelper extends Helper {
    /**
     * @typedef {Object} AutoArchiveHelperOptions
     * @property {Number=} checkInterval - Milliseconds between archive checks
     * @property {Number=} archivePeriod - Milliseconds that a job has been stopped before
     *  it can be archived
     * @property {Number=} queryLimit - Max job results from queries for archving
     */

    /**
     * Constructor for the auto archive helper
     * @param {AutoArchiveHelperOptions=} options Config options
     * @memberof AutoArchiveHelper
     */
    constructor({
        checkInterval = ms("10m"),
        archivePeriod = ms("2w"),
        deletePeriod = ms("1w"),
        queryLimit = 50
    } = {}) {
        super();
        this._checkInterval = checkInterval;
        this._archivePeriod = archivePeriod;
        this._queryLimit = queryLimit;
        this._deletePeriod = deletePeriod;
    }

    /**
     * Perform the archival process
     * @returns {Promise}
     * @memberof AutoArchiveHelper
     */
    async archive() {
        await this.archiveJobs();
        if (this._deletePeriod) {
            await this.archiveJobs("delete");
        }
    }

    /**
     * Archive or delete some jobs
     * @param {String=} action The action with which to perform on the selected jobs
     *  (defaults to "archive", but can also be "delete")
     * @returns {Promise}
     * @memberof AutoArchiveHelper
     */
    async archiveJobs(action = "archive") {
        if (action !== "archive" && action !== "delete") {
            throw new Error(`Invalid archive action: ${action}`);
        }
        const checkPeriod = action === "archive" ? this._archivePeriod : this._deletePeriod;
        const now = getTimestamp();
        const query =
            action === "archive"
                ? {
                      "result.type": type =>
                          type === JOB_RESULT_TYPE_FAILURE ||
                          type === JOB_RESULT_TYPE_TIMEOUT ||
                          type === JOB_RESULT_TYPE_SUCCESS,
                      status: JOB_STATUS_STOPPED,
                      "times.stopped": timeProp => timeProp && now - timeProp >= checkPeriod
                  }
                : {
                      archived: true,
                      "times.archived": timeProp => timeProp && now - timeProp >= checkPeriod
                  };
        const oldJobs = await this.service.queryJobs(query, {
            limit: this._queryLimit,
            sort: "created",
            order: "asc"
        });
        const processedIDs = [];
        for (let i = 0; i < oldJobs.length; i += 1) {
            if (processedIDs.includes(oldJobs[i].id)) {
                continue;
            }
            const jobTree = await this.service.getJobTree(oldJobs[i].id);
            processedIDs.push(...jobTree.map(job => job.id));
            const readyToArchive = jobTree.every(
                job =>
                    job.status === JOB_STATUS_STOPPED &&
                    (job.result.type === JOB_RESULT_TYPE_FAILURE ||
                        job.result.type === JOB_RESULT_TYPE_SUCCESS ||
                        job.result.type === JOB_RESULT_TYPE_TIMEOUT)
            );
            if (readyToArchive) {
                for (let j = 0; j < jobTree.length; j += 1) {
                    if (action === "archive") {
                        await this.service.archiveJob(jobTree[j].id);
                    } else if (action === "delete") {
                        await this.service.removeJob(jobTree[j].id);
                    }
                }
            }
        }
    }

    /**
     * Attach to a service instance
     * @param {Service} service The service to attach to
     * @memberof AutoArchiveHelper
     */
    attach(service) {
        super.attach(service);
        this._timer = setDelayedInterval(() => this.archive(), this._checkInterval);
    }

    /**
     * Shutdown the helper
     * @memberof AutoArchiveHelper
     */
    shutdown() {
        clearDelayedInterval(this._timer);
        super.shutdown();
    }
}

module.exports = AutoArchiveHelper;
