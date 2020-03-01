const endOfStream = require("end-of-stream");

/**
 * Wait for a stream to end
 * @param {ReadableStream} stream The stream to wait for
 * @returns {Promise}
 * @memberof module:Vulpes
 */
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
