require("./polyfill.js");

const Service = require("./Service.js");
const ArtifactManager = require("./ArtifactManager.js");

const Helper = require("./helper/Helper.js");
const AutoArchiveHelper = require("./helper/AutoArchiveHelper.js");
const StorageMigrationHelper = require("./helper/StorageMigrationHelper.js");
const TimeoutHelper = require("./helper/TimeoutHelper.js");

const Storage = require("./storage/Storage.js");
const FileStorage = require("./storage/FileStorage.js");
const MemoryStorage = require("./storage/MemoryStorage.js");
const RedisStorage = require("./storage/RedisStorage.js");

const Symbol = require("./symbols.js");

const { convertTemplateToJobArray } = require("./template.js");
const { waitForStream } = require("./streams.js");

/**
 * @module Vulpes
 */

module.exports = {
    Service,
    ArtifactManager,
    Symbol,

    Helper,
    AutoArchiveHelper,
    StorageMigrationHelper,
    TimeoutHelper,

    Storage,
    FileStorage,
    MemoryStorage,
    RedisStorage,

    convertTemplateToJobArray,
    waitForStream
};
