const Service = require("../../dist/Service.js");
const { convertTemplateToJobArray } = require("../../dist/template.js");

describe("convertTemplateToJobArray", function() {
    beforeEach(function() {
        this.service = new Service();
        return this.service.initialise();
    });

    afterEach(function() {
        return this.service.shutdown();
    });

    describe("simple setup", function() {
        const tempConfig = {
            template: [
                {
                    type: "test/parent",
                    data: {
                        something: "$a$"
                    },
                    children: [
                        {
                            type: "test/child",
                            data: {
                                another: "$c$$b$"
                            }
                        }
                    ]
                }
            ],
            items: [
                { a: "1", b: "2", c: "3" },
                { a: "4", b: "5", c: "6" },
                { a: "7", b: "8", c: "9" }
            ]
        };

        it("creates jobs on service", function() {
            return this.service
                .addJobs(convertTemplateToJobArray(tempConfig))
                .then(() => this.service.queryJobs())
                .then(jobs => {
                    expect(jobs).to.have.a.lengthOf(6);
                    return Promise.all([
                        this.service.queryJobs({ "data.something": "4" }),
                        this.service.queryJobs({ "data.another": "65" })
                    ]);
                })
                .then(([res1, res2]) => {
                    expect(res1).to.have.lengthOf(1);
                    expect(res2).to.have.lengthOf(1);
                });
        });
    });

    describe("conditionals", function() {
        const tempConfig = {
            template: [
                {
                    type: "test/1",
                    data: {
                        value: "$value$"
                    },
                    condition: {
                        ifset: "value",
                        ifnotset: "somethingElse"
                    }
                },
                {
                    type: "test/2",
                    data: {
                        value: "$somethingElse$"
                    },
                    condition: {
                        ifeq: { somethingElse: "red" }
                    }
                }
            ],
            items: [
                { ind: "1", value: "blue" },
                { ind: "2", value: "green" },
                { ind: "3", somethingElse: "red" }
            ]
        };

        it("creates expected jobs", function() {
            return this.service
                .addJobs(convertTemplateToJobArray(tempConfig))
                .then(() => this.service.queryJobs())
                .then(jobs => {
                    expect(jobs).to.have.a.lengthOf(3);
                    const jobTypes = jobs.map(job => job.type);
                    expect(jobTypes.sort()).to.deep.equal(["test/1", "test/1", "test/2"]);
                });
        });
    });
});
