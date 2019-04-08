const uuid = require("uuid/v4");
const Tracker = require("../../dist/Tracker.js");

describe("Tracker", function() {
    beforeEach(function() {
        this.tracker = new Tracker();
    });

    describe("registerWorker", function() {
        it("registers new workers", function() {
            expect(this.tracker.liveWorkers).to.have.a.lengthOf(0);
            const id = uuid();
            this.tracker.registerWorker(id);
            expect(this.tracker.liveWorkers).to.have.a.lengthOf(1);
            expect(this.tracker.liveWorkers[0]).to.have.property("id", id);
            expect(this.tracker.liveWorkers[0])
                .to.have.property("updated")
                .that.is.a("number");
            expect(this.tracker.liveWorkers[0]).to.have.property("count", 1);
        });

        it("increments existing workers", function() {
            expect(this.tracker.liveWorkers).to.have.a.lengthOf(0);
            const id = uuid();
            this.tracker.registerWorker(id);
            this.tracker.registerWorker(id);
            expect(this.tracker.liveWorkers).to.have.a.lengthOf(1);
            expect(this.tracker.liveWorkers[0]).to.have.property("id", id);
            expect(this.tracker.liveWorkers[0])
                .to.have.property("updated")
                .that.is.a("number");
            expect(this.tracker.liveWorkers[0]).to.have.property("count", 2);
        });
    });
});
