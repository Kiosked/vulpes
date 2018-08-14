const uuid = require("uuid/v4");
const { getTimestamp } = require("./time.js");
const {
    JOB_PRIORITY_NORMAL,
    JOB_STATUS_PENDING
} = require("./symbols.js");

function generateEmptyJob() {
    const id = uuid();
    return {
        ["@@type"]: "vulpes/job",
        id,
        chain: [id],
        type: "generic",
        status: JOB_STATUS_PENDING,
        priority: JOB_PRIORITY_NORMAL,
        created: getTimestamp(),
        parents: [],
        predicate: "",
        data: {},
        result: {
            data: {},
            type: null
        },
        times: {
            firstStarted: null,
            started: null,
            stopped: null,
            completed: null
        },
        timeLimit: null,
        attempts: 0
    };
}

module.exports = {
    generateEmptyJob
};
