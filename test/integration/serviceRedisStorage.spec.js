const Service = require("../../dist/Service.js");
const RedisStorage = require("../../dist/storage/RedisStorage.js");
const { JOB_PRIORITY_HIGH } = require("../../dist/symbols.js");

describe("Service", function() {
    beforeEach(function() {
        return Promise.resolve()
            .then(filename => {
                this.redisStorage = new RedisStorage({ db: 1 });
                return this.redisStorage.redis.flushdb();
            })
            .then(() => {
                this.service = new Service(this.redisStorage);
                return this.service.initialise();
            })
            .then(() =>
                this.service.addJobs([
                    { id: 1, type: "job1" },
                    { id: 2, type: "job2", parents: [1] },
                    { id: 3, type: "job3", parents: [1, 2] },
                    { id: 4, type: "job4", parents: [3] },
                    { id: 5, type: "job5", parents: [4] },
                    { id: 6, type: "job6", parents: [4] }
                ])
            )
            .then(jobs => jobs.map(job => job.id))
            .then(ids => {
                this.jobIDs = ids;
            });
    });

    afterEach(function() {
        return this.service.shutdown();
    });

    describe("when using RedisStorage", function() {
        it("reads jobs", function() {
            return this.service.queryJobs().then(jobs => {
                expect(jobs).to.have.lengthOf(6);
            });
        });

        it("updates jobs", function() {
            const [firstJobID] = this.jobIDs;
            return this.service
                .updateJob(firstJobID, { type: "job1-1", priority: JOB_PRIORITY_HIGH })
                .then(() => this.service.getJob(firstJobID))
                .then(job => {
                    expect(job.type).to.equal("job1-1");
                    expect(job.priority).to.equal(JOB_PRIORITY_HIGH);
                });
        });
    });
});
