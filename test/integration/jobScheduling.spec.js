const sleep = require("sleep-promise");
const Service = require("../../dist/Service.js");
const { ITEM_TYPE, ITEM_TYPE_SCHEDULED_TASK, UUID_REXP } = require("../../dist/symbols.js");

const CRON_SECONDS = "*/2 * * * * *"; // Every 2 seconds
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
            .addScheduledTask({
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
            .addScheduledTask({
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
            .addScheduledTask({
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

    it("sets the correct item type", function() {
        return this.service.scheduler
            .addScheduledTask({
                title: "Test",
                schedule: CRON_WEEKLY,
                jobs: []
            })
            .then(id => this.service.scheduler.getScheduledTask(id))
            .then(task => {
                expect(task).to.have.property(ITEM_TYPE, ITEM_TYPE_SCHEDULED_TASK);
            });
    });

    it("can return all scheduled tasks", function() {
        return Promise.all([
            this.service.scheduler.addScheduledTask({
                title: "test1",
                schedule: CRON_WEEKLY,
                jobs: []
            }),
            this.service.scheduler.addScheduledTask({
                title: "test2",
                schedule: CRON_WEEKLY,
                jobs: []
            }),
            this.service.scheduler.addScheduledTask({
                title: "test3",
                schedule: CRON_WEEKLY,
                jobs: []
            })
        ])
            .then(() => this.service.scheduler.getScheduledTasks())
            .then(tasks => {
                expect(tasks).to.have.lengthOf(3);
            });
    });

    it("executes tasks using CRON", function() {
        const fn = sinon.spy();
        this.service.scheduler.on("createdJobsFromTask", fn);
        return this.service.scheduler
            .addScheduledTask({
                title: "Test",
                schedule: CRON_SECONDS,
                jobs: [
                    {
                        id: 1,
                        type: "test-job"
                    }
                ]
            })
            .then(() => sleep(2250))
            .then(() => {
                expect(fn.callCount).to.be.above(0);
                expect(fn.callCount).to.be.below(3);
                const task = fn.firstCall.args[0];
                const [job] = task.jobs;
                expect(job).to.have.property("type", "test-job");
            });
    });
});
