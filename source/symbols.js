const ms = require("ms");

const JOB_PRIORITY_HIGH = 5;
const JOB_PRIORITY_LOW = -5;
const JOB_PRIORITY_NORMAL = 0;

const JOB_RESULT_TYPE_FAILURE = "result/fail";
const JOB_RESULT_TYPE_SUCCESS = "result/success";
const JOB_RESULT_TYPE_TIMEOUT = "result/fail/timeout";

const JOB_STATUS_COMPLETE = "status/complete";
const JOB_STATUS_PENDING = "status/pending";
const JOB_STATUS_RUNNING = "status/running";

const JOB_TIMELIMIT_DEFAULT = ms("10m");

module.exports = {
    JOB_PRIORITY_HIGH,
    JOB_PRIORITY_LOW,
    JOB_PRIORITY_NORMAL,
    JOB_RESULT_TYPE_FAILURE,
    JOB_RESULT_TYPE_SUCCESS,
    JOB_RESULT_TYPE_TIMEOUT,
    JOB_STATUS_COMPLETE,
    JOB_STATUS_PENDING,
    JOB_STATUS_RUNNING,
    JOB_TIMELIMIT_DEFAULT
};
