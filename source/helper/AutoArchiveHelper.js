const ms = require("ms");
const Helper = require("./Helper.js");
const {
    JOB_RESULT_TYPE_FAILURE,
    JOB_RESULT_TYPE_SUCCESS,
    JOB_STATUS_STOPPED
} = require("../symbols.js");

class AutoArchiveHelper extends Helper {
    constructor(interval = ms("1d")) {
        super();
        this._interval = interval;
    }

    attach(service) {
        super.attach(service);
        this._timer = setInterval(this.archiveCompletedJobs.bind(this), this._interval);
        setTimeout(() => this.archiveCompletedJobs(), 0);
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
                            self.archiveJobTree(job.id);
                        }
                    } else if (job.result.type === JOB_RESULT_TYPE_FAILURE) {
                        if (
                            job.times &&
                            job.times.completed !== null &&
                            Date.now() - job.times.completed >= ms("90d")
                        ) {
                            self.archiveJobTree(job.id);
                        }
                    }
                });
            });
    }

    archiveJobTree(jobId) {
        const self = this;
        self.service.getJobTree(jobId, { resolveParents: true }).then(tree => {
            tree.forEach(job => {
                self.service.archiveJob(job.id);
            });
        });
    }

    shutdown() {
        clearInterval(this._timer);
        super.shutdown();
    }
}

module.exports = AutoArchiveHelper;
