const EventEmitter = require("eventemitter3");
const merge = require("merge");
const ChannelQueue = require("@buttercup/channel-queue");
const endOfStream = require("end-of-stream");
const cron = require("node-cron");
const uuid = require("uuid/v4");
const { ITEM_TYPE, ITEM_TYPE_SCHEDULED_TASK } = require("./symbols.js");

const ITEM_SCHEDULE_PREFIX = /^scheduled\//;

/**
 * @typedef {Object} NewScheduledTask
 * @property {String} title - The scheduled job title
 * @property {String} schedule - The CRON formatted schedule for the job creation
 * @property {NewJob[]} jobs - An array of job templates
 * @property {Boolean} enabled - Whether the task is enabled or not
 */

/**
 * @typedef {NewScheduledTask} ScheduledTask
 * @property {String} id - The ID of the scheduled job
 */

/**
 * Scheduler for scheduled tasks
 * @augments EventEmitter
 */
class Scheduler extends EventEmitter {
    constructor(service) {
        super();
        this._service = service;
        this._channelQueue = new ChannelQueue();
        this._cronTasks = {};
        this.enabled = true;
    }

    /**
     * Service reference
     * @type {Service}
     * @memberof Scheduler
     */
    get service() {
        return this._service;
    }

    /**
     * Task queue for job schedule checks
     * @type {Channel}
     * @readonly
     * @memberof Scheduler
     */
    get taskQueue() {
        return this._channelQueue.channel("scheduler");
    }

    /**
     * Add scheduled jobs
     * @deprecated Use `addScheduledTask` instead
     * @see Scheduler#addScheduledTask
     * @memberof Scheduler
     */
    addScheduledJobs(...args) {
        return this.addScheduledTask(...args);
    }

    /**
     * Add scheduled jobs task
     * @param {NewScheduledTask} options Task structure for the newly scheduled job
     * @returns {String} The ID of the scheduled task
     * @memberof Scheduler
     * @throws {Error} Throws if the schedule is not a valid CRON format
     * @fires Scheduler#taskAdded
     */
    async addScheduledTask({ title, schedule, jobs, enabled = true } = {}) {
        if (!cron.validate(schedule)) {
            throw new Error(`Invalid CRON schedule: ${schedule}`);
        }
        const id = uuid();
        const task = {
            [ITEM_TYPE]: ITEM_TYPE_SCHEDULED_TASK,
            id,
            title,
            schedule,
            enabled,
            jobs
        };
        await this._writeTask(task);
        this._watchTask(task);
        /**
         * Event for when a new task is added
         * @event Scheduler#taskAdded
         * @type {Object}
         * @property {String} id - The ID of the task
         * @property {String} title - The title of the task
         * @property {String} schedule - The CRON schedule for the task
         * @property {Boolean} enabled - Whether the task is enabled or not
         * @property {NewJob[]} jobs - Array of job templates for scheduled creation
         */
        this.emit("taskAdded", task);
        return id;
    }

    /**
     * Get a scheduled task by its ID
     * @param {String} id The ID of the task
     * @returns {Promise.<ScheduledTask>} A promise that resolves with the scheduled task
     * @memberof Scheduler
     */
    async getScheduledTask(id) {
        return await this.service.storage.getItem(id);
    }

