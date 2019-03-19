const sleep = require("sleep-promise");
const Service = require("../../dist/Service.js");

describe("Service", function() {
    beforeEach(function() {
        this.service = new Service();
        return this.service
            .initialise()
            .then(() =>
                Promise.all([
                    this.service.addJob({
                        data: { name: "test1" },
                        priority: Service.JobPriority.Low
                    }),
                    this.service.addJob({
                        data: { name: "test2" },
                        priority: Service.JobPriority.Normal
                    })
                ])
            )
            .then(() => sleep(80))
            .then(() =>
                this.service.addJob({ data: { name: "test3" }, priority: Service.JobPriority.High })
            );
    });

    afterEach(function() {
        this.service.shutdown();
    });

    describe("getNextJob", function() {
        it("returns the correct next job", function() {
            return expect(this.service.getNextJob())
                .to.eventually.have.property("data")
                .that.deep.equals({ name: "test3" });
        });

        it("returns the next correct job after one is taken", function() {
            return this.service
                .getNextJob()
                .then(job => this.service.startJob(job.id))
                .then(() => this.service.getNextJob())
                .then(nextJob => {
                    expect(nextJob.data.name).to.equal("test2");
                });
        });

        it("returns null if no jobs are available", function() {
            this.service = new Service();
            return this.service
                .initialise()
                .then(() => this.service.getNextJob())
                .then(job => {
                    expect(job).to.be.null;
                });
        });
    });
});
