const os = require("os");
const path = require("path");
const fs = require("fs");
const EventEmitter = require("eventemitter3");
const pify = require("pify");
const rimraf = pify(require("rimraf"));
const mkdirp = pify(require("mkdirp"));
const dataURIToBuffer = require("data-uri-to-buffer");
const parseDataURI = require("parse-data-uri");
const endOfStream = require("end-of-stream");

const ATTACHMENT_REXP = /^%attachment:[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;

function getArtifactPath(storagePath, artifactID) {
    return path.join(storagePath, `${artifactID}.vulpesartifact`);
}

function getDefaultStoragePath() {
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

class ArtifactManager extends EventEmitter {
    constructor(storagePath = getDefaultStoragePath()) {
        super();
        this._path = storagePath;
        this._migrating = false;
        this.service = null;
    }

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

    async getArtifactReadStream(artifactID) {
        const filename = getArtifactPath(this._path, artifactID);
        return fs.createReadStream(filename);
    }

    async getArtifactWriteStream(artifactID) {
        const filename = getArtifactPath(this._path, artifactID);
        return fs.createWriteStream(filename);
    }

    async removeArtifact(artifactID) {
        const filename = getArtifactPath(this._path, artifactID);
        await rimraf(filename);
    }

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
