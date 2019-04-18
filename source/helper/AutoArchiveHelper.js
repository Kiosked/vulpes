const Helper = require("./Helper.js");
const {
    JOB_RESULT_TYPE_FAILURE,
    JOB_RESULT_TYPE_SUCCESS,
    JOB_STATUS_RUNNING
} = require("../symbols.js");

class AutoArchiveHelper extends Helper {
    constructor() {
        super();
    }

    archiveCompletedJobs() {
        this.service
            .queryJobs({
                archived: archived => archived === false || archived === undefined,
                status: JOB_STATUS_RUNNING
            })
            .then(completedJobs => {
                completedJobs.forEach(job => {});
            });
    }

    getTimeLimit(months = 1) {
        const time = new Date();
        time.setMonth(time.getMonth() - months);
        time.setHours(0, 0, 0);
        time.setMilliseconds(0);
        return time;
    }
}

module.exports = AutoArchiveHelper;
