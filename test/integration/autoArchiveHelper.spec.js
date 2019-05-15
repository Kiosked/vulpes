const sleep = require("sleep-promise");
const AutoArchiveHelper = require("../../dist/helper/AutoArchiveHelper.js");
const Service = require("../../dist/Service.js");
const { JOB_RESULT_TYPE_FAILURE } = require("../../dist/symbols.js");

describe("AutoArchiveHelper", function() {
    beforeEach(function() {
        this.service = new Service();
        this.autoArchiveHelper = new AutoArchiveHelper({
            checkInterval: 250,
            archivePeriod: 300
        });
        return this.service.initialise();
    });

    afterEach(function() {
        return this.service.shutdown();
    });

    it("archives jobs", function() {
        return this.service
            .addJob({ type: "test" })
            .then(jobID => {
                this.jobID = jobID;
                return this.service.startJob(jobID);
            })
            .then(() => this.service.stopJob(this.jobID, JOB_RESULT_TYPE_FAILURE))
            .then(() => {
                this.service.use(this.autoArchiveHelper);
                return sleep(600);
            })
            .then(() => this.service.getJob(this.jobID))
            .then(job => {
                expect(job.archived).to.be.true;
            });
    });

    it("does not archive jobs too early", function() {
        return this.service
            .addJob({ type: "test" })
            .then(jobID => {
                this.jobID = jobID;
                return this.service.startJob(jobID);
            })
            .then(() => this.service.stopJob(this.jobID, JOB_RESULT_TYPE_FAILURE))
            .then(() => {
                this.service.use(this.autoArchiveHelper);
                return sleep(350);
            })
            .then(() => this.service.getJob(this.jobID))
            .then(job => {
                expect(job.archived).to.be.false;
            });
    });
});
