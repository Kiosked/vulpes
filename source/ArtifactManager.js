const os = require("os");
const path = require("path");
const fs = require("fs");
const pify = require("pify");
const rimraf = pify(require("rimraf"));
const mkdirp = pify(require("mkdirp"));

function getArtifactPath(storagePath, artifactID) {
    return path.join(storagePath, `${artifactID}.vulpesartifact`);
}

function getDefaultStoragePath() {
    return path.join(os.homedir(), ".vulpes/artifacts");
}

class ArtifactManager {
    constructor(storagePath = getDefaultStoragePath()) {
        this._path = storagePath;
    }

    async initialise() {
        await mkdirp(this._path);
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
}

module.exports = ArtifactManager;
