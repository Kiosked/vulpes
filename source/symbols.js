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

const ERROR_CODE_ALREADY_INIT = "vuples/error/init/multi-call";
const ERROR_CODE_ALREADY_SUCCEEDED = "vuples/error/job/result/succeeded";
const ERROR_CODE_CANNOT_RESTART = "vuples/error/job/restart/invalid";
const ERROR_CODE_HELPER_INVALID = "vuples/error/helper/invalid";
const ERROR_CODE_INVALID_JOB_RESULT = "vuples/error/job/result";
const ERROR_CODE_INVALID_JOB_STATUS = "vuples/error/job/status";
const ERROR_CODE_JOB_BATCH_DEPENDENCIES = "vulpes/error/job-batch/dep-res";
const ERROR_CODE_JOB_BATCH_IDS = "vulpes/error/job-batch/ids";
const ERROR_CODE_JOB_BATCH_ID_FORMAT = "vulpes/error/job-batch/id-format";
const ERROR_CODE_JOB_BATCH_PARENT_RESOLUTION = "vulpes/error/job-batch/parent-res";
const ERROR_CODE_NO_JOB_FOR_ID = "vuples/error/job/notfoundforid";
const ERROR_CODE_NOT_INIT = "vuples/error/init/not-init";
const ERROR_CODE_PARENTS_INCOMPLETE = "vuples/error/job/parents/incomplete";
const ERROR_CODE_PREDICATE_NOT_SATISFIED = "vuples/error/job/predicate/not-satisfied";

const ITEM_TYPE = "@@type";
const ITEM_TYPE_JOB = "vulpes/job";
const ITEM_TYPE_SCHEDULED_TASK = "vulpes/scheduledTask";

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
const JOB_STATUS_REXP = /^job\/status\/(pending|running|stopped)$/;
const JOB_STATUS_RUNNING = "job/status/running";
const JOB_STATUS_STOPPED = "job/status/stopped";

const JOB_TIMELIMIT_DEFAULT = ms("10m");

const UUID_REXP = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/;

module.exports = {
    ERROR_CODE_ALREADY_INIT,
    ERROR_CODE_ALREADY_SUCCEEDED,
    ERROR_CODE_CANNOT_RESTART,
    ERROR_CODE_HELPER_INVALID,
    ERROR_CODE_INVALID_JOB_RESULT,
    ERROR_CODE_INVALID_JOB_STATUS,
    ERROR_CODE_JOB_BATCH_DEPENDENCIES,
    ERROR_CODE_JOB_BATCH_IDS,
    ERROR_CODE_JOB_BATCH_ID_FORMAT,
    ERROR_CODE_JOB_BATCH_PARENT_RESOLUTION,
    ERROR_CODE_NO_JOB_FOR_ID,
    ERROR_CODE_NOT_INIT,
    ERROR_CODE_PARENTS_INCOMPLETE,
    ERROR_CODE_PREDICATE_NOT_SATISFIED,
    ITEM_TYPE,
    ITEM_TYPE_JOB,
    ITEM_TYPE_SCHEDULED_TASK,
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
    JOB_STATUS_REXP,
    JOB_STATUS_RUNNING,
    JOB_STATUS_STOPPED,
    JOB_TIMELIMIT_DEFAULT,
    UUID_REXP
};
