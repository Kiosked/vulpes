function convertTemplateToJobArray(tmpObj) {
    const { template, items, base = {} } = tmpObj;
    const { tag = createBatchTag() } = base;
    if (!template) {
        throw new Error("No template structure detected");
    } else if (!Array.isArray(items) || items.length <= 0) {
        throw new Error("No items specified");
    }
    const jobs = [];
    let nextJobID = Math.max(1, ...template.map(spec => getNextValidJobID(spec)));
    items.forEach(itemConfiguration => {
        (function processTemplateJobs(templateJobs, parentID = null) {
            const processTemplateJob = templateJob => {
                const output = {
                    id: templateJob.id || nextJobID++,
                    type: templateJob.type,
                    // @todo conditionals
                    data: processMacros(
                        Object.assign({}, templateJob.data || {}, { tag }),
                        itemConfiguration
                    )
                };
                if (parentID) {
                    output.parents = [parentID];
                }
                jobs.push(output);
                if (templateJob.children) {
                    processTemplateJobs(templateJob.children, output.id);
                }
            };
            templateJobs.map(templateJob => processTemplateJob(templateJob));
        })(template);
    });
    return jobs;
}

function createBatchTag() {
    return `template_batch_${Date.now()}_${Math.floor(Math.random() * 999999999)}`;
}

function getNextValidJobID(jobSpec) {
    return Math.max(
        jobSpec.id ? jobSpec.id + 1 : 1,
        ...(jobSpec.children || []).map(child => getNextValidJobID(child))
    );
}

function processMacros(target, macros) {
    return Object.keys(target).reduce(
        (output, key) =>
            Object.assign(output, {
                [key]: processValue(target[key], macros)
            }),
        {}
    );
}

function processMacrosInString(str, macros) {
    let output = str;
    Object.keys(macros).forEach(macroKey => {
        output = output.replace(new RegExp(`\\$${macroKey}\\$`, "g"), macros[macroKey]);
    });
    return output;
}

function processValue(value, macros) {
    if (typeof value === "string") {
        return processMacrosInString(value, macros);
    } else if (Array.isArray(value)) {
        return value.map(innerVal => processValue(innerVal, macros));
    } else if (typeof value === "object" && value) {
        return processMacros(value, macros);
    }
    return value;
}

module.exports = {
    convertTemplateToJobArray,
    processMacros
};
