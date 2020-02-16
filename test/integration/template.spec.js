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

    describe("repeats", function() {
        beforeEach(function() {
            this.tempConfig = {
                template: [
                    {
                        type: "test/repeat",
                        data: {
                            value: "$count$",
                            deepValue: "$deep.count$",
                            deep: {
                                value: "$deep.count$"
                            }
                        },
                        repeat: "count"
                    }
                ],
                items: [
                    {},
                    {
                        count: [1, 2],
                        deep: {
                            count: [3, 4, 5]
                        }
                    }
                ]
            };
        });

        it("creates expected jobs for shallow repeat", function() {
            return this.service
                .addJobs(convertTemplateToJobArray(this.tempConfig))
                .then(() => this.service.queryJobs())
                .then(jobs => {
                    expect(jobs).to.have.a.lengthOf(3);
                    const jobPayloads = jobs.map(job => job.data);
                    expect(jobPayloads.find(payload => payload.value === "")).to.not.be.undefined;
                    expect(jobPayloads.find(payload => payload.value === "1")).to.not.be.undefined;
                    expect(jobPayloads.find(payload => payload.value === "2")).to.not.be.undefined;
                });
        });

        it("creates expected jobs for deep repeat", function() {
            this.tempConfig.template[0].repeat = "deep.count";
            return this.service
                .addJobs(convertTemplateToJobArray(this.tempConfig))
                .then(() => this.service.queryJobs())
                .then(jobs => {
                    expect(jobs).to.have.a.lengthOf(4);
                    const jobPayloads = jobs.map(job => job.data);
                    expect(jobPayloads.find(payload => payload.deepValue === "")).to.not.be
                        .undefined;
                    expect(
                        jobPayloads.find(payload => payload.deepValue === "3"),
                        "count 3"
                    ).to.not.be.undefined;
                    expect(
                        jobPayloads.find(payload => payload.deepValue === "4"),
                        "count 4"
                    ).to.not.be.undefined;
                    expect(
                        jobPayloads.find(payload => payload.deepValue === "5"),
                        "count 5"
                    ).to.not.be.undefined;
                });
        });
    });
});
