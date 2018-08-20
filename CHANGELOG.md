# Vulpes Changelog

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
