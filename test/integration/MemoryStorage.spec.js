const fs = require("fs");
const tmp = require("tmp");
const uuid = require("uuid/v4");
const sleep = require("sleep-promise");
const FileStorage = require("../../dist/storage/FileStorage.js");
const MemoryStorage = require("../../dist/storage/MemoryStorage.js");

function getTempFilePath() {
    return new Promise((resolve, reject) => {
        tmp.file((err, filename) => {
            if (err) {
                return reject(err);
            }
            resolve(filename);
        });
    });
}

describe("MemoryStorage", function() {
    describe("using FileStorage", function() {
        beforeEach(function() {
            return getTempFilePath().then(filename => {
                this.itemID = uuid();
                fs.writeFileSync(
                    filename,
                    JSON.stringify({
                        [this.itemID]: {
                            id: this.itemID,
                            type: "test"
                        }
                    })
                );
                this.filename = filename;
                this.fileStorage = new FileStorage(filename);
                this.storage = new MemoryStorage({
                    fileStorage: this.fileStorage,
                    flushDelay: 150
                });
                return this.storage.initialise();
            });
        });

        it("flushes set items to disk", async function() {
            const id = uuid();
            const item = { id, type: "test" };
            await this.storage.setItem(id, item);
            await sleep(500);
            const items = JSON.parse(fs.readFileSync(this.filename, "utf8"));
            expect(items).to.have.property(id);
            expect(items[id]).to.have.property("type", "test");
        });

        it("supports existing items on disk", async function() {
            const id = uuid();
            const item = { id, type: "test" };
            await this.storage.setItem(id, item);
            await sleep(500);
            const items = JSON.parse(fs.readFileSync(this.filename, "utf8"));
            expect(items).to.have.property(this.itemID);
        });
    });
});
