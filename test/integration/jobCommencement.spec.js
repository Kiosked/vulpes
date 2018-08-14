const Service = require("../../source/Service.js");
const { JOB_STATUS_RUNNING } = require("../../source/symbols.js");

describe("Service", function() {
    beforeEach(function() {
        this.service = new Service();
        return Promise
            .all([
                this.service.addJob({ data: { name: "test1" } }),
                this.service.addJob({ data: { name: "test2" } }),
            ])
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
});
