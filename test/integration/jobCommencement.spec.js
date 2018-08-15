const Service = require("../../source/Service.js");
const { JOB_STATUS_RUNNING } = require("../../source/symbols.js");

describe("Service", function() {
    beforeEach(function() {
        this.service = new Service();
        return this.service
            .initialise()
            .then(() => Promise.all([
                this.service.addJob({ data: { name: "test1" }, priority: Service.JobPriority.High }),
                this.service.addJob({ data: { name: "test2" }, priority: Service.JobPriority.Normal }),
            ]))
            .then(([jobID1, jobID2]) => {
                Object.assign(this, {
                    jobID1, jobID2
                });
            });
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
            return this.service
                .startJob(this.jobID1)
                .then(workerData => {
                    expect(workerData).to.have.property("id", this.jobID1);
                    expect(workerData).to.have.property("type", "generic");
                    expect(workerData).to.have.property("data")
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
                .then(() => this.service.stopJob(this.jobID1, Service.JobResult.Success, {
                    name: "test1-2",
                    value: 2
                }))
                .then(() => this.service.startJob(this.jobID3))
                .then(workerJob => {
                    const { data } = workerJob;
                    expect(data).to.deep.equal({
                        name: "test1-3",
                        value: 2
                    });
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
    });
});
