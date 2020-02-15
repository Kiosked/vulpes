const { processMacros } = require("../../dist/template.js");

describe("template", function() {
    describe("processMacros", function() {
        it("replaces shallow macros", function() {
            const output = processMacros(
                {
                    key: "$value$"
                },
                {
                    value: "some value"
                }
            );
            expect(output).to.deep.equal({
                key: "some value"
            });
        });
    });
});
