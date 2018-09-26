const Service = require("../../dist/Service.js");
const { JOB_PRIORITY_HIGH, JOB_STATUS_STOPPED } = require("../../dist/symbols.js");

describe("Service", function() {
    beforeEach(function() {
        this.service = new Service();
        return this.service
            .initialise()
            .then(() => this.service.addJob({ data: { name: "test1" }, type: "test1" }))
            .then(jobID => {
                this.jobID = jobID;
            });
    });

    describe("when updating jobs", function() {
        it("can update certain properties", function() {
            return this.service
                .updateJob(this.jobID, { type: "test1-1", priority: JOB_PRIORITY_HIGH })
                .then(() => this.service.getJob(this.jobID))
                .then(job => {
                    expect(job.type).to.equal("test1-1");
                    expect(job.priority).to.equal(JOB_PRIORITY_HIGH);
                });
        });

        it("emits 'jobUpdated' event upon update", function() {
            const prom = new Promise(resolve => {
                this.service.on("jobUpdated", resolve);
            });
            this.service.updateJob(this.jobID, { type: "test1-2" });
            return prom.then(jobUpdate => {
                expect(jobUpdate).to.have.property("id", this.jobID);
                expect(jobUpdate)
                    .to.have.property("original")
                    .that.has.property("type", "test1");
                expect(jobUpdate)
                    .to.have.property("updated")
                    .that.has.property("type", "test1-2");
            });
        });

        it("can update core properties when enabled", function() {
            return this.service
                .updateJob(this.jobID, { status: JOB_STATUS_STOPPED }, { filterProps: false })
                .then(() => this.service.getJob(this.jobID))
                .then(job => {
                    expect(job.status).to.equal(JOB_STATUS_STOPPED);
                });
        });
    });
});
