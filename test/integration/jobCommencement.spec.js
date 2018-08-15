const Service = require("../../source/Service.js");
const { JOB_STATUS_RUNNING } = require("../../source/symbols.js");

describe("Service", function() {
    beforeEach(function() {
        this.service = new Service();
        return this.service
            .initialise()
            .then(() => Promise.all([
                this.service.addJob({ data: { name: "test1" } }),
                this.service.addJob({ data: { name: "test2" } }),
            ]))
            .then(([jobID1, jobID2]) => {
                Object.assign(this, {
                    jobID1, jobID2
                });
            });
    });

    it("can start jobs", function() {
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
});
