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
 * @property {NewJob} jobs - An array of job templates
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
     * Add scheduled jobs task
     * @param {NewScheduledTask} options Task structure for the newly scheduled job
     * @returns {String} The ID of the scheduled task
     */
    async addScheduledJobs({ title, schedule, jobs, enabled = true } = {}) {
        const id = uuid();
        const task = {
            id,
            title,
            schedule,
            enabled,
            jobs
        };
        await this._writeTask(task);
        this._watchTask(task);
        this.emit("taskAdded", {
            id,
            title,
            schedule,
            enabled
        });
        return id;
    }

    /**
     * Get a scheduled task by its ID
     * @param {String} id The ID of the task
     * @returns {Promise.<ScheduledTask>} A promise that resolves with the scheduled task
     * @memberof Scheduler
     */
    async getScheduledTask(id) {
        return await this.service.storage.getItem(`scheduled/${id}`);
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
            await this.service.storage.removeItem(`scheduled/${id}`);
            const cronTask = this._cronTasks[id];
            delete this._cronTasks[id];
            cronTask.destroy();
        });
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
     */
    async toggleTask(taskID, enabled) {
        const task = await this.getScheduledTask(taskID);
        task.enabled = typeof enabled === "boolean" ? enabled : !task.enabled;
        await this._writeTask(task);
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
     * Watch a task (start timer for scheduling)
     * @param {ScheduledTask} task The task to watch
     * @protected
     * @memberof Scheduler
     */
    _watchTask(task) {
        const cronTask = this._cronSchedule(task.schedule, async () => {
            if (task.enabled !== true) {
                return;
            }
            const jobs = await this.service.addJobs(task.jobs);
            this.emit("createdJobsFromTask", {
                jobs,
                id: task.id,
                title: task.title,
                schedule: task.schedule
            });
        });
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
            await this.service.storage.setItem(`scheduled/${task.id}`, task);
        });
    }
}

module.exports = Scheduler;