    /**
     * Get all scheduled tasks
     * @returns {Promise.<ScheduledTask[]>} A promise that resolves with an array of all
     *  scheduled tasks
     * @memberof Scheduler
     */
    async getScheduledTasks() {
        const itemStream = await this.service.storage.streamItems();
        const results = [];
        itemStream.on("data", item => {
            if (item[ITEM_TYPE] === ITEM_TYPE_SCHEDULED_TASK) {
                results.push(item);
            }
        });
        await new Promise((resolve, reject) =>
            endOfStream(itemStream, err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            })
        );
        return results;
    }

    /**
     * Initialise the scheduler
     * @returns {Promise}
     * @memberof Scheduler
     */
    async initialise() {
        if (this.service.initialised) {
            throw new Error("Failed initialising Scheduler: Parent service already initialised");
        }
        await this.taskQueue.enqueue(async () => {
            const tasks = await this.getScheduledTasks();
            tasks.forEach(task => this._watchTask(task));
        });
    }

    /**
     * Remove a scheduled task
     * @returns {Promise}
     * @memberof Scheduler
     */
    async removeScheduledTask(id) {
        await this.taskQueue.enqueue(async () => {
            await this.service.storage.removeItem(id);
            const cronTask = this._cronTasks[id];
            delete this._cronTasks[id];
            cronTask.destroy();
        });
    }

    /**
     * Set the jobs array for a task
     * @param {String} taskID The ID of the task
     * @param {NewJob[]} jobs An array of job templates
     * @memberof Scheduler
     * @returns {Promise}
     * @fires Scheduler#taskJobsUpdated
     */
    async setJobsForScheduledTask(taskID, jobs) {
        const task = await this.getScheduledTask(taskID);
        task.jobs = jobs;
        await this._writeTask(task);
        /**
         * Event for when a task's jobs are updated
         * @event Scheduler#taskJobsUpdated
         * @type {Object}
         * @property {String} id - The ID of the task
         * @property {NewJob[]} jobs - Array of job templates for scheduled creation
         */
        this.emit("taskJobsUpdated", {
            id: taskID,
            jobs
        });
        return task;
    }

    /**
     * Shutdown the scheduler
     * @memberof Scheduler
     */
    shutdown() {
        Object.keys(this._cronTasks).forEach(key => {
            const cronTask = this._cronTasks[key];
            cronTask.destroy();
        });
        this._cronTasks = {};
    }

    /**
     * Enable/disable a task
     * @param {String} taskID The ID of the task
     * @param {Boolean=} enabled Set the enabled status of the task to
     *  true or false. If not specified, the status of the task will
     *  be toggled.
     * @memberof Scheduler
     * @returns {ScheduledTask} Returns the toggled task
     * @fires Scheduler#taskStatusToggled
     */
    async toggleTask(taskID, enabled) {
        const task = await this.getScheduledTask(taskID);
        task.enabled = typeof enabled === "boolean" ? enabled : !task.enabled;
        await this._writeTask(task);
        /**
         * Event for when a task has its status toggled (enabled/disabled)
         * @event Scheduler#taskStatusToggled
         * @type {Object}
         * @property {String} id - The ID of the task
         * @property {Boolean} enabled - Whether the task is enabled or disabled
         */
        this.emit("taskStatusToggled", {
            id: taskID,
            enabled: task.enabled
        });
        return task;
    }

    /**
     * @typedef {Object} UpdateTaskPropertiesOptions
     * @property {String=} title - The title of the task
     * @property {String=} schedule - The schedule of the task (CRON)
     */

    /**
     * Update properties of a task
     * @param {String} taskID The ID of the task to update
     * @param {UpdateTaskPropertiesOptions} ops Properties to update on the task
     * @returns {ScheduledTask} Returns the toggled task
     * @memberof Scheduler
     * @fires Scheduler#taskPropertiesUpdated
     */
    async updateTaskProperties(taskID, { title, schedule } = {}) {
        const task = await this.getScheduledTask(taskID);
        if (title) {
            task.title = title;
        }
        if (schedule) {
            if (!cron.validate(schedule)) {
                throw new Error(`Invalid CRON schedule: ${schedule}`);
            }
            task.schedule = schedule;
        }
        await this._writeTask(task);
        // Remove CRON watcher
        this._unwatchTask(task);
        // Set new CRON watcher (schedule changed)
        this._watchTask(task);
        /**
         * Event for when a task's properties (title/schedule) are updated
         * @event Scheduler#taskPropertiesUpdated
         * @type {Object}
         * @property {String} id - The ID of the task
         * @property {String} title - The title of the task
         * @property {String} schedule - The CRON schedule for the task
         */
        this.emit("taskPropertiesUpdated", {
            id: taskID,
            title: task.title,
            schedule: task.schedule
        });
        return task;
    }

    /**
     * Schedule a CRON execution
     * @property {String} schedule - The minute-accurate CRON string
     * @property {Function} cb - The callback to fire when the CRON timer matches current time
     * @protected
     * @returns {Object} The CRON task
     * @memberof Scheduler
     */
    _cronSchedule(schedule, cb) {
        return cron.schedule(schedule, cb);
    }

    /**
     * Unwatch a CRON task (deschedule it)
     * @param {ScheduledTask} task The task to deschedule
     * @returns {Boolean} True if a task was found, false otherwise
     * @protected
     * @memberof Scheduler
     */
    _unwatchTask(task) {
        const cronTask = this._cronTasks[task.id];
        if (!cronTask) {
            return false;
        }
        cronTask.destroy();
        delete this._cronTasks[task.id];
        return true;
    }

    /**
     * Watch a task (start timer for scheduling)
     * @param {ScheduledTask} task The task to watch
     * @protected
     * @memberof Scheduler
     * @fires Scheduler#createdJobsFromTask
     * @fires Scheduler#taskScheduled
     */
    _watchTask(task) {
        const cronTask = this._cronSchedule(task.schedule, async () => {
            const activatedTask = await this.getScheduledTask(task.id);
            if (!activatedTask || activatedTask.enabled !== true || !this.enabled) {
                return;
            }
            const jobs = await this.service.addJobs(activatedTask.jobs);
            /**
             * Event for when jobs are created as a result of a scheduled task
             * having been fired using its CRON schedule
             * @event Scheduler#createdJobsFromTask
             * @type {Object}
             * @property {String} id - The ID of the task
             * @property {String} title - The title of the task
             * @property {String} schedule - The CRON schedule for the task
             * @property {NewJob[]} jobs - Array of job templates for scheduled creation
             */
            this.emit("createdJobsFromTask", {
                jobs,
                id: activatedTask.id,
                title: activatedTask.title,
                schedule: activatedTask.schedule
            });
        });
        /**
         * Event for when a task has been scheduled (fired both when created and
         *  when being read from storage upon a fresh start-up)
         * @event Scheduler#taskScheduled
         * @type {Object}
         * @property {String} id - The ID of the task
         * @property {String} title - The title of the task
         * @property {String} schedule - The CRON schedule for the task
         * @property {Boolean} enabled - Whether the task is enabled or not
         */
        this.emit("taskScheduled", {
            id: task.id,
            title: task.title,
            schedule: task.schedule,
            enabled: task.enabled
        });
        this._cronTasks[task.id] = cronTask;
    }

    /**
     * Write a task to storage
     * @param {ScheduledTask} task The task to write (will overwrite)
     * @returns {Promise}
     * @memberof Scheduler
     * @protected
     */
    async _writeTask(task) {
        await this.taskQueue.enqueue(async () => {
            await this.service.storage.setItem(task.id, task);
        });
    }
}

module.exports = Scheduler;
