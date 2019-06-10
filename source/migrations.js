const endOfStream = require("end-of-stream");
const { ITEM_TYPE } = require("./symbols.js");

const ITEM_TYPE_LOG_ENTRY = "vulpes/logEntry";

async function removeAllLegacyLogs(service) {
    const logStream = await service.storage.streamItems();
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
    for (const logItem of results) {
        await service.storage.removeItem(logItem.id);
    }
}

module.exports = {
    removeAllLegacyLogs
};
