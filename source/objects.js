/**
 * Clone an object (naive)
 * @param {Object} obj The object to clone
 * @returns {Object} A newly cloned object
 * @private
 */
function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

module.exports = {
    clone
};
