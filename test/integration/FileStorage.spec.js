const fs = require("fs");
const tmp = require("tmp");
const uuid = require("uuid/v4");
const FileStorage = require("../../dist/storage/FileStorage.js");

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

describe("FileStorage", function() {
    beforeEach(function() {
        this.itemID = uuid();
        return getTempFilePath().then(filename => {
            this.filename = filename;
            fs.writeFileSync(
                filename,
                JSON.stringify({
                    [this.itemID]: {
                        id: this.itemID,
                        type: "test"
                    }
                })
            );
            this.storage = new FileStorage(filename);
            return this.storage.initialise();
        });
    });

    describe("setItems", function() {
        it("writes and appends items", function() {
            const newItemID = uuid();
            return this.storage
                .setItems({
                    [newItemID]: { id: newItemID, type: "test2" }
                })
                .then(() => {
                    const writtenItems = JSON.parse(fs.readFileSync(this.filename, "utf8"));
                    expect(writtenItems[this.itemID]).to.have.property("type", "test");
                    expect(writtenItems[newItemID]).to.have.property("type", "test2");
                });
        });

        it("writes overwrites when specified", function() {
            const newItemID = uuid();
            return this.storage
                .setItems(
                    {
                        [newItemID]: { id: newItemID, type: "test2" }
                    },
                    "clear"
                )
                .then(() => {
                    const writtenItems = JSON.parse(fs.readFileSync(this.filename, "utf8"));
                    expect(writtenItems).to.not.have.property(this.itemID);
                    expect(writtenItems[newItemID]).to.have.property("type", "test2");
                });
        });
    });
});
