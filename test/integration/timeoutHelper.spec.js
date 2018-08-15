const TimeoutHelper = require("../../source/helper/TimeoutHelper.js");
const Service = require("../../source/Service.js");

describe("TimeoutHelper", function() {
    beforeEach(function() {
        this.service = new Service();
        this.timeoutHelper = new TimeoutHelper(500);
        return this.service.initialise();
    });

    afterEach(function() {
        this.service.shutdown();
    });

    it("times-out running jobs", function() {
        return this.service
            .addJob({ timeLimit: 100 })
            .then(jobID => {
                this.jobID = jobID;
                return this.service.startJob(jobID);
            })
            .then(
                () =>
                    new Promise((resolve, reject) => {
                        this.service.once("jobCompleted", () =>
                            reject(new Error("Job should have failed"))
                        );
                        this.service.once("jobFailed", ({ id }) => resolve(id));
                        this.service.use(this.timeoutHelper);
                    })
            )
            .then(jobID => this.service.getJob(jobID))
            .then(job => {
                expect(job.status).to.equal(Service.JobStatus.Stopped);
                expect(job.result.type).to.equal(Service.JobResult.Timeout);
            });
    });

    it("causes the service to fire a timeout event", function() {
        return this.service
            .addJob({ timeLimit: 100 })
            .then(jobID => {
                this.jobID = jobID;
                return this.service.startJob(jobID);
            })
            .then(
                () =>
                    new Promise(resolve => {
                        this.service.once("jobTimeout", ({ id }) => resolve(id));
                        this.service.use(this.timeoutHelper);
                    })
            )
            .then(jobID => {
                expect(jobID).to.equal(this.jobID);
            });
    });
});
