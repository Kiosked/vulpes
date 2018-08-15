const ms = require("ms");

/**
 * Job result type
 * @typedef {String} ResultType
 */

 /**
 * Job status
 * @typedef {String} Status
 */

/**
 * Job priority
 * @typedef {String} Priority
 */

const ERROR_CODE_ALREADY_INIT = "error/init/multi-call";
const ERROR_CODE_CANNOT_RESTART = "error/job/restart/invalid";
const ERROR_CODE_HELPER_INVALID = "error/helper/invalid";
const ERROR_CODE_INVALID_JOB_RESULT = "error/job/result";
const ERROR_CODE_INVALID_JOB_STATUS = "error/job/status";
const ERROR_CODE_NO_JOB_FOR_ID = "error/job/notfoundforid";
const ERROR_CODE_NOT_INIT = "error/init/not-init";
const ERROR_CODE_PARENTS_INCOMPLETE = "error/job/parents/incomplete"

const JOB_PRIORITY_HIGH = 5;
const JOB_PRIORITY_LOW = -5;
const JOB_PRIORITY_NORMAL = 0;

const JOB_RESULT_TYPE_FAILURE = "job/result/fail";
const JOB_RESULT_TYPE_FAILURE_SOFT = "job/result/fail/soft";
const JOB_RESULT_TYPE_SUCCESS = "job/result/success";
const JOB_RESULT_TYPE_TIMEOUT = "job/result/fail/timeout";
const JOB_RESULT_TYPES_RESTARTABLE_REXP = /^job\/result\/(success|fail\/soft)$/;
const JOB_RESULT_TYPES_REXP = /^job\/result\/.+$/;

const JOB_STATUS_PENDING = "job/status/pending";
const JOB_STATUS_RUNNING = "job/status/running";
const JOB_STATUS_STOPPED = "job/status/stopped";

const JOB_TIMELIMIT_DEFAULT = ms("10m");

module.exports = {
    ERROR_CODE_ALREADY_INIT,
    ERROR_CODE_CANNOT_RESTART,
    ERROR_CODE_HELPER_INVALID,
    ERROR_CODE_INVALID_JOB_RESULT,
    ERROR_CODE_INVALID_JOB_STATUS,
    ERROR_CODE_NO_JOB_FOR_ID,
    ERROR_CODE_NOT_INIT,
    ERROR_CODE_PARENTS_INCOMPLETE,
    JOB_PRIORITY_HIGH,
    JOB_PRIORITY_LOW,
    JOB_PRIORITY_NORMAL,
    JOB_RESULT_TYPE_FAILURE,
    JOB_RESULT_TYPE_FAILURE_SOFT,
    JOB_RESULT_TYPE_SUCCESS,
    JOB_RESULT_TYPE_TIMEOUT,
    JOB_RESULT_TYPES_RESTARTABLE_REXP,
    JOB_RESULT_TYPES_REXP,
    JOB_STATUS_PENDING,
    JOB_STATUS_RUNNING,
    JOB_STATUS_STOPPED,
    JOB_TIMELIMIT_DEFAULT
};
