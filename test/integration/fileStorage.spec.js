const tmp = require("tmp");
const Service = require("../../dist/Service.js");
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

describe("Service", function() {
    beforeEach(function() {
        return getTempFilePath()
            .then(filename => {
                this.service = new Service(new FileStorage(filename));
                return this.service.initialise();
            })
            .then(() =>
                this.service.addJobs([
                    { id: 1, type: "job1" },
                    { id: 2, type: "job2", parents: [1] },
                    { id: 3, type: "job3", parents: [1, 2] },
                    { id: 4, type: "job4", parents: [3] },
                    { id: 5, type: "job5", parents: [4] },
                    { id: 6, type: "job6", parents: [4] }
                ])
            )
            .then(jobs => jobs.map(job => job.id))
            .then(ids => {
                this.jobIDs = ids;
            });
    });

    afterEach(function() {
        this.service.shutdown();
    });

    it("reads jobs", function() {
        return this.service.queryJobs().then(jobs => {
            expect(jobs).to.have.lengthOf(6);
        });
    });
});
