const { filterDuplicateJobs, sortJobs, sortJobsByPriority } = require("../../dist/jobSorting.js");
const {
    JOB_PRIORITY_HIGH,
    JOB_PRIORITY_LOW,
    JOB_PRIORITY_NORMAL,
    JOB_STATUS_PENDING,
    JOB_STATUS_RUNNING,
    JOB_STATUS_STOPPED
} = require("../../dist/symbols.js");

describe("jobSorting", function() {
    describe("filterDuplicateJobs", function() {
        beforeEach(function() {
            this.jobs = [
                { id: "1000", type: "job1" },
                { id: "1000", type: "job2" },
                { id: "1001", type: "job3" }
            ];
        });

        it("removes duplicates", function() {
            const dedupedJobs = filterDuplicateJobs(this.jobs);
            expect(dedupedJobs).to.deep.equal([
                { id: "1000", type: "job1" },
                { id: "1001", type: "job3" }
            ]);
        });
    });

    describe("sortJobs", function() {
        beforeEach(function() {
            const now = Date.now();
            this.jobs = [
                {
                    priority: JOB_PRIORITY_NORMAL,
                    status: JOB_STATUS_PENDING,
                    created: now,
                    type: "job1"
                },
                {
                    priority: JOB_PRIORITY_NORMAL,
                    status: JOB_STATUS_RUNNING,
                    created: now - 10,
                    type: "job3"
                },
                {
                    priority: JOB_PRIORITY_HIGH,
                    status: JOB_STATUS_PENDING,
                    created: now - 5,
                    type: "job2"
                },
                {
                    priority: JOB_PRIORITY_LOW,
                    status: JOB_STATUS_STOPPED,
                    created: now - 20,
                    type: "job5"
                },
                {
                    priority: JOB_PRIORITY_LOW,
                    status: JOB_STATUS_PENDING,
                    created: now - 2,
                    type: "job4"
                }
            ];
        });

        it("sorts by created/descending by default", function() {
            const sorted = sortJobs(this.jobs);
            expect(sorted[0].type).to.equal("job1");
            expect(sorted[1].type).to.equal("job4");
            expect(sorted[2].type).to.equal("job2");
        });

        it("can sort by multiple properties", function() {
            const sorted = sortJobs(this.jobs, [
                { property: "status", direction: "asc" },
                { property: "type", direction: "desc" }
            ]);
            expect(sorted[0].type).to.equal("job4");
            expect(sorted[1].type).to.equal("job2");
            expect(sorted[2].type).to.equal("job1");
        });

        it("throws if the property is not recognised", function() {
            expect(() => {
                sortJobs(this.jobs, [
                    { property: "status", direction: "asc" },
                    { property: "wrong", direction: "desc" }
                ]);
            }).to.throw(/Invalid sort property/i);
        });

        it("throws if the direction is invalid", function() {
            expect(() => {
                sortJobs(this.jobs, [
                    { property: "status", direction: "asc" },
                    { property: "type", direction: "descending" }
                ]);
            }).to.throw(/Invalid sort direction/i);
        });
    });

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
