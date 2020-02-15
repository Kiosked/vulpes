const Service = require("../../dist/Service.js");
const { convertTemplateToJobArray } = require("../../dist/template.js");

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
    items: [{ a: "1", b: "2", c: "3" }, { a: "4", b: "5", c: "6" }, { a: "7", b: "8", c: "9" }]
};

describe("convertTemplateToJobArray", function() {
    beforeEach(function() {
        this.service = new Service();
        return this.service.initialise();
    });

    afterEach(function() {
        return this.service.shutdown();
    });

    it("creates jobs on service", function() {
        return this.service
            .addJobs(convertTemplateToJobArray(tempConfig))
            .then(() => this.service.queryJobs())
            .then(jobs => {
                expect(jobs).to.have.a.lengthOf(6);
                return Promise.all([
                    this.service.queryJobs({ something: "4" }),
                    this.service.queryJobs({ another: "5" })
                ]);
            })
            .then(([res1, res2]) => {
                console.log(JSON.stringify(res1, undefined, 2));
                expect(res1).to.have.lengthOf(1);
                expect(res2).to.have.lengthOf(1);
            });
    });
});
