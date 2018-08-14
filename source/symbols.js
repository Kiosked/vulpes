const ms = require("ms");

const JOB_PRIORITY_HIGH = 5;
const JOB_PRIORITY_LOW = -5;
const JOB_PRIORITY_NORMAL = 0;

const JOB_RESULT_TYPE_FAILURE = "job/result/fail";
const JOB_RESULT_TYPE_SUCCESS = "job/result/success";
const JOB_RESULT_TYPE_TIMEOUT = "job/result/fail/timeout";
const JOB_RESULT_TYPES_REXP = /^job\/result\/.+$/;

const JOB_STATUS_PENDING = "job/status/pending";
const JOB_STATUS_RUNNING = "job/status/running";
const JOB_STATUS_STOPPED = "job/status/stopped";

const JOB_TIMELIMIT_DEFAULT = ms("10m");

module.exports = {
    JOB_PRIORITY_HIGH,
    JOB_PRIORITY_LOW,
    JOB_PRIORITY_NORMAL,
    JOB_RESULT_TYPE_FAILURE,
    JOB_RESULT_TYPE_SUCCESS,
    JOB_RESULT_TYPE_TIMEOUT,
    JOB_RESULT_TYPES_REXP,
    JOB_STATUS_PENDING,
    JOB_STATUS_RUNNING,
    JOB_STATUS_STOPPED,
    JOB_TIMELIMIT_DEFAULT
};
