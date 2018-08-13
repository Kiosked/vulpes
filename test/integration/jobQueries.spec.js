const Service = require("../../source/Service.js");

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

    it("can be queried for jobs with data values", function() {
        return this.service.queryJobs({ "data.name": /^test\d+$/ }).then(jobs => {
            expect(jobs).to.have.lengthOf(2);
        });
    });

    it("can be queried for jobs with exact data values", function() {
        return this.service.queryJobs({ "data.name": "test2" }).then(jobs => {
            expect(jobs).to.have.lengthOf(1);
            expect(jobs[0]).to.have.property("id", this.jobID2);
        });
    });
});
