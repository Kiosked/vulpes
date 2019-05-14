const Service = require("../../dist/Service.js");

describe("Service", function() {
    beforeEach(function() {
        this.service = new Service();
        return this.service
            .initialise()
            .then(() =>
                this.service.addJobs([
                    {
                        id: 1,
                        type: "job1"
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
            });
    });

    afterEach(function() {
        return this.service.shutdown();
    });

    describe("when archiving jobs", function() {
        it("archives jobs", function() {
            const start = Date.now();
            return this.service
                .archiveJob(this.jobID1)
                .then(() => this.service.getJob(this.jobID1))
                .then(job => {
                    expect(job.archived).to.be.true;
                    expect(job.times.archived).to.be.closeTo(start, 1000);
                });
        });

        it("does not return archived jobs in queries by default", function() {
            return this.service
                .archiveJob(this.jobID1)
                .then(() => this.service.queryJobs({ type: /^job\d+$/ }))
                .then(jobs => {
                    expect(jobs).to.have.lengthOf(1);
                    expect(jobs[0].id).to.equal(this.jobID2);
                });
        });

        it("supports returning archived jobs", function() {
            return this.service
                .archiveJob(this.jobID1)
                .then(() => this.service.queryJobs({ type: /^job\d+$/, archived: true }))
                .then(jobs => {
                    expect(jobs).to.have.lengthOf(1);
                    expect(jobs[0].id).to.equal(this.jobID1);
                    expect(jobs[0].archived).to.be.true;
                });
        });
    });
});
