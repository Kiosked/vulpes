const fs = require("fs");
const debounce = require("debounce");
const ChannelQueue = require("@buttercup/channel-queue");
const pify = require("pify");
const tmp = require("tmp");
const endOfStream = require("end-of-stream");
const pump = require("pump");
const JSONStream = require("JSONStream");
const fileExists = require("file-exists");
const objectStream = require("object-stream");
const Storage = require("./Storage.js");

const JSON_PARSE_ARGS = ["*"];

class FileStorage extends Storage {
    constructor(filename) {
        super();
        this._filename = filename;
        this._queue = new ChannelQueue();
        this._unlinkFile = pify(fs.unlink);
    }

    async getItem(id) {
        const stream = await this.streamItems();
        return new Promise(resolve => {
            let found = false;
            stream.on("data", item => {
                if (item.id === id) {
                    found = true;
                    stream.destroy();
                    resolve(item);
                }
            });
            endOfStream(stream, () => {
                if (!found) {
                    resolve(null);
                }
            });
        });
    }

    async removeItem(id) {
        await this.setItem(id, null);
    }

    async setItem(id, item) {
        await this._queue.channel("stream").enqueue(async () => {
            const { tmpPath, cleanup } = await new Promise((resolve, reject) =>
                tmp.file((err, tmpPath, fd, cleanup) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve({ tmpPath, cleanup });
                })
            );
            const rs = fs
                .createReadStream(this._filename)
                .pipe(JSONStream.parse(...JSON_PARSE_ARGS));
            const ws = JSONStream.stringifyObject();
            const key = `${this.getKeyPrefix()}${id}`;
            let itemExisted = false;
            rs.on("data", currentItem => {
                if (currentItem.id === id) {
                    itemExisted = true;
                    if (item === null) {
                        return;
                    }
                    ws.write([key, item]);
                    return;
                }
                ws.write([key, currentItem]);
            });
            endOfStream(rs, () => {
                if (!itemExisted && item !== null) {
                    ws.write([key, item]);
                }
                ws.end();
            });
            await new Promise((resolve, reject) =>
                pump(ws, fs.createWriteStream(tmpPath), err => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                })
            );
            await new Promise((resolve, reject) =>
                pump(fs.createReadStream(tmpPath), fs.createWriteStream(this._filename), err => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                })
            );
            cleanup();
        });
    }

    async streamItems() {
        return await new Promise(async consumerResolve => {
            await this._queue.channel("stream").enqueue(
                () =>
                    new Promise(channelResolve => {
                        const stream = fs
                            .createReadStream(this._filename)
                            .pipe(JSONStream.parse(...JSON_PARSE_ARGS));
                        consumerResolve(stream);
                        endOfStream(stream, () => channelResolve());
                    })
            );
        });
    }
}

module.exports = FileStorage;
