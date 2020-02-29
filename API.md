## Modules

<dl>
<dt><a href="#module_Vulpes">Vulpes</a></dt>
<dd></dd>
</dl>

## Classes

<dl>
<dt><a href="#Scheduler">Scheduler</a> ⇐ <code>EventEmitter</code></dt>
<dd><p>Scheduler for scheduled tasks</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#generateEmptyJob">generateEmptyJob()</a> ⇒ <code><a href="#Job">Job</a></code></dt>
<dd><p>Generate an empty job</p>
</dd>
<dt><a href="#jobSatisfiesPredicates">jobSatisfiesPredicates(service, job)</a> ⇒ <code><a href="#PredicatesTestResult">PredicatesTestResult</a></code></dt>
<dd><p>Test if a job satisfies all of its predicates</p>
</dd>
<dt><a href="#sortJobs">sortJobs(jobs, [sortSteps])</a> ⇒ <code><a href="#Job">Array.&lt;Job&gt;</a></code></dt>
<dd><p>Sort jobs by some criteria</p>
</dd>
<dt><a href="#sortJobsByPriority">sortJobsByPriority(jobs)</a> ⇒ <code><a href="#Job">Array.&lt;Job&gt;</a></code></dt>
<dd><p>Sort jobs by priority</p>
</dd>
<dt><a href="#updateStatsForJob">updateStatsForJob(jobStats, job)</a></dt>
<dd><p>Updates the properties in <code>jobStats</code> according to the state
of the <code>job</code></p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#NewJobAttachmentOptions">NewJobAttachmentOptions</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#JobAttachment">JobAttachment</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#AutoArchiveHelperOptions">AutoArchiveHelperOptions</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#NewJob">NewJob</a> : <code>Object</code></dt>
<dd><p>New job data</p>
</dd>
<dt><a href="#Job">Job</a> : <code>Object</code></dt>
<dd><p>A job</p>
</dd>
<dt><a href="#PredicatesTestResult">PredicatesTestResult</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#JobSortingStep">JobSortingStep</a> : <code>Object</code></dt>
<dd><p>Job sorting step configuration</p>
</dd>
<dt><a href="#NewScheduledTask">NewScheduledTask</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#ScheduledTask">ScheduledTask</a> : <code><a href="#NewScheduledTask">NewScheduledTask</a></code></dt>
<dd></dd>
<dt><a href="#UpdateTaskPropertiesOptions">UpdateTaskPropertiesOptions</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#ServiceOptions">ServiceOptions</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#GetJobChildrenOptions">GetJobChildrenOptions</a> : <code>Object</code></dt>
<dd><p>Options for fetching job children</p>
</dd>
<dt><a href="#GetJobParentsOptions">GetJobParentsOptions</a> : <code>Object</code></dt>
<dd><p>Options for fetching job parents</p>
</dd>
<dt><a href="#GetJobTreeOptions">GetJobTreeOptions</a> : <code>Object</code></dt>
<dd><p>Options for fetching a job tree</p>
</dd>
<dt><a href="#QueryJobsOptions">QueryJobsOptions</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#StartJobOptions">StartJobOptions</a> : <code>Object</code></dt>
<dd><p>Start job options</p>
</dd>
<dt><a href="#UpdateJobOptions">UpdateJobOptions</a> : <code>Object</code></dt>
<dd><p>Update job options</p>
</dd>
<dt><a href="#MemoryStorageOptions">MemoryStorageOptions</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#ResultType">ResultType</a> : <code>String</code></dt>
<dd><p>Job result type</p>
</dd>
<dt><a href="#Status">Status</a> : <code>String</code></dt>
<dd><p>Job status</p>
</dd>
<dt><a href="#Priority">Priority</a> : <code>String</code></dt>
<dd><p>Job priority</p>
</dd>
<dt><a href="#JobImportTemplateItem">JobImportTemplateItem</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#JobImportTemplate">JobImportTemplate</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#TrackerJobStats">TrackerJobStats</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#RegisteredWorker">RegisteredWorker</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="module_Vulpes"></a>

## Vulpes

