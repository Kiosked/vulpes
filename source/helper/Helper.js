/**
 * Helper base class
 * Helpers provide an easy interface with which to
 * attach to services to perform ancillary tasks.
 * @memberof module:Vulpes
 */
class Helper {
    constructor() {
        this._service = null;
    }

    /**
     * The attached service
     * @type {Service}
     * @readonly
     * @memberof Helper
     */
    get service() {
        return this._service;
    }

    /**
     * Attach to a service
     * This will be called by a Service instance
     * @param {Service} service The service to attach to
     * @memberof Helper
     * @throws {Error} Throws if already attached to a service
     */
    attach(service) {
        if (this._service !== null) {
            throw new Error("Failed attaching to service: Already attached");
        }
        this._service = service;
    }

    /**
     * Initialise the helper (only called if the helper is added BEFORE
     *  service initialisation)
     * @memberof Helper
     * @returns {Promise}
     */
    initialise() {
        return Promise.resolve();
    }

    /**
     * Shutdown the helper
     * This will be called by a Service instance
     * @memberof Helper
     */
    shutdown() {
        this._service = null;
    }
}

module.exports = Helper;
