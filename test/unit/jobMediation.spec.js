const { resolveLazyProperties } = require("../../dist/jobMediation.js");

describe("jobMediation", function() {
    describe("resolveLazyProperties", function() {
        it("resolves basic properties", function() {
            const resolved = resolveLazyProperties({
                value: 2000,
                "?dynamic": "value"
            });
            expect(resolved).to.deep.equal({
                value: 2000,
                dynamic: 2000
            });
        });

        it("resolves deep property chains (getting)", function() {
            const resolved = resolveLazyProperties({
                nested: {
                    sub: {
                        value: "test"
                    }
                },
                "?dynamic": "nested.sub.value"
            });
            expect(resolved).to.deep.equal({
                nested: {
                    sub: {
                        value: "test"
                    }
                },
                dynamic: "test"
            });
        });

        it("resolves deep property chains (setting)", function() {
            const resolved = resolveLazyProperties({
                nested: {
                    sub: {
                        value: "test"
                    }
                },
                "?another.nested.value": "nested.sub.value"
            });
            expect(resolved).to.deep.equal({
                nested: {
                    sub: {
                        value: "test"
                    }
                },
                another: {
                    nested: {
                        value: "test"
                    }
                }
            });
        });

        it("resolves to undefined if chain not valid", function() {
            const resolved = resolveLazyProperties({
                value: 2000,
                "?dynamic": "sub.value"
            });
            expect(resolved).to.deep.equal({
                value: 2000,
                dynamic: undefined
            });
        });
    });
});
