const nested = require("nested-property");

function conditionMet(condition, macros) {
    const { ifset, ifnotset, ifeq } = condition;
    if (typeof ifset === "string" || Array.isArray(ifset)) {
        const checkItems = Array.isArray(ifset) ? ifset : [ifset];
        if (checkItems.some(item => typeof nested.get(macros, item) === "undefined")) {
            return false;
        }
    }
    if (typeof ifnotset === "string" || Array.isArray(ifnotset)) {
        const checkItems = Array.isArray(ifnotset) ? ifnotset : [ifnotset];
        if (checkItems.some(item => typeof nested.get(macros, item) !== "undefined")) {
            return false;
        }
    }
    if (ifeq && typeof ifeq === "object") {
        const allMatch = Object.keys(ifeq).every(
            propKey => nested.get(macros, propKey) == ifeq[propKey]
        );
        if (!allMatch) {
            return false;
        }
    }
    return true;
}

/**
 * @typedef {Object} JobImportTemplateItem
 * @property {String} type The new job type
 * @property {Object=} data Data payload for the new job
 * @property {Object=} condition Optionally trigger this job only under certain
 *  conditions
 * @property {String|String[]=} condition.ifset Trigger this job only if all
 *  mentioned macro properties are SET (not undefined)
 * @property {String|String[]=} condition.ifnotset Trigger this job only if
 *  none of the mentioned macro properties are SET
 * @property {Object} condition.ifeq Trigger this job of all properties of this
 *  object (key, value) are preset and matching on the macro properties
 * @property {String=} repeat Repeat on the property mentioned, that exists
 *  within the macro properties, which is an array
 */

/**
 * @typedef {Object} JobImportTemplate
 * @property {Array.<JobImportTemplateItem>} template An array of jobs
 * @property {Array.<Object>} items An array of macro values for the template
 * @property {Object=} base Optional base configuration
 * @property {String=} base.tag Optional tag to attach to all job data payloads
 */

/**
 * Convert a template to an array of jobs to import
 * @param {JobImportTemplate} tmpObj The template to convert
 * @returns {Array.<NewJob>} An array of new jobs to pass to `Service#addJobs`
 * @memberof module:Vulpes
 */
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
        (function processTemplateJobs(templateJobs, parentID = null, jobsConfiguration) {
            const processTemplateJob = (templateJob, jobConfiguration) => {
                const macros = [jobConfiguration];
                if (templateJob.repeat) {
                    // Get target array to repeat on
                    const repeater = nested.get(jobConfiguration, templateJob.repeat);
                    if (Array.isArray(repeater)) {
                        // Remove all macro collections and insert repeated ones
                        macros.splice(
                            0, // remove at
                            1, // remove count
                            // Insert new macro sets:
                            ...repeater.map(repeatedValue => {
                                const output = JSON.parse(JSON.stringify(jobConfiguration));
                                nested.set(output, templateJob.repeat, repeatedValue);
                                return output;
                            })
                        );
                    }
                }
                macros.forEach(macroValues => {
                    const output = {
                        id: templateJob.id || nextJobID++,
                        type: templateJob.type,
                        data: processMacros(
                            Object.assign({}, templateJob.data || {}, { tag }),
                            macroValues
                        )
                    };
                    if (parentID) {
                        output.parents = [parentID];
                    }
                    if (templateJob.condition) {
                        if (!conditionMet(templateJob.condition, macroValues)) {
                            return;
                        }
                    }
                    jobs.push(output);
                    if (templateJob.children) {
                        processTemplateJobs(templateJob.children, output.id, macroValues);
                    }
                });
            };
            templateJobs.map(templateJob => processTemplateJob(templateJob, jobsConfiguration));
        })(template, null, itemConfiguration);
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
    let output = str,
        match;
    const replacements = {};
    const rexp = /\$([a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)\$/g;
    while ((match = rexp.exec(output)) !== null) {
        const [replacement, propChain] = match;
        replacements[replacement] = nested.get(macros, propChain);
    }
    Object.keys(replacements).forEach(repl => {
        const replacement = typeof replacements[repl] === "undefined" ? "" : replacements[repl];
        output = output.replace(repl, replacement);
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
