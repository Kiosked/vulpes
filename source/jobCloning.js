function cloneJob(job) {
    const output = rebaseObject(job);
    if (output.predicate) {
        output.predicate = rebaseObject(output.predicate);
    }
    if (output.times) {
        output.times = rebaseObject(output.times);
    }
    if (output.data) {
        output.data = rebaseObjectDeep(output.data);
    }
    if (output.result) {
        output.result = rebaseObject(output.result);
        if (output.result.data) {
            output.result.data = rebaseObjectDeep(output.result.data);
        }
    }
    if (output.parents) {
        output.parents = [...output.parents];
    }
    return output;
}

function rebaseArrayDeep(arr) {
    return arr.map(item => {
        if (Array.isArray(item)) {
            return rebaseArrayDeep(item);
        } else if (item && typeof item === "object") {
            return rebaseObjectDeep(item);
        }
        return item;
    });
}

function rebaseObject(obj) {
    return Object.assign({}, obj);
}

function rebaseObjectDeep(obj) {
    const output = rebaseObject(obj);
    Object.keys(output).forEach(key => {
        if (Array.isArray(output[key])) {
            output[key] = rebaseArrayDeep(output[key]);
        } else if (output[key] && typeof output[key] === "object") {
            output[key] = rebaseObjectDeep(output[key]);
        }
    });
    return output;
}

module.exports = {
    cloneJob
};
