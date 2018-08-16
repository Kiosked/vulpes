const { generateEmptyJob } = require("../../dist/jobGeneration.js");

const UUID_REXP = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/;

describe("jobGeneration", function() {
    describe("generateEmptyJob", function() {
        it("returns an object", function() {
            expect(generateEmptyJob()).to.be.an("object");
        });

        it("has a UUID id property", function() {
            expect(generateEmptyJob())
                .to.have.property("id")
                .that.matches(UUID_REXP);
        });
    });
});
