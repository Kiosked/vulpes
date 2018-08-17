const Service = require("../../dist/Service.js");
const { UUID_REXP } = require("../../dist/symbols.js");

describe("Service", function() {
    beforeEach(function() {
        this.service = new Service();
        return this.service.initialise();
    });

    describe("addJob", function() {
        it("can add jobs", function() {
            return Promise.all([this.service.addJob(), this.service.addJob()])
                .then(() => this.service.storage.getAllKeys())
                .then(keys => {
                    expect(keys).to.have.lengthOf(2);
                });
        });
    });

    describe("addJobs", function() {
        it("can add multiple jobs", function() {
            return this.service
                .addJobs([
                    { id: 1, type: "job/type/1" },
                    { id: 2, type: "job/type/2" },
                    { id: 3, type: "job/type/3" }
                ])
                .then(results => {
                    expect(results).to.have.lengthOf(3);
                    expect(results[0])
                        .to.have.property("id")
                        .that.matches(UUID_REXP);
                    expect(results[0]).to.have.property("type", "job/type/1");
                    expect(results[1])
                        .to.have.property("id")
                        .that.matches(UUID_REXP);
                    expect(results[1]).to.have.property("type", "job/type/2");
                    expect(results[2])
                        .to.have.property("id")
                        .that.matches(UUID_REXP);
                    expect(results[2]).to.have.property("type", "job/type/3");
                });
        });

        it("can add jobs with inter-dependency", function() {
            return this.service
                .addJobs([
                    { id: 1, type: "job/type/1", parents: [2, 3] },
                    { id: 2, type: "job/type/2" },
                    { id: 3, type: "job/type/3" }
                ])
                .then(results => {
                    const [job1, job2, job3] = results;
                    expect(job1.parents).to.deep.equal([job2.id, job3.id]);
                });
        });

        it("throws if resolutions can't be performed", function() {
            const work = this.service.addJobs([
                { id: 1, type: "job/type/1", parents: [2] },
                { id: 2, type: "job/type/2", parents: [1] }
            ]);
            return expect(work).to.be.rejectedWith(/Stalled while resolving dependencies/i);
        });
    });
});
