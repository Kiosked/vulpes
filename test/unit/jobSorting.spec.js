const { sortJobsByPriority } = require("../../dist/jobSorting.js");
const {
    JOB_PRIORITY_HIGH,
    JOB_PRIORITY_LOW,
    JOB_PRIORITY_NORMAL
} = require("../../dist/symbols.js");

describe("jobSorting", function() {
    describe("sortJobsByPriority", function() {
        beforeEach(function() {
            const now = Date.now();
            const jobs = [
                { priority: JOB_PRIORITY_NORMAL, created: now, type: "job1" },
                { priority: JOB_PRIORITY_NORMAL, created: now - 10, type: "job3" },
                { priority: JOB_PRIORITY_HIGH, created: now - 5, type: "job2" },
                { priority: JOB_PRIORITY_LOW, created: now - 20, type: "job5" },
                { priority: JOB_PRIORITY_LOW, created: now - 2, type: "job4" }
            ];
            this.sorted = sortJobsByPriority(jobs);
        });

        it("sorts priority HIGH over NORMAL", function() {
            const highInd = this.sorted.findIndex(job => job.type === "job2");
            const normalInd = this.sorted.findIndex(job => job.type === "job1");
            expect(highInd).to.be.below(normalInd);
        });

        it("sorts priority NORMAL over LOW", function() {
            const normalInd = this.sorted.findIndex(job => job.type === "job1");
            const lowInd = this.sorted.findIndex(job => job.type === "job4");
            expect(normalInd).to.be.below(lowInd);
        });

        it("sorts by older created-timestamp after priority", function() {
            const normal1Ind = this.sorted.findIndex(job => job.type === "job1");
            const normal2Ind = this.sorted.findIndex(job => job.type === "job3");
            expect(normal2Ind).to.be.below(normal1Ind);
        });
    });
});
