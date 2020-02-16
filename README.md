![Vulpes logo](https://github.com/Kiosked/vulpes/raw/master/vulpes_logo.jpg)

> Job management framework

[![Build Status](https://travis-ci.org/Kiosked/vulpes.svg?branch=master)](https://travis-ci.org/Kiosked/vulpes) [![npm version](https://badge.fury.io/js/vulpes.svg)](https://www.npmjs.com/package/vulpes)

## About

Vulpes (_/ˈwul.peːs/_) is a job management framework, designed at making job management and processing easy. Jobs are simply blobs of JSON data that are tracked by a globally unique ID (UUID), which retain status and result information. They can be linked to other jobs and processed in a tree-like manner.

Vulpes does not do any job processing itself - it is merely a _service_ designed to outsource the processing elsewhere. A Vulpes Service tracks jobs, their dependencies and their parents.

Check out the [API documentation](API.md).

Vulpes has helper libraries to assist you in building complete job management systems, such as:
 * [Vulpes-UI](https://github.com/Kiosked/vulpes-ui) - A user interface for job monitoring and management, built on Express.
 * [Vulpes-API](https://github.com/Kiosked/vulpes-api) - A drop-in API generator for Express.

## Installation

Install Vulpes as a dependency by running the following:

```shell
npm install vulpes --save
```

Vulpes is compatible with NodeJS version 6 and newer.

## Usage

The main concept behind Vulpes is the `Service` class, which controls a collection of jobs:

```javascript
const ms = require("ms");
const { Service } = require("vulpes");

// Create a new service
const service = new Service(); // Service takes an optional storage parameter
// Initialise the service
await service.initialise();

// Jobs can be added by passing in properties that are merged with the job
const jobID = await service.addJob({
    type: "my/custom/type",
    data: { value: 42 },
    timeLimit: ms("10m")
});

// Jobs can be started by passing in the ID
const jobData = await service.startJob(jobID);
// `jobData` is an object with information that should be provided to some worker
// or function that will complete the job..

// Jobs should be stopped when completed or failed
await service.stopJob(
    jobID,
    Service.JobResult.Success,
    { result: "some data...", value: 18 /* ... */ }
);
```

A job will not execute if its parents have not been completed. Providing the `parents` property when adding a job will tie a job to others in terms of processing and results - the property is an array of job IDs.

More information is found in the [API documentation](API.md).

### Job batches

You can add batches of jobs by using the `Service#addJobs` method, which takes an array of new jobs.

_You must specify an `id` property for each job used with this method - but it should be a number and not a UUID. Vulpes uses this number when calculating relationships in the added jobs._

```javascript
const jobs = await service.addJobs([
    { id: 1, type: "parent" },
    { id: 2, type: "child", parents: [1] }
]);
```

This allows you to insert full job trees using one method.

### Job trees

You can fetch jobs that are connected to a certain job using `getJobChildren`, `getJobParents` and `getJobTree`.

```javascript
// Get all children:
const allChildren = await service.getJobChildren(job.id, { fullProgeny: true });
// `allChildren` will be a flat array of jobs that are descendants of the
// provided job ID. It will not include the provided job.

// Default behaviour is to get only the immediate children, without full progeny:
const immediateChildren = await service.getJobChildren(job.id);

// Get all parents:
const allParents = await service.getJobParents(job.id, { fullAncestry: true });
// `allParents` will be a flat array of jobs that are ancestors of the
// provided job ID. It will not include the provided job.

// Default behaviour is to get only the immediate parents, without full ancestry:
const immediateParents = await service.getJobParents(job.id);

// Get a full tree:
const jobsTree = await service.getJobTree(job.id);
// `jobsTree` is an array of all jobs connected to the target job, including the
// target job itself.
```

A job tree contains all parents (under default configuration) and children of a job. It will not contain jobs that do not directly relate to it via a parent of a parent or a child of a child. A child's non-connecting parent is not included, for instance:

```
A    B
 \  /
  \/
   C
```

Taking the tree of B will result in [B, C] and will not include A. Taking the tree of C would result in [C, A, B].

### Job data

Job data is stored as a JSON object. Returning properties from job results is a great way to share information between jobs. Keys can be made up of any combination of characters and values should be of type `Number`/`String`/`Boolean`/`null` or basically anything serialisable.

When a job starts, it merges data payloads to form the provided data for the starting job. It merges data and results from parent jobs as well. It merges in the following precedence, from first to last (last overwriting first):

 1. Parent original data
 2. Parent result data
 3. (Every other parent, steps 1 & 2)
 4. Target job data
 5. Target job _previous result_ *

_* The previous result set can be merged in for the new job's payload if it contains sticky properties._

#### Special Properties

Special properties in job data can be used to change their behaviour. Special properties are denoted by a prefix:

| Prefix    | Description                           | Example       |
|-----------|---------------------------------------|---------------|
| `$`       | Sticky property - will be sent to jobs even if in failed result set. | `$lastValue` |
| `!`       | Reserved: For client implementation. This should not be sent to the server as future implementations may break. It is reserved for client-side implementation and should be stripped from results and data. | `!system_value` |
| `%`       | Hidden property - Properties prefixed by this symbol are hidden in the UI, but available everywhere else as a regular property. | `%imagedata` |
| `?`       | [Lazy property value](#lazy-property-values). Value of this property, with the `?` prefix removed, is resolved upon job execution. | `?my_lazy_value` |

#### Lazy property values

The values of certain properties can be lazy-loaded when the job is run. This means that they do not need to be known until a parent job successfully completes and the child begins to run. Take the following two jobs:

```
{
    "id": 1,
    "type": "job1",
    "data": {}
}

{
    "type": "job2",
    "data": {
        "value": 1,
        "?another": "parentResultProperty"
    },
    "parents": [1]
}
```

In this example, say `job1` finishes with a result set of `{ "parentResultProperty": 42 }`. Once `job2` starts, its initialisation data will look like the following:

```json
{
    "value": 1,
    "another": 42
}
```

The key `another`, prefixed with `?` to denote laziness, is set to the value of the property mentioned in its preliminary value upon job execution.

_This process supports deep properties: `a.b.c.finalValue`. If the chain fails to resolve, an empty string is set to the property and the job continues to execute **without failure**. The job may indeed fail after this, however, depdending upon implementation._

### Querying jobs

Use the `Service#queryJobs` method to query for jobs:

```javascript
const jobs = await service.queryJobs(
    { type: /^custom/ },
    { start: 0, limit: 25, sort: "type", order: "desc" }
);
```

The second options parameter is optional, and by default the function will sort by **created** and will limit results to `Infinity`.

`start` and `limit` can be used to configure pagination. The resulting `jobs` variable specified above will contain property called `total` which holds the total count of found jobs, after the query but before the slicing using `start` and `limit`.

### Scheduling jobs / Templates

A common need of any task management system is scheduled/repeating jobs. Vulpes provides support for this via a `scheduler` helper attached to each `Service` instance. Scheduled jobs are simply timed executions of the `Service#addJobs` batch command.

```javascript
const taskID = await service.scheduler.addScheduledTask({
    title: "My batch",
    schedule: "0 */2 * * *", // every 2 hours (CRON)
    jobs: [
        { id: 1, type: "parent" },
        { id: 2, type: "child", parents: [1] }
    ]
});
```

#### Disabling Scheduling

Scheduling can be completely disabled in the case where it would be undesirable to schedule any tasks. If, for some reason, 2 services were started and pointed to the same data source, scheduling should be turned off on one of them to ensure duplicate tasks are not created (though multiple services is not recommended nor supported). You can disable scheduling by either specifying an argument at creation time of the service (preferred):

```javascript
const service = new Service(storage, { enableScheduling: false });
```

Or by simply disabling it on the scheduler:

```javascript
service.scheduler.enabled = false;
```

The latter option is not recommended as the scheduler would still have a minutue amount of time, if the service is initialised, to create tasks.

### Archiving jobs

After a while jobs should be archived so that they don't clog the system. You can archive individual jobs by running the `Service#archiveJob()` method:

```javascript
await service.archiveJob(jobID);
```

You should of course archive the entire job tree when doing this. Archiving a job prevents the job from showing in `Service#queryJobs()` results. Archived jobs will not be started by a worker nor will appear in the UI.

A helper named `AutoArchiveHelper` is also available for use in automatically archiving old jobs that have stopped and have either succeeded or failed (failure, timeout or success). Usage is very simple:

```javascript
const ms = require("ms");
const { AutoArchiveHelper, Service } = require("vulpes");

const service = new Service();
const autoArchiveHelper = new AutoArchiveHelper({
    checkInterval: ms("15m"), // default: 10 minutes
    archivePeriod: ms("1m"), // default: 2 weeks
    deletePeriod: ms("2w"), // default: 1 week
    queryLimit: 100 // default: 50 (max jobs per query to check for archiving)
});
service.use(autoArchiveHelper);
```

The archive helper supports deleting jobs after a period. The `deletePeriod` option is the time _after archiving_ where jobs can then be deleted. When a job has stopped, the duration of `archivePeriod` _and_ `deletePeriod` is the time before the job is completely removed from the service.

### Storage Migration

It's possible to migrate from one storage to another if you're wishing to change storage mediums. This is especially useful when migrating from a development stage to a production one, where you may have used `FileStorage` and wish to migrate all the contents to `RedisStorage`.

Storage migration is performed by using the `StorageMigrationHelper`, but note that this one should be attached **before** initialising the `Service` instance:

```javascript
const { FileStorage, RedisStorage, Service, StorageMigrationHelper } = require("vulpes");

const oldStorage = new FileStorage("/tmp/somefile.json");
const service = new Service(new RedisStorage());
const migrateHelper = new StorageMigrationHelper(oldStorage);
service.use(migrateHelper);

service.initialise();
```

_Note that migrations also remove items from the origin storage._

### Shutdown

Shutting down a Vulpes service is accomplished by running `service.shutdown()`, which returns a `Promise`:

```javascript
async () => {
    await service.shutdown();
};
```

It is important to wait for the Promise to resolve, as some items need time to close connections. Redis storages need time to close their connections before a shutdown can be completed.

### Stats

Stats are recorded using the built-in `Tracker` instance, attached to each `Service` upon instantiation. It records things like current live workers and job stats.

To get job stats from the tracker:

```javascript
const stats = await service.tracker.fetchStats();
```

`stats` will resemble the [`TrackerJobStats`](API.md#TrackerJobStats) object. You can also get the current live worker count by getting the property `service.tracker.liveWorkers`, which resembles [`RegisteredWorker`](API.md#registeredworker--object).

### Service events

The `Service` instance fires events for different processes having taken place:

| Event             | Payload                       | Description                                               |
|-------------------|-------------------------------|-----------------------------------------------------------|
| `initialised`     | _None_                        | Emitted when the service has finished initialising.       |
| `jobAdded`        | `{ id }`                      | Emitted when a job is added to the service.               |
| `jobArchived`     | `{ id }`                      | Emitted when a job is archived.                           |
| `jobDeleted`      | `{ id }`                      | Emitted when a job is deleted. Only the ID is available at this point and attempts to fetch the job will fail. |
| `jobReset`        | `{ id }`                      | Emitted when a job is reset, made ready for another attempt. |
| `jobStarted`      | `{ id }`                      | Emitted when a job is started.                            |
| `jobStopped`      | `{ id }`                      | Emitted when a job is stopped (completed / failed etc.)   |
| `jobTimeout`      | `{ id }`                      | Emitted when a job times out. Will be emitted along with `jobStopped`. |
| `jobCompleted`    | `{ id }`                      | Emitted when a job completes successfully. Will be emitted along with `jobStopped`. |
| `jobFailed`       | `{ id }`                      | Emitted when a job fails to complete successfully. Will be emitted along with `jobStopped`. May be emitted along with `jobTimeout` if the job timed-out. |
| `jobUpdated`      | `{ id, original, updated }`   | Emitted when a job's payload is updated. The payload of the event, along with the job's `id`, will contain the `original` job along with the `updated` job. |

## Developing

To begin development on Vuples, clone this repository (or your fork) and run `npm install` in the project directory. Vulpes uses **Babel** to compile its source files into the `dist/` directory. Building occurs automatically upon `npm install` or `npm publish`, but you can also run the process manually by executing `npm run build`. To watch for changes while developing simply run `npm run dev`.

To run the tests, execute `npm t` - this executes all tests and coverage checks. To run just unit tests or just integration tests, run `npm run test:unit` or `npm run test:integration` respectively.

### Contributing

We welcome contributions! Please make sure you've run `npm install` so the `precommit` hook(s) can run - we perform code formatting before commits are finalised. Keep with the code style and make sure to submit with Linux-style line endings (weird formatting changes etc. will not be accepted).

Be friendly and unassuming - the feature you want _may_ not necessarily align with our goals for the project. Always open an issue first so we can discuss your proposal. We're more than happy to receive feedback and constructive criticism.