* [Vulpes](#module_Vulpes)
    * _static_
        * [.AutoArchiveHelper](#module_Vulpes.AutoArchiveHelper) ⇐ <code>Helper</code>
            * [new AutoArchiveHelper([options])](#new_module_Vulpes.AutoArchiveHelper_new)
            * [.service](#Helper+service) : <code>Service</code>
            * [.attach(service)](#Helper+attach)
            * [.initialise()](#Helper+initialise) ⇒ <code>Promise</code>
            * [.shutdown()](#Helper+shutdown)
        * [.FileStorage](#module_Vulpes.FileStorage) ⇐ <code>Storage</code>
            * [new FileStorage(filename)](#new_module_Vulpes.FileStorage_new)
            * [.getItem(key)](#Storage+getItem) ⇒ <code>Promise.&lt;(\*\|null)&gt;</code>
            * [.initialise()](#Storage+initialise) ⇒ <code>Promise</code>
            * [.removeItem(key)](#Storage+removeItem) ⇒ <code>Promise</code>
            * [.setItem(key, value)](#Storage+setItem) ⇒ <code>Promise</code>
            * [.shutdown()](#Storage+shutdown) ⇒ <code>Promise</code>
            * [.streamItems()](#Storage+streamItems) ⇒ <code>Promise.&lt;ReadableStream&gt;</code>
        * [.RedisStorage](#module_Vulpes.RedisStorage) ⇐ <code>Storage</code>
            * [new RedisStorage([redisOptions])](#new_module_Vulpes.RedisStorage_new)
            * [.getItem(key)](#Storage+getItem) ⇒ <code>Promise.&lt;(\*\|null)&gt;</code>
            * [.initialise()](#Storage+initialise) ⇒ <code>Promise</code>
            * [.removeItem(key)](#Storage+removeItem) ⇒ <code>Promise</code>
            * [.setItem(key, value)](#Storage+setItem) ⇒ <code>Promise</code>
            * [.shutdown()](#Storage+shutdown) ⇒ <code>Promise</code>
            * [.streamItems()](#Storage+streamItems) ⇒ <code>Promise.&lt;ReadableStream&gt;</code>
        * [.Storage](#module_Vulpes.Storage)
        * [.convertTemplateToJobArray(tmpObj)](#module_Vulpes.convertTemplateToJobArray) ⇒ [<code>Array.&lt;NewJob&gt;</code>](#NewJob)
    * _inner_
        * [~ArtifactManager](#module_Vulpes.ArtifactManager) ⇐ <code>EventEmitter</code>
            * [new ArtifactManager([storagePath])](#new_module_Vulpes.ArtifactManager_new)
            * [.addJobAttachment(jobID, param1)](#module_Vulpes.ArtifactManager+addJobAttachment) ⇒ <code>Promise.&lt;String&gt;</code>
            * [.initialise(service)](#module_Vulpes.ArtifactManager+initialise) ⇒ <code>Promise</code>
            * [.getArtifactReadStream(artifactID)](#module_Vulpes.ArtifactManager+getArtifactReadStream) ⇒ <code>Promise.&lt;ReadableStream&gt;</code>
            * [.getArtifactWriteStream(artifactID)](#module_Vulpes.ArtifactManager+getArtifactWriteStream) ⇒ <code>Promise.&lt;WritableStream&gt;</code>
            * [.getJobAttachments(jobID)](#module_Vulpes.ArtifactManager+getJobAttachments) ⇒ [<code>Array.&lt;JobAttachment&gt;</code>](#JobAttachment)
            * [.removeArtifact(artifactID)](#module_Vulpes.ArtifactManager+removeArtifact) ⇒ <code>Promise</code>
            * [.removeJobAttachment(jobID, artifactID)](#module_Vulpes.ArtifactManager+removeJobAttachment) ⇒ <code>Promise</code>
            * [.shutdown()](#module_Vulpes.ArtifactManager+shutdown) ⇒ <code>Promise</code>
        * [~Helper](#module_Vulpes.Helper)
        * [~TimeoutHelper](#module_Vulpes.TimeoutHelper) ⇐ <code>Helper</code>
            * [.service](#Helper+service) : <code>Service</code>
            * [.attach(service)](#Helper+attach)
            * [.initialise()](#Helper+initialise) ⇒ <code>Promise</code>
            * [.shutdown()](#Helper+shutdown)
        * [~Service](#module_Vulpes.Service) ⇐ <code>EventEmitter</code>
            * [new Service([param0])](#new_module_Vulpes.Service_new)
        * [~MemoryStorage](#module_Vulpes.MemoryStorage) ⇐ <code>Storage</code>
            * [new MemoryStorage([opts])](#new_module_Vulpes.MemoryStorage_new)
            * [.getItem(key)](#Storage+getItem) ⇒ <code>Promise.&lt;(\*\|null)&gt;</code>
            * [.initialise()](#Storage+initialise) ⇒ <code>Promise</code>
            * [.removeItem(key)](#Storage+removeItem) ⇒ <code>Promise</code>
            * [.setItem(key, value)](#Storage+setItem) ⇒ <code>Promise</code>
            * [.shutdown()](#Storage+shutdown) ⇒ <code>Promise</code>
            * [.streamItems()](#Storage+streamItems) ⇒ <code>Promise.&lt;ReadableStream&gt;</code>

<a name="module_Vulpes.AutoArchiveHelper"></a>

### Vulpes.AutoArchiveHelper ⇐ <code>Helper</code>
Auto archive helper

**Kind**: static class of [<code>Vulpes</code>](#module_Vulpes)  
**Extends**: <code>Helper</code>  

* [.AutoArchiveHelper](#module_Vulpes.AutoArchiveHelper) ⇐ <code>Helper</code>
    * [new AutoArchiveHelper([options])](#new_module_Vulpes.AutoArchiveHelper_new)
    * [.service](#Helper+service) : <code>Service</code>
    * [.attach(service)](#Helper+attach)
    * [.initialise()](#Helper+initialise) ⇒ <code>Promise</code>
    * [.shutdown()](#Helper+shutdown)

<a name="new_module_Vulpes.AutoArchiveHelper_new"></a>

#### new AutoArchiveHelper([options])
Constructor for the auto archive helper


| Param | Type | Description |
| --- | --- | --- |
| [options] | [<code>AutoArchiveHelperOptions</code>](#AutoArchiveHelperOptions) | Config options |

<a name="Helper+service"></a>

#### autoArchiveHelper.service : <code>Service</code>
The attached service

**Kind**: instance property of [<code>AutoArchiveHelper</code>](#module_Vulpes.AutoArchiveHelper)  
**Overrides**: [<code>service</code>](#Helper+service)  
**Read only**: true  
<a name="Helper+attach"></a>

#### autoArchiveHelper.attach(service)
Attach to a service
This will be called by a Service instance

**Kind**: instance method of [<code>AutoArchiveHelper</code>](#module_Vulpes.AutoArchiveHelper)  
**Overrides**: [<code>attach</code>](#Helper+attach)  
**Throws**:

- <code>Error</code> Throws if already attached to a service


| Param | Type | Description |
| --- | --- | --- |
| service | <code>Service</code> | The service to attach to |

<a name="Helper+initialise"></a>

#### autoArchiveHelper.initialise() ⇒ <code>Promise</code>
Initialise the helper (only called if the helper is added BEFORE
 service initialisation)

**Kind**: instance method of [<code>AutoArchiveHelper</code>](#module_Vulpes.AutoArchiveHelper)  
**Overrides**: [<code>initialise</code>](#Helper+initialise)  
<a name="Helper+shutdown"></a>

#### autoArchiveHelper.shutdown()
Shutdown the helper
This will be called by a Service instance

**Kind**: instance method of [<code>AutoArchiveHelper</code>](#module_Vulpes.AutoArchiveHelper)  
**Overrides**: [<code>shutdown</code>](#Helper+shutdown)  
<a name="module_Vulpes.FileStorage"></a>

### Vulpes.FileStorage ⇐ <code>Storage</code>
File storage adapter
Stores and streams jobs in a local file (very inefficiently)

**Kind**: static class of [<code>Vulpes</code>](#module_Vulpes)  
**Extends**: <code>Storage</code>  

* [.FileStorage](#module_Vulpes.FileStorage) ⇐ <code>Storage</code>
    * [new FileStorage(filename)](#new_module_Vulpes.FileStorage_new)
    * [.getItem(key)](#Storage+getItem) ⇒ <code>Promise.&lt;(\*\|null)&gt;</code>
    * [.initialise()](#Storage+initialise) ⇒ <code>Promise</code>
    * [.removeItem(key)](#Storage+removeItem) ⇒ <code>Promise</code>
    * [.setItem(key, value)](#Storage+setItem) ⇒ <code>Promise</code>
    * [.shutdown()](#Storage+shutdown) ⇒ <code>Promise</code>
    * [.streamItems()](#Storage+streamItems) ⇒ <code>Promise.&lt;ReadableStream&gt;</code>

<a name="new_module_Vulpes.FileStorage_new"></a>

#### new FileStorage(filename)
Constructor for a new FileStorage instance


| Param | Type | Description |
| --- | --- | --- |
| filename | <code>String</code> | The file to store/stream jobs to and from |

<a name="Storage+getItem"></a>

#### fileStorage.getItem(key) ⇒ <code>Promise.&lt;(\*\|null)&gt;</code>
Get an item by its key

**Kind**: instance method of [<code>FileStorage</code>](#module_Vulpes.FileStorage)  
**Overrides**: [<code>getItem</code>](#Storage+getItem)  
**Returns**: <code>Promise.&lt;(\*\|null)&gt;</code> - A promise that resolves with the item, or
 null if the item doesn't exist  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The key to fetch |

<a name="Storage+initialise"></a>

#### fileStorage.initialise() ⇒ <code>Promise</code>
Initialise the storage
This usually entails reading the store from the storage so that it is
immediately available

**Kind**: instance method of [<code>FileStorage</code>](#module_Vulpes.FileStorage)  
**Overrides**: [<code>initialise</code>](#Storage+initialise)  
**Returns**: <code>Promise</code> - A promise that resolves once initialisation has
 completed  
<a name="Storage+removeItem"></a>

#### fileStorage.removeItem(key) ⇒ <code>Promise</code>
Remove an item from storage

**Kind**: instance method of [<code>FileStorage</code>](#module_Vulpes.FileStorage)  
**Overrides**: [<code>removeItem</code>](#Storage+removeItem)  
**Returns**: <code>Promise</code> - A promise that resolves once the key has been removed  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The key to remove |

<a name="Storage+setItem"></a>

#### fileStorage.setItem(key, value) ⇒ <code>Promise</code>
Set an item

**Kind**: instance method of [<code>FileStorage</code>](#module_Vulpes.FileStorage)  
**Overrides**: [<code>setItem</code>](#Storage+setItem)  
**Returns**: <code>Promise</code> - A promise that resolves once the value has been
 stored  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The key to set the value for |
| value | <code>\*</code> | The value to set |

<a name="Storage+shutdown"></a>

#### fileStorage.shutdown() ⇒ <code>Promise</code>
Shutdown the storage instance

**Kind**: instance method of [<code>FileStorage</code>](#module_Vulpes.FileStorage)  
**Overrides**: [<code>shutdown</code>](#Storage+shutdown)  
**Returns**: <code>Promise</code> - A promise that resolves once the shutdown procedure is complete  
<a name="Storage+streamItems"></a>

#### fileStorage.streamItems() ⇒ <code>Promise.&lt;ReadableStream&gt;</code>
Stream all items

**Kind**: instance method of [<code>FileStorage</code>](#module_Vulpes.FileStorage)  
**Overrides**: [<code>streamItems</code>](#Storage+streamItems)  
**Returns**: <code>Promise.&lt;ReadableStream&gt;</code> - A promise that resolves with the readable stream  
<a name="module_Vulpes.RedisStorage"></a>

### Vulpes.RedisStorage ⇐ <code>Storage</code>
Redis storage adapter
Stores items in a Redis database

**Kind**: static class of [<code>Vulpes</code>](#module_Vulpes)  
**Extends**: <code>Storage</code>  
**See**: https://www.npmjs.com/package/ioredis  

* [.RedisStorage](#module_Vulpes.RedisStorage) ⇐ <code>Storage</code>
    * [new RedisStorage([redisOptions])](#new_module_Vulpes.RedisStorage_new)
    * [.getItem(key)](#Storage+getItem) ⇒ <code>Promise.&lt;(\*\|null)&gt;</code>
    * [.initialise()](#Storage+initialise) ⇒ <code>Promise</code>
    * [.removeItem(key)](#Storage+removeItem) ⇒ <code>Promise</code>
    * [.setItem(key, value)](#Storage+setItem) ⇒ <code>Promise</code>
    * [.shutdown()](#Storage+shutdown) ⇒ <code>Promise</code>
    * [.streamItems()](#Storage+streamItems) ⇒ <code>Promise.&lt;ReadableStream&gt;</code>

<a name="new_module_Vulpes.RedisStorage_new"></a>

#### new RedisStorage([redisOptions])
Create a new Redis storage instance


| Param | Type | Description |
| --- | --- | --- |
| [redisOptions] | <code>Object</code> | The options for ioredis |

<a name="Storage+getItem"></a>

#### redisStorage.getItem(key) ⇒ <code>Promise.&lt;(\*\|null)&gt;</code>
Get an item by its key

**Kind**: instance method of [<code>RedisStorage</code>](#module_Vulpes.RedisStorage)  
**Overrides**: [<code>getItem</code>](#Storage+getItem)  
**Returns**: <code>Promise.&lt;(\*\|null)&gt;</code> - A promise that resolves with the item, or
 null if the item doesn't exist  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The key to fetch |

<a name="Storage+initialise"></a>

#### redisStorage.initialise() ⇒ <code>Promise</code>
Initialise the storage
This usually entails reading the store from the storage so that it is
immediately available

**Kind**: instance method of [<code>RedisStorage</code>](#module_Vulpes.RedisStorage)  
**Overrides**: [<code>initialise</code>](#Storage+initialise)  
**Returns**: <code>Promise</code> - A promise that resolves once initialisation has
 completed  
<a name="Storage+removeItem"></a>

#### redisStorage.removeItem(key) ⇒ <code>Promise</code>
Remove an item from storage

**Kind**: instance method of [<code>RedisStorage</code>](#module_Vulpes.RedisStorage)  
**Overrides**: [<code>removeItem</code>](#Storage+removeItem)  
**Returns**: <code>Promise</code> - A promise that resolves once the key has been removed  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The key to remove |

<a name="Storage+setItem"></a>

#### redisStorage.setItem(key, value) ⇒ <code>Promise</code>
Set an item

**Kind**: instance method of [<code>RedisStorage</code>](#module_Vulpes.RedisStorage)  
**Overrides**: [<code>setItem</code>](#Storage+setItem)  
**Returns**: <code>Promise</code> - A promise that resolves once the value has been
 stored  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The key to set the value for |
| value | <code>\*</code> | The value to set |

<a name="Storage+shutdown"></a>

#### redisStorage.shutdown() ⇒ <code>Promise</code>
Shutdown the storage instance

**Kind**: instance method of [<code>RedisStorage</code>](#module_Vulpes.RedisStorage)  
**Overrides**: [<code>shutdown</code>](#Storage+shutdown)  
**Returns**: <code>Promise</code> - A promise that resolves once the shutdown procedure is complete  
<a name="Storage+streamItems"></a>

#### redisStorage.streamItems() ⇒ <code>Promise.&lt;ReadableStream&gt;</code>
Stream all items

**Kind**: instance method of [<code>RedisStorage</code>](#module_Vulpes.RedisStorage)  
**Overrides**: [<code>streamItems</code>](#Storage+streamItems)  
**Returns**: <code>Promise.&lt;ReadableStream&gt;</code> - A promise that resolves with the readable stream  
<a name="module_Vulpes.Storage"></a>

### Vulpes.Storage
Storage base class
Provides a storage mechanism for the job handling framework,
allowing jobs to persist between restarts. This is an
interface and does not actually perform any operations.

**Kind**: static class of [<code>Vulpes</code>](#module_Vulpes)  
<a name="module_Vulpes.convertTemplateToJobArray"></a>

### Vulpes.convertTemplateToJobArray(tmpObj) ⇒ [<code>Array.&lt;NewJob&gt;</code>](#NewJob)
Convert a template to an array of jobs to import

**Kind**: static method of [<code>Vulpes</code>](#module_Vulpes)  
**Returns**: [<code>Array.&lt;NewJob&gt;</code>](#NewJob) - An array of new jobs to pass to `Service#addJobs`  

| Param | Type | Description |
| --- | --- | --- |
| tmpObj | [<code>JobImportTemplate</code>](#JobImportTemplate) | The template to convert |

<a name="module_Vulpes.ArtifactManager"></a>

### Vulpes~ArtifactManager ⇐ <code>EventEmitter</code>
Artifact Manager

**Kind**: inner class of [<code>Vulpes</code>](#module_Vulpes)  
**Extends**: <code>EventEmitter</code>  

* [~ArtifactManager](#module_Vulpes.ArtifactManager) ⇐ <code>EventEmitter</code>
    * [new ArtifactManager([storagePath])](#new_module_Vulpes.ArtifactManager_new)
    * [.addJobAttachment(jobID, param1)](#module_Vulpes.ArtifactManager+addJobAttachment) ⇒ <code>Promise.&lt;String&gt;</code>
    * [.initialise(service)](#module_Vulpes.ArtifactManager+initialise) ⇒ <code>Promise</code>
    * [.getArtifactReadStream(artifactID)](#module_Vulpes.ArtifactManager+getArtifactReadStream) ⇒ <code>Promise.&lt;ReadableStream&gt;</code>
    * [.getArtifactWriteStream(artifactID)](#module_Vulpes.ArtifactManager+getArtifactWriteStream) ⇒ <code>Promise.&lt;WritableStream&gt;</code>
    * [.getJobAttachments(jobID)](#module_Vulpes.ArtifactManager+getJobAttachments) ⇒ [<code>Array.&lt;JobAttachment&gt;</code>](#JobAttachment)
    * [.removeArtifact(artifactID)](#module_Vulpes.ArtifactManager+removeArtifact) ⇒ <code>Promise</code>
    * [.removeJobAttachment(jobID, artifactID)](#module_Vulpes.ArtifactManager+removeJobAttachment) ⇒ <code>Promise</code>
    * [.shutdown()](#module_Vulpes.ArtifactManager+shutdown) ⇒ <code>Promise</code>

<a name="new_module_Vulpes.ArtifactManager_new"></a>

#### new ArtifactManager([storagePath])
Constructor for the artifact manager


| Param | Type | Description |
| --- | --- | --- |
| [storagePath] | <code>String</code> | The path to store artifacts in. Defaults to  `~/.vulpes/artifacts` if not specified. |

<a name="module_Vulpes.ArtifactManager+addJobAttachment"></a>

#### artifactManager.addJobAttachment(jobID, param1) ⇒ <code>Promise.&lt;String&gt;</code>
Add a new job attachment

**Kind**: instance method of [<code>ArtifactManager</code>](#module_Vulpes.ArtifactManager)  
**Returns**: <code>Promise.&lt;String&gt;</code> - A promise that resolves with the attachment ID  

| Param | Type | Description |
| --- | --- | --- |
| jobID | <code>String</code> | The job ID to add the attachment to |
| param1 | [<code>NewJobAttachmentOptions</code>](#NewJobAttachmentOptions) | Options for the new attachment |

<a name="module_Vulpes.ArtifactManager+initialise"></a>

#### artifactManager.initialise(service) ⇒ <code>Promise</code>
Initialise the manager (called by Service)

**Kind**: instance method of [<code>ArtifactManager</code>](#module_Vulpes.ArtifactManager)  
**Emits**: [<code>migrationComplete</code>](#ArtifactManager+event_migrationComplete)  

| Param | Type | Description |
| --- | --- | --- |
| service | <code>Service</code> | The service instance we're attached to |

<a name="module_Vulpes.ArtifactManager+getArtifactReadStream"></a>

#### artifactManager.getArtifactReadStream(artifactID) ⇒ <code>Promise.&lt;ReadableStream&gt;</code>
Get a readable stream of an artifact

**Kind**: instance method of [<code>ArtifactManager</code>](#module_Vulpes.ArtifactManager)  

| Param | Type | Description |
| --- | --- | --- |
| artifactID | <code>String</code> | The artifact's ID |

<a name="module_Vulpes.ArtifactManager+getArtifactWriteStream"></a>

#### artifactManager.getArtifactWriteStream(artifactID) ⇒ <code>Promise.&lt;WritableStream&gt;</code>
Get a writeable stream for an artifact

**Kind**: instance method of [<code>ArtifactManager</code>](#module_Vulpes.ArtifactManager)  

| Param | Type | Description |
| --- | --- | --- |
| artifactID | <code>String</code> | The artifact's ID |

<a name="module_Vulpes.ArtifactManager+getJobAttachments"></a>

#### artifactManager.getJobAttachments(jobID) ⇒ [<code>Array.&lt;JobAttachment&gt;</code>](#JobAttachment)
Get all job attachments

**Kind**: instance method of [<code>ArtifactManager</code>](#module_Vulpes.ArtifactManager)  

| Param | Type | Description |
| --- | --- | --- |
| jobID | <code>String</code> | The ID of the job to fetch artifacts for |

<a name="module_Vulpes.ArtifactManager+removeArtifact"></a>

#### artifactManager.removeArtifact(artifactID) ⇒ <code>Promise</code>
Remove an artifact (does not affect jobs)

**Kind**: instance method of [<code>ArtifactManager</code>](#module_Vulpes.ArtifactManager)  

| Param | Type | Description |
| --- | --- | --- |
| artifactID | <code>String</code> | The ID of the artifact to remove |

<a name="module_Vulpes.ArtifactManager+removeJobAttachment"></a>

#### artifactManager.removeJobAttachment(jobID, artifactID) ⇒ <code>Promise</code>
Remove an attachment from a job, also removing
the associated artifact

**Kind**: instance method of [<code>ArtifactManager</code>](#module_Vulpes.ArtifactManager)  

| Param | Type | Description |
| --- | --- | --- |
| jobID | <code>String</code> | The ID of the job containing the artifact |
| artifactID | <code>String</code> | The ID of the artifact to remove from  the job |

<a name="module_Vulpes.ArtifactManager+shutdown"></a>

#### artifactManager.shutdown() ⇒ <code>Promise</code>
Shutdown the artifact manager

**Kind**: instance method of [<code>ArtifactManager</code>](#module_Vulpes.ArtifactManager)  
<a name="module_Vulpes.Helper"></a>

### Vulpes~Helper
Helper base class
Helpers provide an easy interface with which to
attach to services to perform ancillary tasks.

**Kind**: inner class of [<code>Vulpes</code>](#module_Vulpes)  
<a name="module_Vulpes.TimeoutHelper"></a>

### Vulpes~TimeoutHelper ⇐ <code>Helper</code>
Helper for timing-out jobs

**Kind**: inner class of [<code>Vulpes</code>](#module_Vulpes)  
**Extends**: <code>Helper</code>  

* [~TimeoutHelper](#module_Vulpes.TimeoutHelper) ⇐ <code>Helper</code>
    * [.service](#Helper+service) : <code>Service</code>
    * [.attach(service)](#Helper+attach)
    * [.initialise()](#Helper+initialise) ⇒ <code>Promise</code>
    * [.shutdown()](#Helper+shutdown)

<a name="Helper+service"></a>

#### timeoutHelper.service : <code>Service</code>
The attached service

**Kind**: instance property of [<code>TimeoutHelper</code>](#module_Vulpes.TimeoutHelper)  
**Overrides**: [<code>service</code>](#Helper+service)  
**Read only**: true  
<a name="Helper+attach"></a>

#### timeoutHelper.attach(service)
Attach to a service
This will be called by a Service instance

**Kind**: instance method of [<code>TimeoutHelper</code>](#module_Vulpes.TimeoutHelper)  
**Overrides**: [<code>attach</code>](#Helper+attach)  
**Throws**:

- <code>Error</code> Throws if already attached to a service


| Param | Type | Description |
| --- | --- | --- |
| service | <code>Service</code> | The service to attach to |

<a name="Helper+initialise"></a>

#### timeoutHelper.initialise() ⇒ <code>Promise</code>
Initialise the helper (only called if the helper is added BEFORE
 service initialisation)

**Kind**: instance method of [<code>TimeoutHelper</code>](#module_Vulpes.TimeoutHelper)  
**Overrides**: [<code>initialise</code>](#Helper+initialise)  
<a name="Helper+shutdown"></a>

#### timeoutHelper.shutdown()
Shutdown the helper
This will be called by a Service instance

**Kind**: instance method of [<code>TimeoutHelper</code>](#module_Vulpes.TimeoutHelper)  
**Overrides**: [<code>shutdown</code>](#Helper+shutdown)  
<a name="module_Vulpes.Service"></a>

### Vulpes~Service ⇐ <code>EventEmitter</code>
Service for managing jobs

**Kind**: inner class of [<code>Vulpes</code>](#module_Vulpes)  
**Extends**: <code>EventEmitter</code>  
<a name="new_module_Vulpes.Service_new"></a>

#### new Service([param0])
Contrsuctor for the Service class


| Param | Type | Description |
| --- | --- | --- |
| [param0] | [<code>ServiceOptions</code>](#ServiceOptions) | Options for the new service |

<a name="module_Vulpes.MemoryStorage"></a>

### Vulpes~MemoryStorage ⇐ <code>Storage</code>
Memory storage adapter
Stores jobs in memory. Once application is closed all jobs are
purged - do not use this storage if you desire persistence.

**Kind**: inner class of [<code>Vulpes</code>](#module_Vulpes)  
**Extends**: <code>Storage</code>  

* [~MemoryStorage](#module_Vulpes.MemoryStorage) ⇐ <code>Storage</code>
    * [new MemoryStorage([opts])](#new_module_Vulpes.MemoryStorage_new)
    * [.getItem(key)](#Storage+getItem) ⇒ <code>Promise.&lt;(\*\|null)&gt;</code>
    * [.initialise()](#Storage+initialise) ⇒ <code>Promise</code>
    * [.removeItem(key)](#Storage+removeItem) ⇒ <code>Promise</code>
    * [.setItem(key, value)](#Storage+setItem) ⇒ <code>Promise</code>
    * [.shutdown()](#Storage+shutdown) ⇒ <code>Promise</code>
    * [.streamItems()](#Storage+streamItems) ⇒ <code>Promise.&lt;ReadableStream&gt;</code>

<a name="new_module_Vulpes.MemoryStorage_new"></a>

#### new MemoryStorage([opts])
Constructor for the storage instance


| Param | Type | Description |
| --- | --- | --- |
| [opts] | [<code>MemoryStorageOptions</code>](#MemoryStorageOptions) | Optional configuration for  the memory storage instance |

<a name="Storage+getItem"></a>

#### memoryStorage.getItem(key) ⇒ <code>Promise.&lt;(\*\|null)&gt;</code>
Get an item by its key

**Kind**: instance method of [<code>MemoryStorage</code>](#module_Vulpes.MemoryStorage)  
**Overrides**: [<code>getItem</code>](#Storage+getItem)  
**Returns**: <code>Promise.&lt;(\*\|null)&gt;</code> - A promise that resolves with the item, or
 null if the item doesn't exist  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The key to fetch |

<a name="Storage+initialise"></a>

#### memoryStorage.initialise() ⇒ <code>Promise</code>
Initialise the storage
This usually entails reading the store from the storage so that it is
immediately available

**Kind**: instance method of [<code>MemoryStorage</code>](#module_Vulpes.MemoryStorage)  
**Overrides**: [<code>initialise</code>](#Storage+initialise)  
**Returns**: <code>Promise</code> - A promise that resolves once initialisation has
 completed  
<a name="Storage+removeItem"></a>

#### memoryStorage.removeItem(key) ⇒ <code>Promise</code>
Remove an item from storage

**Kind**: instance method of [<code>MemoryStorage</code>](#module_Vulpes.MemoryStorage)  
**Overrides**: [<code>removeItem</code>](#Storage+removeItem)  
**Returns**: <code>Promise</code> - A promise that resolves once the key has been removed  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The key to remove |

<a name="Storage+setItem"></a>

#### memoryStorage.setItem(key, value) ⇒ <code>Promise</code>
Set an item

**Kind**: instance method of [<code>MemoryStorage</code>](#module_Vulpes.MemoryStorage)  
**Overrides**: [<code>setItem</code>](#Storage+setItem)  
**Returns**: <code>Promise</code> - A promise that resolves once the value has been
 stored  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The key to set the value for |
| value | <code>\*</code> | The value to set |

<a name="Storage+shutdown"></a>

#### memoryStorage.shutdown() ⇒ <code>Promise</code>
Shutdown the storage instance

**Kind**: instance method of [<code>MemoryStorage</code>](#module_Vulpes.MemoryStorage)  
**Overrides**: [<code>shutdown</code>](#Storage+shutdown)  
**Returns**: <code>Promise</code> - A promise that resolves once the shutdown procedure is complete  
<a name="Storage+streamItems"></a>

#### memoryStorage.streamItems() ⇒ <code>Promise.&lt;ReadableStream&gt;</code>
Stream all items

**Kind**: instance method of [<code>MemoryStorage</code>](#module_Vulpes.MemoryStorage)  
**Overrides**: [<code>streamItems</code>](#Storage+streamItems)  
**Returns**: <code>Promise.&lt;ReadableStream&gt;</code> - A promise that resolves with the readable stream  
<a name="Scheduler"></a>

## Scheduler ⇐ <code>EventEmitter</code>
Scheduler for scheduled tasks

**Kind**: global class  
**Extends**: <code>EventEmitter</code>  

* [Scheduler](#Scheduler) ⇐ <code>EventEmitter</code>
    * [.service](#Scheduler+service) : <code>Service</code>
    * [.taskQueue](#Scheduler+taskQueue) : <code>Channel</code>
    * ~~[.addScheduledJobs()](#Scheduler+addScheduledJobs)~~
    * [.addScheduledTask(options)](#Scheduler+addScheduledTask) ⇒ <code>String</code>
    * [.getScheduledTask(id)](#Scheduler+getScheduledTask) ⇒ [<code>Promise.&lt;ScheduledTask&gt;</code>](#ScheduledTask)
    * [.getScheduledTasks()](#Scheduler+getScheduledTasks) ⇒ <code>Promise.&lt;Array.&lt;ScheduledTask&gt;&gt;</code>
    * [.initialise()](#Scheduler+initialise) ⇒ <code>Promise</code>
    * [.removeScheduledTask()](#Scheduler+removeScheduledTask) ⇒ <code>Promise</code>
    * [.setJobsForScheduledTask(taskID, jobs)](#Scheduler+setJobsForScheduledTask) ⇒ <code>Promise</code>
    * [.shutdown()](#Scheduler+shutdown)
    * [.toggleTask(taskID, [enabled])](#Scheduler+toggleTask) ⇒ [<code>ScheduledTask</code>](#ScheduledTask)
    * [.triggerTask(taskID)](#Scheduler+triggerTask) ⇒ <code>Promise</code>
    * [.updateTaskProperties(taskID, ops)](#Scheduler+updateTaskProperties) ⇒ [<code>ScheduledTask</code>](#ScheduledTask)
    * [._cronSchedule()](#Scheduler+_cronSchedule) ⇒ <code>Object</code>
    * [._executeTask(taskOrTaskID, [force])](#Scheduler+_executeTask)
    * [._unwatchTask(task)](#Scheduler+_unwatchTask) ⇒ <code>Boolean</code>
    * [._watchTask(task)](#Scheduler+_watchTask)
    * [._writeTask(task)](#Scheduler+_writeTask) ⇒ <code>Promise</code>
    * ["taskAdded"](#Scheduler+event_taskAdded)
    * ["taskJobsUpdated"](#Scheduler+event_taskJobsUpdated)
    * ["taskStatusToggled"](#Scheduler+event_taskStatusToggled)
    * ["taskPropertiesUpdated"](#Scheduler+event_taskPropertiesUpdated)
    * ["createdJobsFromTask"](#Scheduler+event_createdJobsFromTask)
    * ["taskScheduled"](#Scheduler+event_taskScheduled)

<a name="Scheduler+service"></a>

### scheduler.service : <code>Service</code>
Service reference

**Kind**: instance property of [<code>Scheduler</code>](#Scheduler)  
<a name="Scheduler+taskQueue"></a>

### scheduler.taskQueue : <code>Channel</code>
Task queue for job schedule checks

**Kind**: instance property of [<code>Scheduler</code>](#Scheduler)  
**Read only**: true  
<a name="Scheduler+addScheduledJobs"></a>

### ~~scheduler.addScheduledJobs()~~
***Deprecated***

Add scheduled jobs

**Kind**: instance method of [<code>Scheduler</code>](#Scheduler)  
**See**: Scheduler#addScheduledTask  
<a name="Scheduler+addScheduledTask"></a>

### scheduler.addScheduledTask(options) ⇒ <code>String</code>
Add scheduled jobs task

**Kind**: instance method of [<code>Scheduler</code>](#Scheduler)  
**Returns**: <code>String</code> - The ID of the scheduled task  
**Throws**:

- <code>Error</code> Throws if the schedule is not a valid CRON format

**Emits**: [<code>taskAdded</code>](#Scheduler+event_taskAdded)  

| Param | Type | Description |
| --- | --- | --- |
| options | [<code>NewScheduledTask</code>](#NewScheduledTask) | Task structure for the newly scheduled job |

<a name="Scheduler+getScheduledTask"></a>

### scheduler.getScheduledTask(id) ⇒ [<code>Promise.&lt;ScheduledTask&gt;</code>](#ScheduledTask)
Get a scheduled task by its ID

**Kind**: instance method of [<code>Scheduler</code>](#Scheduler)  
**Returns**: [<code>Promise.&lt;ScheduledTask&gt;</code>](#ScheduledTask) - A promise that resolves with the scheduled task  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | The ID of the task |

<a name="Scheduler+getScheduledTasks"></a>

### scheduler.getScheduledTasks() ⇒ <code>Promise.&lt;Array.&lt;ScheduledTask&gt;&gt;</code>
Get all scheduled tasks

**Kind**: instance method of [<code>Scheduler</code>](#Scheduler)  
**Returns**: <code>Promise.&lt;Array.&lt;ScheduledTask&gt;&gt;</code> - A promise that resolves with an array of all
 scheduled tasks  
<a name="Scheduler+initialise"></a>

### scheduler.initialise() ⇒ <code>Promise</code>
Initialise the scheduler

**Kind**: instance method of [<code>Scheduler</code>](#Scheduler)  
<a name="Scheduler+removeScheduledTask"></a>

### scheduler.removeScheduledTask() ⇒ <code>Promise</code>
Remove a scheduled task

**Kind**: instance method of [<code>Scheduler</code>](#Scheduler)  
<a name="Scheduler+setJobsForScheduledTask"></a>

### scheduler.setJobsForScheduledTask(taskID, jobs) ⇒ <code>Promise</code>
Set the jobs array for a task

**Kind**: instance method of [<code>Scheduler</code>](#Scheduler)  
**Emits**: [<code>taskJobsUpdated</code>](#Scheduler+event_taskJobsUpdated)  

| Param | Type | Description |
| --- | --- | --- |
| taskID | <code>String</code> | The ID of the task |
| jobs | [<code>Array.&lt;NewJob&gt;</code>](#NewJob) | An array of job templates |

<a name="Scheduler+shutdown"></a>

### scheduler.shutdown()
Shutdown the scheduler

**Kind**: instance method of [<code>Scheduler</code>](#Scheduler)  
<a name="Scheduler+toggleTask"></a>

### scheduler.toggleTask(taskID, [enabled]) ⇒ [<code>ScheduledTask</code>](#ScheduledTask)
Enable/disable a task

**Kind**: instance method of [<code>Scheduler</code>](#Scheduler)  
**Returns**: [<code>ScheduledTask</code>](#ScheduledTask) - Returns the toggled task  
**Emits**: [<code>taskStatusToggled</code>](#Scheduler+event_taskStatusToggled)  

| Param | Type | Description |
| --- | --- | --- |
| taskID | <code>String</code> | The ID of the task |
| [enabled] | <code>Boolean</code> | Set the enabled status of the task to  true or false. If not specified, the status of the task will  be toggled. |

<a name="Scheduler+triggerTask"></a>

### scheduler.triggerTask(taskID) ⇒ <code>Promise</code>
Trigger a task (skip schedule)

**Kind**: instance method of [<code>Scheduler</code>](#Scheduler)  

| Param | Type | Description |
| --- | --- | --- |
| taskID | <code>String</code> | The scheduled task's ID |

<a name="Scheduler+updateTaskProperties"></a>

### scheduler.updateTaskProperties(taskID, ops) ⇒ [<code>ScheduledTask</code>](#ScheduledTask)
Update properties of a task

**Kind**: instance method of [<code>Scheduler</code>](#Scheduler)  
**Returns**: [<code>ScheduledTask</code>](#ScheduledTask) - Returns the toggled task  
**Emits**: [<code>taskPropertiesUpdated</code>](#Scheduler+event_taskPropertiesUpdated)  

| Param | Type | Description |
| --- | --- | --- |
| taskID | <code>String</code> | The ID of the task to update |
| ops | [<code>UpdateTaskPropertiesOptions</code>](#UpdateTaskPropertiesOptions) | Properties to update on the task |

<a name="Scheduler+_cronSchedule"></a>

### scheduler.\_cronSchedule() ⇒ <code>Object</code>
Schedule a CRON execution

**Kind**: instance method of [<code>Scheduler</code>](#Scheduler)  
**Returns**: <code>Object</code> - The CRON task  
**Access**: protected  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| schedule | <code>String</code> | The minute-accurate CRON string |
| cb | <code>function</code> | The callback to fire when the CRON timer matches current time |

<a name="Scheduler+_executeTask"></a>

### scheduler.\_executeTask(taskOrTaskID, [force])
Execute a task

**Kind**: instance method of [<code>Scheduler</code>](#Scheduler)  
**Emits**: [<code>createdJobsFromTask</code>](#Scheduler+event_createdJobsFromTask)  
**Access**: protected  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| taskOrTaskID | [<code>ScheduledTask</code>](#ScheduledTask) \| <code>String</code> |  | The scheduled task or an ID of a task |
| [force] | <code>Boolean</code> | <code>false</code> | Optionally force the execution (bypass disabled statuses).  Default is false. |

<a name="Scheduler+_unwatchTask"></a>

### scheduler.\_unwatchTask(task) ⇒ <code>Boolean</code>
Unwatch a CRON task (deschedule it)

**Kind**: instance method of [<code>Scheduler</code>](#Scheduler)  
**Returns**: <code>Boolean</code> - True if a task was found, false otherwise  
**Access**: protected  

| Param | Type | Description |
| --- | --- | --- |
| task | [<code>ScheduledTask</code>](#ScheduledTask) | The task to deschedule |

<a name="Scheduler+_watchTask"></a>

### scheduler.\_watchTask(task)
Watch a task (start timer for scheduling)

**Kind**: instance method of [<code>Scheduler</code>](#Scheduler)  
**Emits**: [<code>taskScheduled</code>](#Scheduler+event_taskScheduled)  
**Access**: protected  

| Param | Type | Description |
| --- | --- | --- |
| task | [<code>ScheduledTask</code>](#ScheduledTask) | The task to watch |

<a name="Scheduler+_writeTask"></a>

### scheduler.\_writeTask(task) ⇒ <code>Promise</code>
Write a task to storage

**Kind**: instance method of [<code>Scheduler</code>](#Scheduler)  
**Access**: protected  

| Param | Type | Description |
| --- | --- | --- |
| task | [<code>ScheduledTask</code>](#ScheduledTask) | The task to write (will overwrite) |

<a name="Scheduler+event_taskAdded"></a>

### "taskAdded"
Event for when a new task is added

**Kind**: event emitted by [<code>Scheduler</code>](#Scheduler)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | The ID of the task |
| title | <code>String</code> | The title of the task |
| schedule | <code>String</code> | The CRON schedule for the task |
| enabled | <code>Boolean</code> | Whether the task is enabled or not |
| jobs | [<code>Array.&lt;NewJob&gt;</code>](#NewJob) | Array of job templates for scheduled creation |

<a name="Scheduler+event_taskJobsUpdated"></a>

### "taskJobsUpdated"
Event for when a task's jobs are updated

**Kind**: event emitted by [<code>Scheduler</code>](#Scheduler)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | The ID of the task |
| jobs | [<code>Array.&lt;NewJob&gt;</code>](#NewJob) | Array of job templates for scheduled creation |

<a name="Scheduler+event_taskStatusToggled"></a>

### "taskStatusToggled"
Event for when a task has its status toggled (enabled/disabled)

**Kind**: event emitted by [<code>Scheduler</code>](#Scheduler)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | The ID of the task |
| enabled | <code>Boolean</code> | Whether the task is enabled or disabled |

<a name="Scheduler+event_taskPropertiesUpdated"></a>

### "taskPropertiesUpdated"
Event for when a task's properties (title/schedule) are updated

**Kind**: event emitted by [<code>Scheduler</code>](#Scheduler)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | The ID of the task |
| title | <code>String</code> | The title of the task |
| schedule | <code>String</code> | The CRON schedule for the task |

<a name="Scheduler+event_createdJobsFromTask"></a>

### "createdJobsFromTask"
Event for when jobs are created as a result of a scheduled task
having been fired using its CRON schedule

**Kind**: event emitted by [<code>Scheduler</code>](#Scheduler)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | The ID of the task |
| title | <code>String</code> | The title of the task |
| schedule | <code>String</code> | The CRON schedule for the task |
| jobs | [<code>Array.&lt;NewJob&gt;</code>](#NewJob) | Array of job templates for scheduled creation |

<a name="Scheduler+event_taskScheduled"></a>

### "taskScheduled"
Event for when a task has been scheduled (fired both when created and
 when being read from storage upon a fresh start-up)

**Kind**: event emitted by [<code>Scheduler</code>](#Scheduler)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | The ID of the task |
| title | <code>String</code> | The title of the task |
| schedule | <code>String</code> | The CRON schedule for the task |
| enabled | <code>Boolean</code> | Whether the task is enabled or not |

<a name="JobPriorities"></a>

## JobPriorities : <code>enum</code>
Job priorities

**Kind**: global enum  
**Read only**: true  
<a name="JobResultTypes"></a>

## JobResultTypes : <code>enum</code>
Job result types

**Kind**: global enum  
**Read only**: true  
<a name="JobStatuses"></a>

## JobStatuses : <code>enum</code>
Job statuses

**Kind**: global enum  
**Read only**: true  
<a name="generateEmptyJob"></a>

## generateEmptyJob() ⇒ [<code>Job</code>](#Job)
Generate an empty job

**Kind**: global function  
**Returns**: [<code>Job</code>](#Job) - A new empty job  
<a name="jobSatisfiesPredicates"></a>

## jobSatisfiesPredicates(service, job) ⇒ [<code>PredicatesTestResult</code>](#PredicatesTestResult)
Test if a job satisfies all of its predicates

**Kind**: global function  
**Returns**: [<code>PredicatesTestResult</code>](#PredicatesTestResult) - Test results  

| Param | Type | Description |
| --- | --- | --- |
| service | <code>Service</code> | The service |
| job | [<code>Job</code>](#Job) | The job to test |

<a name="sortJobs"></a>

## sortJobs(jobs, [sortSteps]) ⇒ [<code>Array.&lt;Job&gt;</code>](#Job)
Sort jobs by some criteria

**Kind**: global function  
**Returns**: [<code>Array.&lt;Job&gt;</code>](#Job) - An array of sorted jobs  

| Param | Type | Description |
| --- | --- | --- |
| jobs | [<code>Array.&lt;Job&gt;</code>](#Job) | The jobs to sort |
| [sortSteps] | [<code>JobSortingStep</code>](#JobSortingStep) | Sorting criteia for sorting the jobs |

**Example**  
```js
// Sort jobs by priority:
 sortJobs(
     [{ id: "some job" }],
     [
         { property: "priority", direction: "desc" },
         { property: "created", direction: "asc" }
     ]
 );
 // This sorts the jobs by priority (highest) first, and then by created
 // (oldest) second..
```
<a name="sortJobsByPriority"></a>

## sortJobsByPriority(jobs) ⇒ [<code>Array.&lt;Job&gt;</code>](#Job)
Sort jobs by priority

**Kind**: global function  
**Returns**: [<code>Array.&lt;Job&gt;</code>](#Job) - An array of sorted jobs  
**See**: sortJobs  

| Param | Type | Description |
| --- | --- | --- |
| jobs | [<code>Array.&lt;Job&gt;</code>](#Job) | An array of jobs |

<a name="updateStatsForJob"></a>

## updateStatsForJob(jobStats, job)
Updates the properties in `jobStats` according to the state
of the `job`

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| jobStats | <code>Object</code> | Job stats - mutated during execution (not pure) |
| job | [<code>Job</code>](#Job) | A raw job |

<a name="NewJobAttachmentOptions"></a>

## NewJobAttachmentOptions : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [title] | <code>String</code> | The title of the attachment |
| data | <code>Buffer</code> \| <code>String</code> \| <code>ReadableStream</code> | The attachment data |
| mime | <code>String</code> | The mime type of the attachment |
| [created] | <code>Number</code> | The timestamp of creation |

<a name="JobAttachment"></a>

## JobAttachment : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | The attachment/artifact ID |
| title | <code>String</code> | The artifact title |
| mime | <code>String</code> | The mime type for the artifact |
| created | <code>Number</code> | The JS timestamp of creation/addition |

<a name="AutoArchiveHelperOptions"></a>

## AutoArchiveHelperOptions : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [checkInterval] | <code>Number</code> | Milliseconds between archive checks |
| [archivePeriod] | <code>Number</code> | Milliseconds that a job has been stopped before  it can be archived |
| [queryLimit] | <code>Number</code> | Max job results from queries for archving |

<a name="NewJob"></a>

## NewJob : <code>Object</code>
New job data

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [type] | <code>String</code> | The type of job (custom, controlled by the consumer) |
| [priority] | [<code>Priority</code>](#Priority) | The priority of the job (defaults to normal priority) |
| [parents] | <code>Array.&lt;String&gt;</code> | Parents of this job |
| [predicate] | <code>String</code> | The predicate function that should evaluate to true  before this job can run |
| [data] | <code>Object</code> | Data for this job |
| [timeLimit] | <code>Number</code> | Time limit in milliseconds (defaults to the default  timelimit on the Service instance). Set to null to disable timeouts. |
| [attemptsMax] | <code>Number</code> | The maximum number of soft failures that can occur  before this job |
| [archived] | <code>Boolean</code> | Determining if job will be excluded from queries or not |

<a name="Job"></a>

## Job : <code>Object</code>
A job

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | The job's ID |
| type | <code>String</code> | The job type (consumer controlled) |
| status | [<code>Status</code>](#Status) | The current job state |
| priority | [<code>Priority</code>](#Priority) | The job's priority |
| created | <code>Number</code> | The creation timestamp of the job |
| parents | <code>Array.&lt;String&gt;</code> | An array of IDs of the job's parents |
| predicate | <code>Object</code> | Predicate restraints for the job |
| predicate.attemptsMax | <code>Number</code> | Maximum attempts that can be undertaken  on the job before it is failed |
| predicate.timeBetweenRetries | <code>Number</code> | Milliseconds between retries  (minimum) |
| data | <code>Object</code> | The data for the job (incoming) |
| result | <code>Object</code> | Result information |
| result.type | [<code>ResultType</code>](#ResultType) \| <code>null</code> | The type of result (null if not  stopped at least once) |
| result.data | <code>Object</code> | Resulting data from the last execution  (outgoing) |
| times | <code>Object</code> | Collection of notable timestamps for the job |
| times.firstStarted | <code>Number</code> \| <code>null</code> | Timestamp for when the job was  first started |
| times.started | <code>Number</code> \| <code>null</code> | Timestamp for when the job was last  started |
| times.stopped | <code>Number</code> \| <code>null</code> | Timestamp for when the job was last  stopped |
| times.completed | <code>Number</code> \| <code>null</code> | Timestamp for when the job was  completed successfully |
| timeLimit | <code>Number</code> \| <code>null</code> | Time limitation for the job's  execution. null means no limit. |
| attempts | <code>Number</code> | Number of attempts the job has had |
| archived | <code>Boolean</code> | True means the job will be archived and excluded from queries |

<a name="PredicatesTestResult"></a>

## PredicatesTestResult : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| satisfies | <code>Boolean</code> | True if all predicates satisfied, false otherwise |
| [predicate] | <code>String</code> | Name of the failing predicate |

<a name="JobSortingStep"></a>

## JobSortingStep : <code>Object</code>
Job sorting step configuration

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| property | <code>String</code> | The job property to sort by |
| direction | <code>String</code> | The direction to sort in (desc/asc) |

<a name="NewScheduledTask"></a>

## NewScheduledTask : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| title | <code>String</code> | The scheduled job title |
| schedule | <code>String</code> | The CRON formatted schedule for the job creation |
| jobs | [<code>Array.&lt;NewJob&gt;</code>](#NewJob) | An array of job templates |
| enabled | <code>Boolean</code> | Whether the task is enabled or not |

<a name="ScheduledTask"></a>

## ScheduledTask : [<code>NewScheduledTask</code>](#NewScheduledTask)
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | The ID of the scheduled job |

<a name="UpdateTaskPropertiesOptions"></a>

## UpdateTaskPropertiesOptions : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [title] | <code>String</code> | The title of the task |
| [schedule] | <code>String</code> | The schedule of the task (CRON) |

<a name="ServiceOptions"></a>

## ServiceOptions : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [artifactManager] | <code>ArtifactManager</code> | Override for the ArtifactManager instance |
| [enableScheduling] | <code>Boolean</code> | Control whether or not the scheduling piece of the Service  is enabled or not. Default is true. |

<a name="GetJobChildrenOptions"></a>

## GetJobChildrenOptions : <code>Object</code>
Options for fetching job children

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [fullProgeny] | <code>Boolean</code> | Fetch the full progeny of the job  (all of the children and their children) |

<a name="GetJobParentsOptions"></a>

## GetJobParentsOptions : <code>Object</code>
Options for fetching job parents

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [fullAncestry] | <code>Boolean</code> | Fetch the full fullAncestry of the job  (all of the parents and their parents) |

<a name="GetJobTreeOptions"></a>

## GetJobTreeOptions : <code>Object</code>
Options for fetching a job tree

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [resolveParents] | <code>Boolean</code> | Fetch the ancestry of the specified  job, not just the children. Defaults to true (full tree). |

<a name="QueryJobsOptions"></a>

## QueryJobsOptions : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [limit] | <code>Number</code> | Limit the number of jobs that are returned by the  query. Defaults to Infinity. |
| [sort] | <code>String</code> | Property to sort by. Defaults to "created". Can be  set to created/status/priority/type. |
| [order] | <code>String</code> | Sorting order: asc/desc (default "desc") |
| [start] | <code>Number</code> | The starting offset (index) for when to start  collecting search results. Should be used together with `limit` to perform  pagination. Defaults to 0. |

<a name="StartJobOptions"></a>

## StartJobOptions : <code>Object</code>
Start job options

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [executePredicate] | <code>Boolean</code> | Execute the predicate function  before running the task |

<a name="UpdateJobOptions"></a>

## UpdateJobOptions : <code>Object</code>
Update job options

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [filterProps] | <code>Boolean</code> | Filter all properties that should  NOT be overwritten. This is true by default. Using 'false' here may  result in unpredictable and dangerous behaviour. Use at our own  peril. |
| [stripResults] | <code>Boolean</code> | Remove existing results before  updating the job data. Default is false. |

<a name="MemoryStorageOptions"></a>

## MemoryStorageOptions : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| fileStorage | <code>FileStorage</code> \| <code>null</code> | Optional filestorage reference  for sync'ing memory -> file system |
| [flushDelay] | <code>Number</code> | Delay in milliseconds between flushing  the memory to disk |

<a name="ResultType"></a>

## ResultType : <code>String</code>
Job result type

**Kind**: global typedef  
<a name="Status"></a>

## Status : <code>String</code>
Job status

**Kind**: global typedef  
<a name="Priority"></a>

## Priority : <code>String</code>
Job priority

**Kind**: global typedef  
<a name="JobImportTemplateItem"></a>

## JobImportTemplateItem : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| type | <code>String</code> | The new job type |
| [data] | <code>Object</code> | Data payload for the new job |
| [condition] | <code>Object</code> | Optionally trigger this job only under certain  conditions |
| condition.ifset | <code>String</code> \| <code>Array.&lt;String&gt;&#x3D;</code> | Trigger this job only if all  mentioned macro properties are SET (not undefined) |
| condition.ifnotset | <code>String</code> \| <code>Array.&lt;String&gt;&#x3D;</code> | Trigger this job only if  none of the mentioned macro properties are SET |
| condition.ifeq | <code>Object</code> | Trigger this job of all properties of this  object (key, value) are preset and matching on the macro properties |
| [repeat] | <code>String</code> | Repeat on the property mentioned, that exists  within the macro properties, which is an array |

<a name="JobImportTemplate"></a>

## JobImportTemplate : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| template | [<code>Array.&lt;JobImportTemplateItem&gt;</code>](#JobImportTemplateItem) | An array of jobs |
| items | <code>Array.&lt;Object&gt;</code> | An array of macro values for the template |
| [base] | <code>Object</code> | Optional base configuration |
| [base.tag] | <code>String</code> | Optional tag to attach to all job data payloads |

<a name="TrackerJobStats"></a>

## TrackerJobStats : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| totalJobs | <code>Number</code> | Total number of jobs |
| stoppedJobs | <code>Number</code> | Total number of currently stopped jobs |
| runningJobs | <code>Number</code> | Total number of currently running jobs |
| pendingJobs | <code>Number</code> | Total number of currently pending jobs |
| succeededJobs | <code>Number</code> | Total succeeded jobs |
| failedJobs | <code>Number</code> | Total failed jobs |
| jobsInLastHour | <code>Number</code> | Total number of jobs completed successfully in the last hour |

<a name="RegisteredWorker"></a>

## RegisteredWorker : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | The worker ID |
| updated | <code>Number</code> | The last updated timestamp |
| count | <code>Number</code> | The number of times the worker has updated |

