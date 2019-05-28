const endOfStream = require("end-of-stream");
const uuid = require("uuid/v4");
const { ITEM_TYPE, ITEM_TYPE_LOG_ENTRY } = require("./symbols.js");

class Logger {
    constructor(service) {
        this.levels = {
            LOGGER_ALERT: "alert",
            LOGGER_ERROR: "error",
            LOGGER_WARNING: "warning",
            LOGGER_INFO: "info",
            LOGGER_DEBUG: "debug"
        };
        this.entriesMax = 100;
        this.service = service;
    }

    initialise() {
        if (this.service.initialised) {
            throw new Error("Failed initialising Scheduler: Parent service already initialised");
        }
        const logger = this;
        logger.service.on("jobAdded", job => {
            logger.addEntry(logger.levels.LOGGER_INFO, `Added job with id ${job.id}`, job.id);
        });
        logger.service.on("jobReset", job => {
            logger.addEntry(logger.levels.LOGGER_INFO, `Reset job ${job.id}`, job.id);
        });
        logger.service.on("jobStarted", job => {
            logger.addEntry(logger.levels.LOGGER_INFO, `Started job ${job.id}`, job.id);
        });
        logger.service.on("jobStopped", job => {
            logger.addEntry(logger.levels.LOGGER_INFO, `Stopped job ${job.id}`, job.id);
        });
        logger.service.on("jobTimeout", job => {
            logger.addEntry(logger.levels.LOGGER_ERROR, `ERROR: Job ${job.id} timeout`, job.id);
        });
        logger.service.on("jobCompleted", job => {
            logger.addEntry(
                logger.levels.LOGGER_INFO,
                `Job ${job.id} completed successfully`,
                job.id
            );
        });
        logger.service.on("jobFailed", job => {
            logger.addEntry(logger.levels.LOGGER_ERROR, `Job ${job.id} has failed`, job.id);
        });
        logger.service.on("jobUpdated", job => {
            logger.addEntry(logger.levels.LOGGER_INFO, `Job ${job.id} has been updated`, job.id);
        });
        logger.service.scheduler.on("taskAdded", task => {
            logger.addEntry(
                logger.levels.LOGGER_INFO,
                `Added task with id ${task.id}, ${task.enabled ? "enabled" : "disabled"}`,
                task.id
            );
        });
        logger.service.scheduler.on("taskJobsUpdated", task => {
            logger.addEntry(logger.levels.LOGGER_INFO, `Updated jobs for task ${task.id}`, task.id);
        });
        logger.service.scheduler.on("taskStatusToggled", task => {
            logger.addEntry(
                logger.levels.LOGGER_INFO,
                `${task.enabled ? "Enabled" : "Disabled"} task ${task.id}`,
                task.id
            );
        });
        logger.service.scheduler.on("taskPropertiesUpdated", task => {
            logger.addEntry(
                logger.levels.LOGGER_INFO,
                `Updated task ${task.id} ${task.title}`,
                task.id
            );
        });
        logger.service.scheduler.on("createdJobsFromTask", task => {
            logger.addEntry(
                logger.levels.LOGGER_INFO,
                `Created ${task.jobs.length} jobs from ${task.id}`,
                task.id
            );
        });
    }

    async addEntry(level, msg, jobId) {
        const entries = await this.readLogEntries();
        if (entries.length >= this.entriesMax) {
            await this.removeEntry(entries[0]);
        }
        const entry = {
            [ITEM_TYPE]: ITEM_TYPE_LOG_ENTRY,
            id: uuid(),
            jobId,
            level,
            msg,
            timestamp: Date.now()
        };
        await this.service.storage.setItem(entry.id, entry);
    }

    async readLogEntries() {
        const logStream = await this.service.storage.streamItems();
        const results = [];
        logStream.on("data", entry => {
            if (entry[ITEM_TYPE] === ITEM_TYPE_LOG_ENTRY) {
                results.push(entry);
            }
        });
        await new Promise((resolve, reject) =>
            endOfStream(logStream, err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            })
        );
        const logEntries = results.sort((a, b) => a.timestamp - b.timestamp);
        return logEntries;
    }

    async removeEntry(entry) {
        await this.service.storage.removeItem(entry.id);
    }
}

module.exports = Logger;
