const uuid = require("uuid/v4");
const {
    JOB_PRIORITY_NORMAL,
    JOB_STATUS_PENDING
} = require("./symbols.js");

function generateEmptyJob() {
    const id = uuid();
    return {
        ["@@type"]: "vulpes/job",
        id,
        chains: [id],
        type: "generic",
        status: JOB_STATUS_PENDING,
        priority: JOB_PRIORITY_NORMAL,
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
            completed: null
        },
        timeLimit: null
    };
}

module.exports = {
    generateEmptyJob
};
