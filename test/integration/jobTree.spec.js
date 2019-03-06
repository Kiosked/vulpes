const Service = require("../../dist/Service.js");

describe("Service", function() {
    beforeEach(function() {
        this.service = new Service();
        return this.service
            .initialise()
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
        this.service.shutdown();
    });

    describe("getJobChildren", function() {
        it("gets only the first set of children when fullProgeny not set", function() {
            return this.service.getJobChildren(this.jobIDs[3] /* job4 */).then(children => {
                expect(children).to.have.lengthOf(2);
                const foundJobs = children.map(job => job.type).sort();
                expect(foundJobs).to.deep.equal(["job5", "job6"]);
            });
        });

        it("gets all children of a root job", function() {
            return this.service
                .getJobChildren(this.jobIDs[0], { fullProgeny: true })
                .then(children => {
                    expect(children).to.have.lengthOf(5);
                    const foundJobs = children.map(job => job.type).sort();
                    expect(foundJobs).to.deep.equal(["job2", "job3", "job4", "job5", "job6"]);
                });
        });

        it("gets all children of job with parents and children", function() {
            return this.service
                .getJobChildren(this.jobIDs[2] /* job3 */, { fullProgeny: true })
                .then(children => {
                    expect(children).to.have.lengthOf(3);
                    const foundJobs = children.map(job => job.type).sort();
                    expect(foundJobs).to.deep.equal(["job4", "job5", "job6"]);
                });
        });
    });

    describe("getJobParents", function() {
        it("gets all parents of a tail job", function() {
            return this.service
                .getJobParents(this.jobIDs[5] /* job6 */, { fullAncestry: true })
                .then(parents => {
                    expect(parents).to.have.lengthOf(4);
                    const foundJobs = parents.map(job => job.type).sort();
                    expect(foundJobs).to.deep.equal(["job1", "job2", "job3", "job4"]);
                });
        });

        it("gets only the first set of parents when fullAncestry not set", function() {
            return this.service.getJobParents(this.jobIDs[2] /* job3 */).then(parents => {
                expect(parents).to.have.lengthOf(2);
                const foundJobs = parents.map(job => job.type).sort();
                expect(foundJobs).to.deep.equal(["job1", "job2"]);
            });
        });
    });

    describe("getJobTree", function() {
        it("returns the full tree, top-down", function() {
            return this.service.getJobTree(this.jobIDs[0] /* job1 */).then(jobs => {
                expect(jobs).to.have.lengthOf(6);
                const foundJobs = jobs.map(job => job.type).sort();
                expect(foundJobs).to.deep.equal(["job1", "job2", "job3", "job4", "job5", "job6"]);
            });
        });

        it("returns the full tree, bottom-up", function() {
            return this.service.getJobTree(this.jobIDs[5] /* job6 */).then(jobs => {
                expect(jobs).to.have.lengthOf(5);
                const foundJobs = jobs.map(job => job.type).sort();
                expect(foundJobs).to.deep.equal(["job1", "job2", "job3", "job4", "job6"]);
            });
        });

        it("returns an empty array if no job found", function() {
            return this.service.getJobTree("abc").then(jobs => {
                expect(jobs).to.deep.equal([]);
            });
        });
    });
});
