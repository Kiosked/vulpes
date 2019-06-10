const uuid = require("uuid");
const readEntireStream = require("read-all-stream");
const ArtifactManager = require("../../dist/ArtifactManager.js");
const Service = require("../../dist/Service.js");
const MemoryStorage = require("../../dist/storage/MemoryStorage.js");

function createTextAttachment(title, text) {
    return {
        title,
        data: `data:text/plain;base64,${Buffer.from(text).toString("base64")}`,
        mime: "text/plain",
        created: Date.now()
    };
}

describe("ArtifactManager", function() {
    beforeEach(function() {
        const storage = new MemoryStorage();
        const service = new Service({ storage });
        this.artifact1 = uuid();
        this.artifact2 = uuid();
        return service
            .initialise()
            .then(() =>
                service.addJobs([
                    {
                        id: 1,
                        type: "job1",
                        result: {
                            data: {
                                [`%attachment:${this.artifact1}`]: createTextAttachment(
                                    "job1 test",
                                    "test"
                                ),
                                [`%attachment:${this.artifact2}`]: createTextAttachment(
                                    "job1 test 2",
                                    "test 2"
                                )
                            }
                        }
                    },
                    {
                        id: 2,
                        type: "job2",
                        parents: [1]
                    }
                ])
            )
            .then(([job1, job2]) => {
                Object.assign(this, {
                    jobID1: job1.id,
                    jobID2: job2.id
                });
                return service.shutdown();
            })
            .then(() => {
                this.artifactManager = new ArtifactManager("/tmp");
                this.service = new Service({ storage, artifactManager: this.artifactManager });
                const migratedPromise = new Promise(resolve =>
                    this.artifactManager.once("migrationComplete", resolve)
                );
                return this.service.initialise().then(() => migratedPromise);
            });
    });

    afterEach(function() {
        return this.service.shutdown();
    });

    it("removes data from job result artifacts", function() {
        return this.service.getJob(this.jobID1).then(job => {
            expect(job.result.data[`%attachment:${this.artifact1}`]).to.not.have.property("data");
            expect(job.result.data[`%attachment:${this.artifact2}`]).to.not.have.property("data");
        });
    });

    it("creates artifacts", function() {
        return Promise.all([
            this.artifactManager.getArtifactReadStream(this.artifact1),
            this.artifactManager.getArtifactReadStream(this.artifact2)
        ])
            .then(([rs1, rs2]) =>
                Promise.all([readEntireStream(rs1, "utf8"), readEntireStream(rs2, "utf8")])
            )
            .then(([txt1, txt2]) => {
                expect(txt1).to.equal("test");
                expect(txt2).to.equal("test 2");
            });
    });
});
