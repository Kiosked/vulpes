const endOfStream = require("end-of-stream");

function waitForStream(stream) {
    return new Promise((resolve, reject) =>
        endOfStream(stream, err => {
            if (err) {
                return reject(err);
            }
            resolve();
        })
    );
}

module.exports = {
    waitForStream
};
