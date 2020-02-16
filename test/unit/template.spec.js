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

        it("replaces deep macros", function() {
            const output = processMacros(
                {
                    someObject: {
                        child: "$value$"
                    }
                },
                {
                    value: "some value"
                }
            );
            expect(output).to.deep.equal({
                someObject: {
                    child: "some value"
                }
            });
        });

        it("replaces macros in arrays", function() {
            const output = processMacros(
                {
                    key: ["one", "$value$", "three"]
                },
                {
                    value: "some value"
                }
            );
            expect(output).to.deep.equal({
                key: ["one", "some value", "three"]
            });
        });

        it("replaces macros in complex structures", function() {
            const output = processMacros(
                {
                    key: [
                        "one",
                        {
                            sub: { item: "$value$" }
                        },
                        "three"
                    ]
                },
                {
                    value: "some value"
                }
            );
            expect(output).to.deep.equal({
                key: [
                    "one",
                    {
                        sub: {
                            item: "some value"
                        }
                    },
                    "three"
                ]
            });
        });

        it("replaces several macros in a string", function() {
            const output = processMacros(
                {
                    key: "$a$$b$ - $c$"
                },
                {
                    a: "th",
                    b: "is",
                    c: "works"
                }
            );
            expect(output).to.deep.equal({
                key: "this - works"
            });
        });
    });
});
