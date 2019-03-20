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

## Developing
To begin development on Vuples, clone this repository (or your fork) and run `npm install` in the project directory. Vulpes uses **Babel** to compile its source files into the `dist/` directory. Building occurs automatically upon `npm install` or `npm publish`, but you can also run the process manually by executing `npm run build`. To watch for changes while developing simply run `npm run dev`.

To run the tests, execute `npm t` - this executes all tests and coverage checks. To run just unit tests or just integration tests, run `npm run test:unit` or `npm run test:integration` respectively.

### Contributing
We welcome contributions! Please make sure you've run `npm install` so the `precommit` hook(s) can run - we perform code formatting before commits are finalised. Keep with the code style and make sure to submit with Linux-style line endings (weird formatting changes etc. will not be accepted).

Be friendly and unassuming - the feature you want _may_ not necessarily align with our goals for the project. Always open an issue first so we can discuss your proposal. We're more than happy to receive feedback and constructive criticism.
