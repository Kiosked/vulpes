const ms = require("ms");
const Helper = require("./Helper.js");
const {
    JOB_RESULT_TYPE_FAILURE,
    JOB_RESULT_TYPE_SUCCESS,
    JOB_STATUS_STOPPED
} = require("../symbols.js");

class AutoArchiveHelper extends Helper {
    constructor() {
        super();
    }

    archiveCompletedJobs() {
        const self = this;
        self.service
            .queryJobs({
                archived: archived => archived === false || archived === undefined,
                status: JOB_STATUS_STOPPED
            })
            .then(completedJobs => {
                completedJobs.forEach(job => {
                    if (job.result.type === JOB_RESULT_TYPE_SUCCESS) {
                        if (
                            job.times &&
                            job.times.completed !== null &&
                            Date.now() - job.times.completed >= ms("30d")
                        ) {
                            self.service.archiveJob(job.id);
                        }
                    } else if (job.result.type === JOB_RESULT_TYPE_FAILURE) {
                        if (
                            job.times &&
                            job.times.completed !== null &&
                            Date.now() - job.times.completed >= ms("90d")
                        ) {
                            self.service.archiveJob(job.id);
                        }
                    }
                });
            });
    }
}

module.exports = AutoArchiveHelper;
