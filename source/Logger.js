const fs = require("fs");

class Logger {
    constructor() {
        this._fileName = "taillog.json";
        this.levels = {
            LOGGER_ALERT: 0,
            LOGGER_ERROR: 1,
            LOGGER_WARNING: 2,
            LOGGER_INFO: 3,
            LOGGER_DEBUG: 4
        };
        this.entriesMax = 200;
        this.init();
    }

    init() {
        const obj = {
            entries: []
        };
        obj.entries.push({ level: 3, msg: "Start of logfile", timestamp: Date.now() });
        const json = JSON.stringify(obj);
        fs.writeFile(this._fileName, json, function(err) {
            if (err) throw err;
        });
    }

    addEntry(level, msg) {
        const self = this;
        new Promise(resolve => {
            fs.readFile(this._fileName, "utf8", function(err, data) {
                if (err) {
                    console.log(err);
                }
                const log = JSON.parse(data);
                if (log.entries && log.entries.length >= self.entriesMax) {
                    log.entries.shift();
                }
                log.entries.push({ level: level, msg: msg, timestamp: Date.now() });
                const json = JSON.stringify(log);
                fs.writeFile(self._fileName, json, function(err) {
                    if (err) throw err;
                    resolve();
                });
            });
        });
    }

    readLog() {
        return new Promise((resolve, reject) => {
            fs.readFile(this._fileName, "utf8", function(err, data) {
                if (err) {
                    reject(err);
                }
                resolve(data);
            });
        });
    }
}

module.exports = Logger;
