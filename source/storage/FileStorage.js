const fs = require("fs");
const debounce = require("debounce");
const ChannelQueue = require("@buttercup/channel-queue");
const pify = require("pify");
const sleep = require("sleep-promise");
const MemoryStorage = require("./MemoryStorage.js");

const FILE_WRITE_DELAY = 500;

const writeFile = pify(fs.writeFile);

class FileStorage extends MemoryStorage {
    constructor(filename) {
        super();
        this._filename = filename;
        this._queue = new ChannelQueue();
        this.writeStateToFile = debounce(
            this._writeStateToFile.bind(this),
            FILE_WRITE_DELAY,
            /* immediate: */ false
        );
    }

    _getSerialisedState() {

    }

    _writeStateToFile() {
        this._queue.channel("write").enqueue(() => {
            return writeFile(this._filename, this._getSerialisedState())
                .then(() => sleep(100));
        });
    }
}

module.exports = FileStorage;
