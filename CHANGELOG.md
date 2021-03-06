# Vulpes Changelog

## v1.4.2
_2020-03-02_

 * **Bugfix**:
   * `MemoryStorage` streamed items were not cloned

## v1.4.1
_2020-03-01_

 * **Bugfix**:
   * `ArtifactManager` throws fatal errors when attachments are missing

## v1.4.0
_2020-03-01_

 * `waitForStream` helper

## v1.3.0
_2020-02-29_

 * `MemoryStorage` can be combined with `FileStorage` for persistence
 * Improved query performance with `Service#queryJobs`

## v1.2.1
_2020-02-23_

 * **Bugfix**:
   * Child jobs would inherit lazy properties

## v1.2.0
_2020-02-23_

 * Allow jobs to start immediately if reset (skip time-between-retries)
 * Set time-between-retries to 30 seconds by default

## v1.1.1
_2020-02-23_

 * **Bugfix**:
   * Underscores and dashes not parsed in template macros

## v1.1.0
_2020-02-22_

 * Lazy properties

## v1.0.0
_2020-02-16_

 * Template importing via `convertTemplateToJobArray`
 * **Breaking changes**:
   * Minimum supported Node is now 10

## v0.33.0
_2019-06-11_

 * Auto-extraction of job artifacts

## v0.32.1
_2019-06-11_

 * **Bugfix**
   * Expose `ArtifactManager` in index

## v0.32.0
_2019-06-10_

 * Remove logging (breaking)
 * `ArtifactManager`

## v0.31.0
_2019-06-04_

 * `StorageMigrationHelper` for migrating storage mediums
 * `Helper` instances gain `initialise` method

## v0.30.0
_2019-05-28_

 * Delete support for `AutoArchiveHelper`
 * New `jobDeleted` event for `Service`

## v0.29.0
_2019-05-23_

 * `Tracker` job stats

## v0.28.1
_2019-05-16_

 * `total` property on query results for total jobs found

## v0.28.0
_2019-05-16_

 * Update `Service#queryJobs` to support correct sorting and limiting

## v0.27.0
_2019-05-15_

 * `start` index for `Service#queryJobs` to support pagination

## v0.26.0
_2019-05-15_

 * Job archiving
 * `AutoArchiveHelper` for archving jobs automatically
 * Redis storage shutdown grace period
 * `Service#shutdown` is now async

## v0.25.1
_2019-04-29_

 * Add job/task id to logging data

## v0.25.0
_2019-04-23_

 * Logging

## v0.24.1
_2019-04-09_

 * **Bugfix**:
   * `Scheduler#triggerTask` would not trigger disabled tasks

## v0.24.0
_2019-04-08_

 * Analytics `Tracker` (@ `Service.tracker`) for tracking workers
 * `Scheduler#triggerTask` for triggering scheduled tasks (skip schedule)
 * `Service#removeJob`

## v0.23.0
_2019-04-03_

 * Possibility to disable scheduler

## v0.22.1
_2019-04-03_

 * Resetting of CRON schedules when calling `Scheduler#updateTaskProperties`

## v0.22.0
_2019-04-03_

 * Property validation and resetting for new jobs

## v0.21.1
_2019-04-02_

 * **Bugfix**:
   * Schedule tasks would not read their `enabled` status if changed while `Service` and `Scheduler` are still running

## v0.21.0
_2019-04-02_

 * Scheduling support for updating task details
 * Scheduled task returned from methods where it wasn't earlier

## v0.20.2
_2019-03-29_

 * **Bugfix**:
   * ([#28](https://github.com/Kiosked/vulpes/issues/28)) `Service#resetJob` doesn't place job in state that can be retried (failed to adjust `attemptsMax` predicate)

## v0.20.1
_2019-03-28_

 * Remove scheduled task ID prefixes

## v0.20.0
_2019-03-28_

 * **Breaking change**: Removed storage key prefixes

## v0.19.2
_2019-03-28_

 * **Bugfix**:
   * Empty object array streams would throw an exception

## v0.19.1
_2019-03-22_

 * **Bugfix**:
   * `Scheduler#getScheduledTasks` method wouldn't return anything

## v0.19.0
_2019-03-21_

 * Support for updating scheduled tasks and their jobs

## v0.18.0
_2019-03-20_

 * **Bugfix**:
   * `FileStorage#streamItems` would throw if no file exists
 * Add root `symbols.js` link for including only symbols

## v0.17.1
_2019-03-20_

 * **Bugfix**:
   * `FileStorage` would throw if no file exists when writing from `setItem`

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
