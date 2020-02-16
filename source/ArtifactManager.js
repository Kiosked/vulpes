const os = require("os");
const path = require("path");
const fs = require("fs");
const EventEmitter = require("eventemitter3");
const uuid = require("uuid/v4");
const pify = require("pify");
const rimraf = pify(require("rimraf"));
const mkdirp = require("mkdirp");
const dataURIToBuffer = require("data-uri-to-buffer");
const parseDataURI = require("parse-data-uri");
const endOfStream = require("end-of-stream");
const { ATTACHMENT_PREFIX, ATTACHMENT_REXP } = require("./symbols.js");

function getArtifactPath(storagePath, artifactID) {
    return path.join(storagePath, `${artifactID}.vulpesartifact`);
}

function getDefaultStoragePath() {
    if (global.VULPES_ARTIFACTS_PATH) {
        return global.VULPES_ARTIFACTS_PATH;
    }
    return path.join(os.homedir(), ".vulpes/artifacts");
}

async function migrate(service, manager) {
    let jobs;
    do {
        jobs = await service.queryJobs(
            {
                "result.data": data =>
                    !!data &&
                    !!Object.keys(data).find(key => ATTACHMENT_REXP.test(key) && !!data[key].data)
            },
            { limit: 20 }
        );
        for (const job of jobs) {
            const attachments = Object.keys(job.result.data)
                .filter(key => ATTACHMENT_REXP.test(key))
                .map(key =>
                    Object.assign({}, job.result.data[key], {
                        key,
                        id: key.replace(/^%attachment:/, "")
                    })
                );
            for (const attachment of attachments) {
                if (!attachment.data) {
                    continue;
                }
                const { id, data, mime } = attachment;
                const writeStream = await manager.getArtifactWriteStream(id);
                if (/^text\//.test(mime)) {
                    const { data: textBuffer } = parseDataURI(data);
                    writeStream.write(textBuffer.toString("utf8"));
                } else {
                    const buff = dataURIToBuffer(data);
                    writeStream.write(buff);
                }
                writeStream.end();
                await waitForStream(writeStream);
            }
            const resultData = Object.assign({}, job.result.data);
            attachments.forEach(attachment => {
                const { key } = attachment;
                const updatedAttachment = Object.assign({}, attachment);
                delete updatedAttachment.data;
                delete updatedAttachment.key;
                resultData[key] = updatedAttachment;
            });
            await service.updateJob(
                job.id,
                { result: { data: resultData } },
                { stripResults: true }
            );
        }
    } while (jobs.length > 0);
}

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

/**
 * @event ArtifactManager#migrationComplete
 */

/**
 * Artifact Manager
 * @augments EventEmitter
 */
class ArtifactManager extends EventEmitter {
    /**
     * Constructor for the artifact manager
     * @param {String=} storagePath The path to store artifacts in. Defaults to
     *  `~/.vulpes/artifacts` if not specified.
     */
    constructor(storagePath = getDefaultStoragePath()) {
        super();
        this._path = storagePath;
        this._migrating = false;
        this.service = null;
    }

    /**
     * @typedef {Object} NewJobAttachmentOptions
     * @property {String=} title The title of the attachment
     * @property {Buffer|String|ReadableStream} data The attachment data
     * @property {String} mime The mime type of the attachment
     * @property {Number=} created The timestamp of creation
     */

    /**
     * Add a new job attachment
     * @param {String} jobID The job ID to add the attachment to
     * @param {NewJobAttachmentOptions} param1 Options for the new attachment
     * @returns {Promise.<String>} A promise that resolves with the attachment ID
     */
    async addJobAttachment(
        jobID,
        { id = uuid(), title = "Untitled", data, mime, created = Date.now() } = {}
    ) {
        const attachment = {
            id,
            title,
            mime,
            created
        };
        const writeStream = await this.getArtifactWriteStream(attachment.id);
        if (Buffer.isBuffer(data) || typeof data === "string") {
            writeStream.write(data);
            writeStream.end();
        } else {
            // Assume stream
            data.pipe(writeStream);
            await waitForStream(data);
        }
        await waitForStream(writeStream);
        // Update job
        await this.service.updateJob(jobID, {
            result: {
                data: {
                    [`${ATTACHMENT_PREFIX}${attachment.id}`]: attachment
                }
            }
        });
        return attachment.id;
    }

    /**
     * Initialise the manager (called by Service)
     * @param {Service} service The service instance we're attached to
     * @returns {Promise}
     * @fires ArtifactManager#migrationComplete
     */
    async initialise(service) {
        this.service = service;
        await mkdirp(this._path);
        this.service.once("initialised", async () => {
            try {
                this._migrating = true;
                await migrate(this.service, this);
            } catch (err) {}
            this._migrating = false;
            this.emit("migrationComplete");
        });
    }

    /**
     * Get a readable stream of an artifact
     * @param {String} artifactID The artifact's ID
     * @returns {Promise.<ReadableStream>}
     */
    async getArtifactReadStream(artifactID) {
        const filename = getArtifactPath(this._path, artifactID);
        return fs.createReadStream(filename);
    }

    /**
     * Get a writeable stream for an artifact
     * @param {String} artifactID The artifact's ID
     * @returns {Promise.<WritableStream>}
     */
    async getArtifactWriteStream(artifactID) {
        const filename = getArtifactPath(this._path, artifactID);
        return fs.createWriteStream(filename);
    }

    /**
     * @typedef {Object} JobAttachment
     * @property {String} id - The attachment/artifact ID
     * @property {String} title - The artifact title
     * @property {String} mime - The mime type for the artifact
     * @property {Number} created - The JS timestamp of creation/addition
     */

    /**
     * Get all job attachments
     * @param {String} jobID The ID of the job to fetch artifacts for
     * @returns {JobAttachment[]}
     */
    async getJobAttachments(jobID) {
        const job = await this.service.getJob(jobID);
        return Object.keys(job.result.data || {}).reduce((payload, resultKey) => {
            if (ATTACHMENT_REXP.test(resultKey)) {
                payload.push(
                    Object.assign(job.result.data[resultKey], {
                        id:
                            job.result.data[resultKey].id ||
                            resultKey.replace(ATTACHMENT_PREFIX, "")
                    })
                );
            }
            return payload;
        }, []);
    }

    /**
     * Remove an artifact (does not affect jobs)
     * @param {String} artifactID The ID of the artifact to remove
     * @returns {Promise}
     */
    async removeArtifact(artifactID) {
        const filename = getArtifactPath(this._path, artifactID);
        await rimraf(filename);
    }

    /**
     * Remove an attachment from a job, also removing
     * the associated artifact
     * @param {String} jobID The ID of the job containing the artifact
     * @param {String} artifactID The ID of the artifact to remove from
     *  the job
     * @returns {Promise}
     */
    async removeJobAttachment(jobID, artifactID) {
        // First remove from job
        const job = await this.service.getJob(jobID);
        const results = job.result.data || {};
        delete results[`${ATTACHMENT_PREFIX}${artifactID}`];
        await this.service.updateJob(jobID, { result: { data: results } }, { stripResults: true });
        // Then remove artifact
        await this.removeArtifact(artifactID);
    }

    /**
     * Shutdown the artifact manager
     * @returns {Promise}
     */
    async shutdown() {
        return new Promise(resolve => {
            if (!this._migrating) {
                return resolve();
            }
            this.once("migrationComplete", resolve);
        });
    }
}

module.exports = ArtifactManager;
