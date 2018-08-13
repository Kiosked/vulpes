const Service = require("../../source/Service.js");

describe("Service", function() {
    beforeEach(function() {
        this.service = new Service();
    });

    it("can add jobs", function() {
        return Promise
            .all([
                this.service.addJob(),
                this.service.addJob()
            ])
            .then(() => this.service.storage.getAllKeys())
            .then(keys => {
                expect(keys).to.have.lengthOf(2);
            });
    });
});
