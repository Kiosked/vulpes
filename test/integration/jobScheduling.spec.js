const sleep = require("sleep-promise");
const Service = require("../../dist/Service.js");
const { UUID_REXP } = require("../../dist/symbols.js");

const CRON_WEEKLY = "0 0 * * 0"; // Sunday

function createFakeCronTask() {
    return {
        destroy: sinon.spy()
    };
}

describe("Scheduler", function() {
    beforeEach(function() {
        this.service = new Service();
        return this.service.initialise();
    });

    afterEach(function() {
        this.service.shutdown();
    });

    it("fires events for newly scheduled tasks", function() {
        sinon.stub(this.service.scheduler, "_cronSchedule").returns(createFakeCronTask());
        const createdJobsSpy = sinon.spy();
        const taskScheduledSpy = sinon.spy();
        this.service.scheduler.once("createdJobsFromTask", createdJobsSpy);
        this.service.scheduler.once("taskScheduled", taskScheduledSpy);
        return this.service.scheduler
            .addScheduledJobs({
                title: "Test",
                schedule: CRON_WEEKLY,
                jobs: [
                    {
                        id: 1,
                        type: "test/job"
                    }
                ]
            })
            .then(() => {
                this.service.scheduler._cronSchedule.firstCall.args[1]();
            })
            .then(() => sleep(100))
            .then(() => {
                expect(createdJobsSpy.callCount).to.equal(1);
                expect(taskScheduledSpy.callCount).to.equal(1);
                expect(taskScheduledSpy.calledBefore(createdJobsSpy)).to.be.true;
                const [createdJobData] = createdJobsSpy.firstCall.args;
                const [taskScheduledData] = taskScheduledSpy.firstCall.args;
                expect(createdJobData)
                    .to.have.property("jobs")
                    .that.is.an("array")
                    .that.has.lengthOf(1);
                expect(createdJobData.jobs[0].id).to.match(UUID_REXP);
                expect(createdJobData)
                    .to.have.property("id")
                    .that.matches(UUID_REXP);
                expect(createdJobData).to.have.property("title", "Test");
                expect(createdJobData).to.have.property("schedule", CRON_WEEKLY);
                expect(taskScheduledData)
                    .to.have.property("id")
                    .that.equals(createdJobData.id);
                expect(taskScheduledData).to.have.property("title", "Test");
                expect(taskScheduledData).to.have.property("schedule", CRON_WEEKLY);
                expect(taskScheduledData).to.have.property("enabled", true);
            });
    });

    it("does not execute disabled tasks", function() {
        sinon.stub(this.service.scheduler, "_cronSchedule").returns(createFakeCronTask());
        const exeSpy = sinon.spy();
        this.service.scheduler.once("createdJobsFromTask", exeSpy);
        return this.service.scheduler
            .addScheduledJobs({
                title: "Test",
                schedule: CRON_WEEKLY,
                jobs: [
                    {
                        id: 1,
                        type: "test/job"
                    }
                ]
            })
            .then(taskID => this.service.scheduler.toggleTask(taskID, false))
            .then(() => {
                this.service.scheduler._cronSchedule.firstCall.args[1]();
            })
            .then(() => sleep(100))
            .then(() => {
                expect(exeSpy.notCalled).to.be.true;
            });
    });

    it("supports updating jobs within a task", function() {
        let taskID;
        return this.service.scheduler
            .addScheduledJobs({
                title: "Test",
                schedule: CRON_WEEKLY,
                jobs: [
                    {
                        id: 1,
                        type: "test/job"
                    },
                    {
                        id: 2,
                        type: "test/job/2"
                    }
                ]
            })
            .then(id => {
                taskID = id;
            })
            .then(() =>
                this.service.scheduler.setJobsForScheduledTask(taskID, [
                    {
                        id: 1,
                        type: "test/job/3"
                    }
                ])
            )
            .then(() => this.service.scheduler.getScheduledTask(taskID))
            .then(task => {
                expect(task.jobs).to.have.lengthOf(1);
                expect(task.jobs[0]).to.have.property("type", "test/job/3");
            });
    });
});
