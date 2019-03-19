# Vulpes Changelog

## v0.17.0
_2019-03-19_

 * *Redis* storage support via `RedisStorage` adapter
 * Streaming jobs processing for improved performance on large job collections
 * Scheduled tasks for repeating jobs using CRON timings
 * Support for overwriting job results when using `Service#updateJob`

## v0.16.3
_2019-03-11_

 * **Bugfix**:
   * Sticky properties in job results would not be merged when job has no parents

## v0.16.2
_2019-03-05_

 * **Bugfix**:
   * Jobs that hard-failed were not possible to restart

## v0.16.1
_2019-03-01_

 * **Bugfix**:
   * Downstream modules complain of an error while importing: `Error: only one instance of babel-polyfill is allowed` (conditionally include babel-polyfill)

## v0.16.0
_2019-02-28_

 * Permit jobs to be stopped when in pending state

## v0.15.1
_2019-02-20_

 * **Bugfix**:
   * Predicate check would pass by mistake when picking new job

## v0.15.0
_2019-02-20_

 * Sticky properties with `$` prefix

## v0.14.0
_2019-02-13_

 * Expose `Symbol` property in index

## v0.13.3
_2018-10-16_

 * **Bugfix**: Calls to Webpack'd module downstream threw on `pify` calls to stubbed (empty) `fs` module
   * `pify(fs.readFile)` style calls moved into `FileStorage` instance

## v0.13.2
_2018-10-13_

 * **Bugfix**: Querying jobs via deep properties returned only partial job objects (due to dependent library functionality)

## v0.13.1
_2018-10-12_

 * **Bugfix**: Sorting of queried jobs was broken - Job limit was applied before sorting

## v0.13.0
_2018-10-02_

 * Error codes for job batch processing
 * Error codes include "vulpes"

## v0.12.1
_2018-10-02_

 * **Bugfix**: Error thrown in `Service#addJobs` was outside of execution path and not catchable

## v0.12.0
_2018-10-02_

 * Remove `merge` option for `Service#stopJob`
   * Merge job data **and** job result upon completion

## v0.11.0
_2018-09-26_

 * Add `Service#updateJob` method for updating job properties

## v0.10.0
_2018-09-26_

 * Add new query parameters to `Service#queryJobs` to support limiting and sorting

## v0.9.0
_2018-09-26_

 * Add `alive` and `initialised` properties to the `Service` instance

## v0.8.0
_2018-09-21_

 * Make query parameter for `Service#queryJobs` optional

## v0.7.1
_2018-08-29_

 * **Bugfix**:
   * `Service#startJob` would not restart timed-out jobs after they've been reset with `resetJob`

## v0.7.0
_2018-08-28_

 * Add `jobReset` event to `Service`

## v0.6.2
_2018-08-28_

 * **Bugfix**:
   * `TimeoutHelper` does not fire immediately when attaching

## v0.6.1
_2018-08-28_

 * **Bugfix**:
   * `getNextJob` returns jobs that are blocked by parent statuses

## v0.6.0
_2018-08-22_

 * Jobs can be reset (after full-failure)
 * Improved predicate restrictions

## v0.5.2
_2018-08-21_

 * **Bugfix**:
   * Unexpected result when calling `Service#getJobTree` when job not found (now returns empty array)

## v0.5.1
_2018-08-21_

 * **Bugfix**:
   * Remove `restart` parameter from `Service#startJob` (broke dynamic job-starting functionaliy)

## v0.5.0
_2018-08-20_

 * Overwrite support for job result data

## v0.4.1
_2018-08-17_

 * **Bugfix**:
   * Fix `FileStorage` reference to `sleep-promise`

## v0.4.0
_2018-08-17_

 * Job tree methods: parents/children/full-tree

## v0.3.0
_2018-08-15_

 * `Service#getNextJob` for getting the next job that should be started
 * `Service#startJob` support for dynamically choosing a job to start (supports atomic opertion)
 * More strict checking of state before starting/stopping jobs

## v0.2.0
_2018-08-15_

 * Strict filtering of properties for `Service#addJob`

## v0.1.1
_2018-08-15_

 * **Bugfix**:
   * Fix Storage instance initialisation from Service

## v0.1.0
_2018-08-14_

 * Initial release
