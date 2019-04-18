const endOfStream = require("end-of-stream");
const uuid = require("uuid/v4");
const { ITEM_TYPE, ITEM_TYPE_LOG_ENTRY } = require("./symbols.js");

class Logger {
    constructor(storage) {
        this.levels = {
            LOGGER_ALERT: "alert",
            LOGGER_ERROR: "error",
            LOGGER_WARNING: "warning",
            LOGGER_INFO: "info",
            LOGGER_DEBUG: "debug"
        };
        this.entriesMax = 100;
        this.storage = storage;
    }

    async addEntry(level, msg) {
        const entries = await this.readLogEntries();
        if (entries.length >= this.entriesMax) {
            await this.removeEntry(entries[0]);
        }
        const entry = {
            [ITEM_TYPE]: ITEM_TYPE_LOG_ENTRY,
            id: uuid(),
            level: level,
            msg: msg,
            timestamp: Date.now()
        };
        await this.storage.setItem(entry.id, entry);
    }

    async readLogEntries() {
        const logStream = await this.storage.streamItems();
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
        await this.storage.removeItem(entry.id);
    }
}

module.exports = Logger;
