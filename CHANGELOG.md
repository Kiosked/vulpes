# Vulpes Changelog

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
