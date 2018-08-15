![Vulpes logo](https://github.com/Kiosked/vulpes/raw/master/vulpes_logo.jpg)

> Job management framework

[![Build Status](https://travis-ci.org/Kiosked/vulpes.svg?branch=master)](https://travis-ci.org/Kiosked/vulpes) [![npm version](https://badge.fury.io/js/vulpes.svg)](https://www.npmjs.com/package/vulpes)

## About
Vulpes (_/ˈwul.peːs/_) is a job management framework, designed at making job management and processing easy. Jobs are simply blobs of JSON data that are tracked by a globally unique ID (UUID), which retain status and result information. They can be linked to other jobs and processed in a tree-like manner.

Vulpes does not do any job processing itself - it is merely a _service_ designed to outsource the processing elsewhere. A Vulpes Service tracks jobs, their dependencies and their parents.

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

## Developing
To begin development on Vuples, clone this repository (or your fork) and run `npm install` in the project directory.

To run the tests, execute `npm t` - this executes all tests and coverage checks. To run just unit tests or just integration tests, run `npm run test:unit` or `npm run test:integration` respectively.

### Contributing
We welcome contributions! Please make sure you've run `npm install` so the `precommit` hook(s) can run - we perform code formatting before commits are finalised. Keep with the code style and make sure to submit with Linux-style line endings (weird formatting changes etc. will not be accepted).

Be friendly and unassuming - the feature you want _may_ not necessarily align with our goals for the project. Always open an issue first so we can discuss your proposal. We're more than happy to receive feedback and constructive criticism.
