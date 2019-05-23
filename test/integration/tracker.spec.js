const Service = require("../../dist/Service.js");
const {
    JOB_RESULT_TYPE_FAILURE,
    JOB_RESULT_TYPE_SUCCESS,
    JOB_STATUS_PENDING,
    JOB_STATUS_STOPPED
} = require("../../dist/symbols.js");

describe("Tracker", function() {
    beforeEach(function() {
        this.service = new Service();
        return this.service
            .initialise()
            .then(() =>
                Promise.all([
                    this.service.addJob({ type: "test1" }),
                    this.service.addJob({ type: "test2" }),
                    this.service.addJob({ type: "test3" }),
                    this.service.addJob({ type: "test4" })
                ])
            )
            .then(([jobID1, jobID2, jobID3, jobID4]) => {
                return this.service
                    .startJob(jobID1)
                    .then(() => this.service.startJob(jobID2))
                    .then(() => this.service.startJob(jobID3))
                    .then(() => this.service.stopJob(jobID1, JOB_RESULT_TYPE_FAILURE))
                    .then(() => this.service.stopJob(jobID2, JOB_RESULT_TYPE_SUCCESS));
            });
    });

    afterEach(function() {
        return this.service.shutdown();
    });

    it("returns correct job stats", function() {
        return this.service.tracker.fetchStats().then(stats => {
            expect(stats).to.deep.equal({
                totalJobs: 4,
                stoppedJobs: 2,
                runningJobs: 1,
                pendingJobs: 1,
                succeededJobs: 1,
                failedJobs: 1,
                jobsInLastHour: 1
            });
        });
    });
});
