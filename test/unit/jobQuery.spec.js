const { selectJob, selectJobs } = require("../../dist/jobQuery.js");

describe("jobGeneration", function() {
    beforeEach(function() {
        this.jobs = [
            { id: "1000", type: "generic", data: { deep: { value: 1 } } },
            { id: "1001", type: "system/test", data: { deep: { value: 2 } } },
            { id: "1003", type: "system/test", data: { deep: { name: "test" } } }
        ];
    });

    describe("selectJob", function() {
        it("returns only one job", function() {
            const job = selectJob(this.jobs, { type: /.+/ });
            expect(job).to.be.an("object");
        });

        it("returns found job correctly", function() {
            const job = selectJob(this.jobs, { type: "generic" });
            expect(job).to.deep.equal(this.jobs[0]);
        });

        it("returns null if no job found", function() {
            const job = selectJob(this.jobs, { type: "not-here" });
            expect(job).to.be.null;
        });

        it("throws if no query provided", function() {
            expect(() => {
                selectJob(this.jobs, {});
            }).to.throw(/cannot be empty/i);
        });

        it("returns jobs that match a deep-query", function() {
            const job = selectJob(this.jobs, {
                "data.deep.name": "test"
            });
            expect(job).to.deep.equal(this.jobs[2]);
        });
    });

    describe("selectJobs", function() {
        it("returns an array of found jobs", function() {
            const jobs = selectJobs(this.jobs, { type: /.+/ });
            expect(jobs).to.be.an("array");
        });

        it("returns an empty array when no jobs are found", function() {
            const jobs = selectJobs(this.jobs, { type: "not-here" });
            expect(jobs).to.deep.equal([]);
        });

        it("throws if no query provided", function() {
            expect(() => {
                selectJobs(this.jobs, {});
            }).to.throw(/cannot be empty/i);
        });

        it("returns jobs that match a deep-query", function() {
            const jobs = selectJobs(this.jobs, {
                "data.deep.value": /^\d+$/
            });
            expect(jobs).to.have.a.lengthOf(2);
        });
    });
});
