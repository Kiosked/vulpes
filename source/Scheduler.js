const EventEmitter = require("eventemitter3");
const merge = require("merge");
const ChannelQueue = require("@buttercup/channel-queue");
const endOfStream = require("end-of-stream");
const cron = require("node-cron");
const uuid = require("uuid/v4");
const { ITEM_TYPE, ITEM_TYPE_SCHEDULED_TASK } = require("./symbols.js");

const ITEM_SCHEDULE_PREFIX = /^scheduled\//;

/**
 * @typedef {Object} NewScheduledJob
 * @property {String} title - The scheduled job title
 * @property {String} schedule - The CRON formatted schedule for the job creation
 * @property {NewJob} job - The job structure to use to create job instances on schedule
 */

/**
 * @typedef {NewScheduledJob} ScheduledJob
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
     * Add a scheduled job
     * @param {NewScheduledJob} options Task structure for the newly scheduled job
     * @returns {String} The ID of the scheduled task
     */
    async addScheduledJob({ title, schedule, job } = {}) {
        const id = uuid();
        const task = {
            id,
            title,
            schedule,
            job
        };
        await this.taskQueue.enqueue(async () => {
            await this.storage.setItem(`scheduled/${id}`, task);
            this._watchTask(task);
        });
        this.emit("taskAdded", {
            id,
            title,
            schedule
        });
        return id;
    }

    async getScheduledJobs() {
        const jobStream = await this.service.storage.streamItems();
        const results = [];
        jobStream.on("data", job => {
            if (job[ITEM_TYPE] === ITEM_TYPE_SCHEDULED_TASK) {
                results.push(job);
            }
        });
        await new Promise((resolve, reject) =>
            endOfStream(jobStream, err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            })
        );
        return results;
    }

    async initialise() {
        if (this.service.initialised) {
            throw new Error("Failed initialising Scheduler: Parent service already initialised");
        }
        await this.taskQueue.enqueue(async () => {
            // const tasks = await this.service.storage.getAllItems(/^scheduled\//);
            const tasks = await this.getScheduledJobs();
            tasks.forEach(task => this._watchTask(task));
        });
    }

    async removeScheduledJob(id) {
        await this.taskQueue.enqueue(async () => {
            await this.service.storage.removeItem(`scheduled/${id}`);
            const cronTask = this._cronTasks[id];
            delete this._cronTasks[id];
            cronTask.destroy();
        });
    }

    shutdown() {
        Object.keys(this._cronTasks).forEach(key => {
            const cronTask = this._cronTasks[key];
            cronTask.destroy();
        });
        this._cronTasks = {};
    }

    _watchTask(task) {
        const cronTask = cron.schedule(task.schedule, async () => {
            const jobID = await this.service.addJob(task.job);
            this.emit("createdJobFromTask", {
                jobID,
                id: task.id,
                title: task.title,
                schedule: task.schedule
            });
        });
        this.emit("taskScheduled", {
            id: task.id,
            title: task.title,
            schedule: task.schedule
        });
        this._cronTasks[task.id] = cronTask;
    }
}

module.exports = Scheduler;
