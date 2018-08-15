const Service = require("../../source/Service.js");

describe("Service", function() {
    beforeEach(function() {
        this.service = new Service();
        return this.service.initialise();
    });

    describe("when adding jobs", function() {
        it("can add jobs", function() {
            return Promise.all([this.service.addJob(), this.service.addJob()])
                .then(() => this.service.storage.getAllKeys())
                .then(keys => {
                    expect(keys).to.have.lengthOf(2);
                });
        });

        it("sets chain IDs correctly", function() {
            let parentIDs;
            return Promise.all([this.service.addJob(), this.service.addJob()])
                .then(ids => {
                    parentIDs = ids;
                    return this.service.addJob({
                        parents: parentIDs
                    });
                })
                .then(jobID => this.service.getJob(jobID))
                .then(job => {
                    expect(job.chain).to.deep.equal(parentIDs);
                });
        });
    });
});
