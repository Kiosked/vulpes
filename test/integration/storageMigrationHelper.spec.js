const sleep = require("sleep-promise");
const tmp = require("tmp");
const StorageMigrationHelper = require("../../dist/helper/StorageMigrationHelper.js");
const FileStorage = require("../../dist/storage/FileStorage.js");
const MemoryStorage = require("../../dist/storage/MemoryStorage.js");
const Service = require("../../dist/Service.js");

describe("StorageMigrationHelper", function() {
    describe("when migrating jobs", function() {
        beforeEach(function() {
            this.originalStorage = new FileStorage(tmp.tmpNameSync());
            this.oldService = new Service(this.originalStorage);
            return this.oldService
                .initialise()
                .then(() =>
                    Promise.all([
                        this.oldService.addJob({ type: "test1" }),
                        this.oldService.addJob({ type: "test2" }),
                        this.oldService.addJob({ type: "test3" })
                    ])
                )
                .then(() => sleep(250))
                .then(() => {
                    this.storage = new MemoryStorage();
                    this.storageMigrationHelper = new StorageMigrationHelper(this.originalStorage);
                    this.service = new Service(this.storage);
                    this.service.use(this.storageMigrationHelper);
                });
        });

        afterEach(function() {
            return Promise.all([this.service.shutdown(), this.oldService.shutdown()]);
        });

        it("migrates jobs", function() {
            return this.service
                .initialise()
                .then(() => this.service.queryJobs({ type: "test1" }))
                .then(jobs => {
                    expect(jobs).to.have.lengthOf(1);
                });
        });

        it("removes jobs from old storage", function() {
            return this.service
                .initialise()
                .then(() => this.oldService.queryJobs({}))
                .then(jobs => {
                    expect(jobs).to.have.lengthOf(0);
                    return this.service.queryJobs({});
                })
                .then(jobs => {
                    expect(jobs).to.have.lengthOf(3);
                });
        });
    });
});
