const Service = require("../../dist/Service.js");
const { JOB_STATUS_RUNNING } = require("../../dist/symbols.js");

describe("Service", function() {
    beforeEach(function() {
        this.service = new Service();
        return this.service
            .initialise()
            .then(() =>
                Promise.all([
                    this.service.addJob({
                        data: { name: "test1" },
                        predicate: { timeBetweenRetries: 0 },
                        priority: Service.JobPriority.High
                    }),
                    this.service.addJob({
                        data: { name: "test2" },
                        predicate: { timeBetweenRetries: 0 },
                        priority: Service.JobPriority.Normal
                    })
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
        this.service.shutdown();
    });

    describe("when starting jobs", function() {
        it("starts jobs corrects", function() {
            return this.service
                .startJob(this.jobID1)
                .then(() => this.service.getJob(this.jobID1))
                .then(job => {
                    expect(job.status).to.equal(JOB_STATUS_RUNNING);
                });
        });

        it("starts jobs by outputting worker-specific data", function() {
            return this.service.startJob(this.jobID1).then(workerData => {
                expect(workerData).to.have.property("id", this.jobID1);
                expect(workerData).to.have.property("type", "generic");
                expect(workerData)
                    .to.have.property("data")
                    .that.deep.equals({
                        name: "test1"
                    });
                expect(workerData).to.have.property("timeLimit", this.service.timeLimit);
            });
        });

        it("provides data merged in the correct manner", function() {
            return this.service
                .addJob({ parents: [this.jobID1], data: { name: "test1-3" } })
                .then(jobID => {
                    this.jobID3 = jobID;
                })
                .then(() => this.service.startJob(this.jobID1))
                .then(() =>
                    this.service.stopJob(this.jobID1, Service.JobResult.Success, {
                        name: "test1-2",
                        value: 2
                    })
                )
                .then(() => this.service.startJob(this.jobID3))
                .then(workerJob => {
                    const { data } = workerJob;
                    expect(data).to.deep.equal({
                        name: "test1-3",
                        value: 2
                    });
                });
        });

        it("merges sticky properties from failed result set", function() {
            return this.service
                .addJob({
                    parents: [this.jobID1],
                    data: { name: "test1-3" },
                    predicate: { timeBetweenRetries: 0 }
                })
                .then(jobID => {
                    this.jobID3 = jobID;
                })
                .then(() => this.service.startJob(this.jobID1))
                .then(() =>
                    this.service.stopJob(this.jobID1, Service.JobResult.Success, {
                        name: "test1-2",
                        value: 2
                    })
                )
                .then(() => this.service.startJob(this.jobID3))
                .then(() =>
                    this.service.stopJob(this.jobID3, Service.JobResult.SoftFailure, {
                        wontappear: 1,
                        $special: 2
                    })
                )
                .then(() => this.service.startJob(this.jobID3))
                .then(workerJob => {
                    const { data } = workerJob;
                    expect(data).to.deep.equal({
                        name: "test1-3",
                        value: 2,
                        $special: 2
                    });
                });
        });

        it("merges sticky results from previous job run", function() {
            return this.service
                .startJob(this.jobID1)
                .then(() =>
                    this.service.stopJob(this.jobID1, Service.JobResult.SoftFailure, {
                        $stickyTest: 123
                    })
                )
                .then(() => this.service.startJob(this.jobID1))
                .then(workerJob => {
                    const { data } = workerJob;
                    expect(data).to.have.property("$stickyTest", 123);
                });
        });

        it("fails if the job ID doesn't exist", function() {
            const work = this.service.startJob("notreal");
            return expect(work).to.be.rejectedWith(/No job found for ID/i);
        });

        it("starts jobs dynamically", function() {
            return this.service
                .startJob()
                .then(job => {
                    expect(job.data.name).to.equal("test1");
                    return this.service.startJob();
                })
                .then(job => {
                    expect(job.data.name).to.equal("test2");
                    return this.service.startJob();
                })
                .then(job => {
                    expect(job).to.be.null;
                });
        });

        it("fails if a predicate is unsatisfied", function() {
            return this.service.addJob({ predicate: { locked: true } }).then(jobID => {
                const startProm = this.service.startJob(jobID);
                return expect(startProm).to.eventually.be.rejectedWith(
                    /Predicate 'locked' not satisfied/i
                );
            });
        });
    });

    describe("when stopping jobs", function() {
        beforeEach(function() {
            return this.service.startJob(this.jobID1);
        });

        it("sets the job result type", function() {
            return this.service
                .stopJob(this.jobID1, Service.JobResult.Success, { value: 42 })
                .then(() => this.service.getJob(this.jobID1))
                .then(job => {
                    expect(job.result.type).to.equal(Service.JobResult.Success);
                });
        });

        it("merges the job result data correctly", function() {
            return this.service
                .stopJob(this.jobID1, Service.JobResult.Success, { value: 42 })
                .then(() => this.service.getJob(this.jobID1))
                .then(job => {
                    expect(job.result.data).to.deep.equal({
                        name: "test1", // merged from data
                        value: 42
                    });
                });
        });
    });

    describe("when resetting jobs", function() {
        beforeEach(function() {
            return this.service
                .startJob(this.jobID1)
                .then(() => this.service.stopJob(this.jobID1, Service.JobResult.Timeout));
        });

        it("changes timeout result types to soft fails", function() {
            return this.service
                .resetJob(this.jobID1)
                .then(() => this.service.getJob(this.jobID1))
                .then(job => {
                    expect(job.result.type).to.equal(Service.JobResult.SoftFailure);
                });
        });
    });
});
