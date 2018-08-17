const Service = require("../../dist/Service.js");

describe("Service", function() {
    beforeEach(function() {
        this.service = new Service();
        return this.service
            .initialise()
            .then(() =>
                Promise.all([
                    this.service.addJob({ data: { name: "test1" } }),
                    this.service.addJob({ data: { name: "test2" } })
                ])
            )
            .then(([jobID1, jobID2]) => {
                Object.assign(this, {
                    jobID1,
                    jobID2
                });
            });
    });

    describe("getJobChildren", function() {});
});
