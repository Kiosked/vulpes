const Service = require("../../dist/Service.js");
const { JOB_STATUS_PENDING, JOB_STATUS_STOPPED } = require("../../dist/symbols.js");

describe("Service", function() {
    beforeEach(function() {
        this.service = new Service();
        return this.service
            .initialise()
            .then(() =>
                Promise.all([
                    this.service.addJob({ data: { name: "test1" }, type: "test1" }),
                    this.service.addJob({ data: { name: "test2" }, type: "test2" })
                ])
            )
            .then(([jobID1, jobID2]) => {
                Object.assign(this, {
                    jobID1,
                    jobID2
                });
            });
    });

    afterEach(function() {
        return this.service.shutdown();
    });

    describe("when querying jobs", function() {
        it("can query for jobs with data values", function() {
            return this.service.queryJobs({ "data.name": /^test\d+$/ }).then(jobs => {
                expect(jobs).to.have.lengthOf(2);
            });
        });

        it("can query for jobs with exact data values", function() {
            return this.service.queryJobs({ "data.name": "test2" }).then(jobs => {
                expect(jobs).to.have.lengthOf(1);
                expect(jobs[0]).to.have.property("id", this.jobID2);
            });
        });

        it("can limit jobs", function() {
            return this.service.queryJobs({}, { limit: 1 }).then(jobs => {
                expect(jobs).to.have.lengthOf(1);
            });
        });

        it("can offset the start index of jobs", function() {
            return this.service.queryJobs({}, { start: 1 }).then(jobs => {
                expect(jobs).to.have.lengthOf(1);
            });
        });

        it("can sort, order and limit while processing the total jobs", function() {
            return this.service
                .addJobs([
                    { id: 1, type: "test3" },
                    { id: 2, type: "test4" },
                    { id: 3, type: "test5" },
                    { id: 4, type: "test6" },
                    { id: 5, type: "test7" }
                ])
                .then(() =>
                    this.service.queryJobs({}, { start: 2, limit: 3, sort: "type", order: "desc" })
                )
                .then(jobs => {
                    const mapped = jobs.map(job => job.type);
                    expect(mapped).to.deep.equal(["test5", "test4", "test3"]);
                    expect(jobs).to.have.property("total", 7);
                });
        });

        it("can sort jobs", function() {
            return this.service.queryJobs({}, { sort: "type", order: "desc" }).then(jobs => {
                expect(jobs).to.have.lengthOf(2);
                expect(jobs[0].type).to.equal("test2");
                expect(jobs[1].type).to.equal("test1");
            });
        });
    });
});
