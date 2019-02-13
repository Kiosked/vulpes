const ms = require("ms");
const VError = require("verror");
const Helper = require("./Helper.js");
const { getTimestamp } = require("../time.js");
const {
    ERROR_CODE_INVALID_JOB_STATUS,
    JOB_RESULT_TYPE_TIMEOUT,
    JOB_STATUS_RUNNING
} = require("../symbols.js");

const PROCESSING_LIMIT = 50;

class TimeoutHelper extends Helper {
    constructor(interval = ms("15s")) {
        super();
        this._interval = interval;
    }

    attach(service) {
        super.attach(service);
        this._timer = setInterval(this.checkJobs.bind(this), this._interval);
        setTimeout(() => this.checkJobs(), 0);
    }

    checkJobs() {
        this.service
            .queryJobs({
                timeLimit: timeLimit => timeLimit !== null,
                status: JOB_STATUS_RUNNING
            })
            .then(runningJobs =>
                runningJobs.length > PROCESSING_LIMIT
                    ? runningJobs.splice(0, PROCESSING_LIMIT)
                    : runningJobs
            )
            .then(runningJobs => {
                let work = Promise.resolve();
                runningJobs.forEach(job => {
                    work = work.then(() => {
                        const now = getTimestamp();
                        if (now - job.times.started >= job.timeLimit) {
                            return this.service
                                .stopJob(job.id, JOB_RESULT_TYPE_TIMEOUT)
                                .catch(err => {
                                    const info = VError.info(err);
                                    if (info && info.code === ERROR_CODE_INVALID_JOB_STATUS) {
                                        // Bob status was changed while the helper was
                                        // preparing - we can ignore this error..
                                        return;
                                    }
                                    throw err;
                                });
                        }
                    });
                });
            });
    }

    shutdown() {
        clearInterval(this._timer);
        super.shutdown();
    }
}

module.exports = TimeoutHelper;
