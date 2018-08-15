## Classes

<dl>
<dt><a href="#Helper">Helper</a></dt>
<dd><p>Helper base class
Helpers provide an easy interface with which to
attach to services to perform ancillary tasks.</p>
</dd>
<dt><a href="#Service">Service</a> ⇐ <code>EventEmitter</code></dt>
<dd><p>Service for managing jobs</p>
</dd>
<dt><a href="#FileStorage">FileStorage</a> ⇐ <code><a href="#MemoryStorage">MemoryStorage</a></code></dt>
<dd><p>File storage interface
Extends memory storage with persistent disk writes so that a
full copy of all jobs is kept on-disk.</p>
</dd>
<dt><a href="#MemoryStorage">MemoryStorage</a> ⇐ <code><a href="#Storage">Storage</a></code></dt>
<dd><p>Memory storage adapter
Stores jobs in memory. Once application is closed all jobs are
purged - do not use this storage if you desire persistence.</p>
</dd>
<dt><a href="#Storage">Storage</a></dt>
<dd><p>Storage base class
Provides a storage mechanism for the job handling framework,
allowing jobs to persist between restarts. This is an
interface and does not actually perform any operations.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#generateEmptyJob">generateEmptyJob()</a> ⇒ <code><a href="#Job">Job</a></code></dt>
<dd><p>Generate an empty job</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#NewJob">NewJob</a> : <code>Object</code></dt>
<dd><p>New job data</p>
</dd>
<dt><a href="#Job">Job</a> : <code>Object</code></dt>
<dd><p>A job</p>
</dd>
<dt><a href="#ResultType">ResultType</a> : <code>String</code></dt>
<dd><p>Job result type</p>
</dd>
<dt><a href="#Status">Status</a> : <code>String</code></dt>
<dd><p>Job status</p>
</dd>
<dt><a href="#Priority">Priority</a> : <code>String</code></dt>
<dd><p>Job priority</p>
</dd>
</dl>

<a name="Helper"></a>

## Helper
Helper base class
Helpers provide an easy interface with which to
attach to services to perform ancillary tasks.

**Kind**: global class  

* [Helper](#Helper)
    * [.service](#Helper+service) : [<code>Service</code>](#Service)
    * [.attach(service)](#Helper+attach)
    * [.shutdown()](#Helper+shutdown)

<a name="Helper+service"></a>

### helper.service : [<code>Service</code>](#Service)
The attached service

**Kind**: instance property of [<code>Helper</code>](#Helper)  
**Read only**: true  
<a name="Helper+attach"></a>

### helper.attach(service)
Attach to a service
This will be called by a Service instance

**Kind**: instance method of [<code>Helper</code>](#Helper)  
**Throws**:

- <code>Error</code> Throws if already attached to a service


| Param | Type | Description |
| --- | --- | --- |
| service | [<code>Service</code>](#Service) | The service to attach to |

<a name="Helper+shutdown"></a>

### helper.shutdown()
Shutdown the helper
This will be called by a Service instance

**Kind**: instance method of [<code>Helper</code>](#Helper)  
<a name="Service"></a>

## Service ⇐ <code>EventEmitter</code>
Service for managing jobs

**Kind**: global class  
**Extends**: <code>EventEmitter</code>  

* [Service](#Service) ⇐ <code>EventEmitter</code>
    * _instance_
        * [.helpers](#Service+helpers) : [<code>Array.&lt;Helper&gt;</code>](#Helper)
        * [.jobQueue](#Service+jobQueue) : <code>Channel</code>
        * [.storage](#Service+storage) : [<code>Storage</code>](#Storage)
        * [.timeLimit](#Service+timeLimit) : <code>Number</code>
        * [.addJob([properties])](#Service+addJob) ⇒ <code>Promise.&lt;String&gt;</code>
        * [.getJob(jobID)](#Service+getJob) ⇒ <code>Promise.&lt;(Object\|null)&gt;</code>
        * [.getNextJob()](#Service+getNextJob) ⇒ <code>Promise.&lt;(Object\|null)&gt;</code>
        * [.queryJobs(query)](#Service+queryJobs) ⇒ <code>Promise.&lt;Array.&lt;Job&gt;&gt;</code>
        * [.initialise()](#Service+initialise) ⇒ <code>Promise</code>
        * [.shutdown()](#Service+shutdown)
        * [.startJob([jobID], [options])](#Service+startJob) ⇒ <code>Promise.&lt;Object&gt;</code>
        * [.stopJob(jobID, resultType, [resultData])](#Service+stopJob) ⇒ <code>Promise</code>
        * [.use(helper)](#Service+use) ⇒ [<code>Service</code>](#Service)
    * _static_
        * [.JobPriority](#Service.JobPriority) : [<code>JobPriorities</code>](#JobPriorities)
        * [.JobResult](#Service.JobResult) : [<code>JobResultTypes</code>](#JobResultTypes)
        * [.JobStatus](#Service.JobStatus) : <code>JobStatus</code>

<a name="Service+helpers"></a>

### service.helpers : [<code>Array.&lt;Helper&gt;</code>](#Helper)
Helpers attached to the Service

**Kind**: instance property of [<code>Service</code>](#Service)  
**Read only**: true  
<a name="Service+jobQueue"></a>

### service.jobQueue : <code>Channel</code>
Execute queue for job manipulations

**Kind**: instance property of [<code>Service</code>](#Service)  
**Read only**: true  
<a name="Service+storage"></a>

### service.storage : [<code>Storage</code>](#Storage)
The storage mechanism used by the Service

**Kind**: instance property of [<code>Service</code>](#Service)  
**Read only**: true  
<a name="Service+timeLimit"></a>

### service.timeLimit : <code>Number</code>
The current default time-limit (milliseconds)
The timelimit is applied to *new* jobs as they're added, and
changes to this value do not affect existing jobs.

**Kind**: instance property of [<code>Service</code>](#Service)  
<a name="Service+addJob"></a>

### service.addJob([properties]) ⇒ <code>Promise.&lt;String&gt;</code>
Add a new job

**Kind**: instance method of [<code>Service</code>](#Service)  
**Returns**: <code>Promise.&lt;String&gt;</code> - A promise that resolves with the job's ID  

| Param | Type | Description |
| --- | --- | --- |
| [properties] | [<code>NewJob</code>](#NewJob) | The new job's properties |

<a name="Service+getJob"></a>

### service.getJob(jobID) ⇒ <code>Promise.&lt;(Object\|null)&gt;</code>
Get a job by its ID

**Kind**: instance method of [<code>Service</code>](#Service)  
**Returns**: <code>Promise.&lt;(Object\|null)&gt;</code> - A promise that resolves with the job
 or null if not found  

| Param | Type | Description |
| --- | --- | --- |
| jobID | <code>String</code> | The job ID |

<a name="Service+getNextJob"></a>

### service.getNextJob() ⇒ <code>Promise.&lt;(Object\|null)&gt;</code>
Get the next job that should be started
This method is expensive as it sorts available jobs by priority first,
before returning the very next job that should be started.

**Kind**: instance method of [<code>Service</code>](#Service)  
**Returns**: <code>Promise.&lt;(Object\|null)&gt;</code> - A promise that resolves with the job
 or null if none available  
<a name="Service+queryJobs"></a>

### service.queryJobs(query) ⇒ <code>Promise.&lt;Array.&lt;Job&gt;&gt;</code>
Perform a jobs query
Query for an array of jobs by the job's properties. This uses a library
called simple-object-query to query each job. This method uses the
library's `find` method.

**Kind**: instance method of [<code>Service</code>](#Service)  
**Returns**: <code>Promise.&lt;Array.&lt;Job&gt;&gt;</code> - Returns a promise that resolves with
 an array of jobs  
**See**: https://www.npmjs.com/package/simple-object-query  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>Object</code> | The object query to perform |

<a name="Service+initialise"></a>

### service.initialise() ⇒ <code>Promise</code>
Initialise the Service instance
Must be called before any other operation

**Kind**: instance method of [<code>Service</code>](#Service)  
**Returns**: <code>Promise</code> - A promise that resolves once initialisation
 has been completed  
<a name="Service+shutdown"></a>

### service.shutdown()
Shutdown the instance

**Kind**: instance method of [<code>Service</code>](#Service)  
<a name="Service+startJob"></a>

### service.startJob([jobID], [options]) ⇒ <code>Promise.&lt;Object&gt;</code>
Start a job

**Kind**: instance method of [<code>Service</code>](#Service)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - A promise that resolves with job data for a
 worker  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [jobID] | <code>String</code> | <code></code> | The job ID to start. If none provided the Service  will attempt to start the next job by priority. If none is found it  will simply resolve with null. If the job ID is specified by not found  an exception will be thrown. |
| [options] | <code>Object</code> |  | Configuration options |

<a name="Service+stopJob"></a>

### service.stopJob(jobID, resultType, [resultData]) ⇒ <code>Promise</code>
Stop a job

**Kind**: instance method of [<code>Service</code>](#Service)  
**Returns**: <code>Promise</code> - A promise that resolves once the job has been
 stopped successfully  

| Param | Type | Description |
| --- | --- | --- |
| jobID | <code>String</code> | The job's ID to stop |
| resultType | [<code>ResultType</code>](#ResultType) | The result type to set |
| [resultData] | <code>Object</code> | Optional results data |

<a name="Service+use"></a>

### service.use(helper) ⇒ [<code>Service</code>](#Service)
Attach a helper to the Service instance

**Kind**: instance method of [<code>Service</code>](#Service)  
**Returns**: [<code>Service</code>](#Service) - Returns self, for chaining  
**Throws**:

- <code>VError</code> Throws if the helper instance is invalid


| Param | Type | Description |
| --- | --- | --- |
| helper | [<code>Helper</code>](#Helper) | The helper to attach |

<a name="Service.JobPriority"></a>

### Service.JobPriority : [<code>JobPriorities</code>](#JobPriorities)
Job priority

**Kind**: static property of [<code>Service</code>](#Service)  
<a name="Service.JobResult"></a>

### Service.JobResult : [<code>JobResultTypes</code>](#JobResultTypes)
Job result type

**Kind**: static property of [<code>Service</code>](#Service)  
<a name="Service.JobStatus"></a>

### Service.JobStatus : <code>JobStatus</code>
Job status

**Kind**: static property of [<code>Service</code>](#Service)  
<a name="FileStorage"></a>

## FileStorage ⇐ [<code>MemoryStorage</code>](#MemoryStorage)
File storage interface
Extends memory storage with persistent disk writes so that a
full copy of all jobs is kept on-disk.

**Kind**: global class  
**Extends**: [<code>MemoryStorage</code>](#MemoryStorage)  

* [FileStorage](#FileStorage) ⇐ [<code>MemoryStorage</code>](#MemoryStorage)
    * [new FileStorage(filename)](#new_FileStorage_new)
    * _instance_
        * [.store](#MemoryStorage+store) : <code>Object</code>
        * [.initialise()](#FileStorage+initialise) ⇒ <code>Promise</code>
        * [.removeItem(key)](#FileStorage+removeItem) ⇒ <code>Promise</code>
        * [.setItem(key, value)](#FileStorage+setItem) ⇒ <code>Promise</code>
        * [._getSerialisedState()](#FileStorage+_getSerialisedState) ⇒ <code>String</code>
        * [._writeStateToFile()](#FileStorage+_writeStateToFile)
        * [.getAllItems()](#MemoryStorage+getAllItems) ⇒ <code>Promise.&lt;Array.&lt;\*&gt;&gt;</code>
        * [.getAllKeys()](#MemoryStorage+getAllKeys) ⇒ <code>Promise.&lt;Array.&lt;String&gt;&gt;</code>
        * [.getItem(key)](#MemoryStorage+getItem) ⇒ <code>Promise.&lt;(\*\|null)&gt;</code>
        * [.getKeyPrefix()](#Storage+getKeyPrefix) ⇒ <code>String</code>
    * _static_
        * [.this.writeStateToFile](#FileStorage.this.writeStateToFile) : <code>function</code>

<a name="new_FileStorage_new"></a>

### new FileStorage(filename)
Constructor for the FileStorage adapter


| Param | Type | Description |
| --- | --- | --- |
| filename | <code>String</code> | The filename to store the state in |

<a name="MemoryStorage+store"></a>

### fileStorage.store : <code>Object</code>
The job store

**Kind**: instance property of [<code>FileStorage</code>](#FileStorage)  
<a name="FileStorage+initialise"></a>

### fileStorage.initialise() ⇒ <code>Promise</code>
Initialise the file storage
This method reads the contents of the file into memory

**Kind**: instance method of [<code>FileStorage</code>](#FileStorage)  
**Overrides**: [<code>initialise</code>](#Storage+initialise)  
**Returns**: <code>Promise</code> - A promise that resolves once the cached
 file storage is loaded  
<a name="FileStorage+removeItem"></a>

### fileStorage.removeItem(key) ⇒ <code>Promise</code>
Remove an item from storage

**Kind**: instance method of [<code>FileStorage</code>](#FileStorage)  
**Overrides**: [<code>removeItem</code>](#MemoryStorage+removeItem)  
**Returns**: <code>Promise</code> - A promise that resolves once the item
 has been removed  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The key to remove |

<a name="FileStorage+setItem"></a>

### fileStorage.setItem(key, value) ⇒ <code>Promise</code>
Set an item in storage

**Kind**: instance method of [<code>FileStorage</code>](#FileStorage)  
**Overrides**: [<code>setItem</code>](#MemoryStorage+setItem)  
**Returns**: <code>Promise</code> - A promise that resolves once the
 value has been stored  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The key to set |
| value | <code>\*</code> | The value to store |

<a name="FileStorage+_getSerialisedState"></a>

### fileStorage._getSerialisedState() ⇒ <code>String</code>
Get the serialised state

**Kind**: instance method of [<code>FileStorage</code>](#FileStorage)  
**Returns**: <code>String</code> - The state in serialised form  
**Access**: protected  
<a name="FileStorage+_writeStateToFile"></a>

### fileStorage._writeStateToFile()
Write the state to a file
Enqueues write operations for storing the state in
the specified file

**Kind**: instance method of [<code>FileStorage</code>](#FileStorage)  
**Access**: protected  
<a name="MemoryStorage+getAllItems"></a>

### fileStorage.getAllItems() ⇒ <code>Promise.&lt;Array.&lt;\*&gt;&gt;</code>
Get all items in the storage

**Kind**: instance method of [<code>FileStorage</code>](#FileStorage)  
**Returns**: <code>Promise.&lt;Array.&lt;\*&gt;&gt;</code> - A promise that resolves with all items  
<a name="MemoryStorage+getAllKeys"></a>

### fileStorage.getAllKeys() ⇒ <code>Promise.&lt;Array.&lt;String&gt;&gt;</code>
Get all storage keys

**Kind**: instance method of [<code>FileStorage</code>](#FileStorage)  
**Returns**: <code>Promise.&lt;Array.&lt;String&gt;&gt;</code> - A promise that resolves with an array of
 all the keys in storage  
<a name="MemoryStorage+getItem"></a>

### fileStorage.getItem(key) ⇒ <code>Promise.&lt;(\*\|null)&gt;</code>
Get an item's value

**Kind**: instance method of [<code>FileStorage</code>](#FileStorage)  
**Returns**: <code>Promise.&lt;(\*\|null)&gt;</code> - A promise that resolves with the value of
 the key or null if not found  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | Get the value of a key |

<a name="Storage+getKeyPrefix"></a>

### fileStorage.getKeyPrefix() ⇒ <code>String</code>
Get the base key prefix
This prefix is prepended to all keys before writing to storage

**Kind**: instance method of [<code>FileStorage</code>](#FileStorage)  
<a name="FileStorage.this.writeStateToFile"></a>

### FileStorage.this.writeStateToFile : <code>function</code>
Debounced method for writing to the file

**Kind**: static property of [<code>FileStorage</code>](#FileStorage)  
**See**: _writeStateToFile  
<a name="MemoryStorage"></a>

## MemoryStorage ⇐ [<code>Storage</code>](#Storage)
Memory storage adapter
Stores jobs in memory. Once application is closed all jobs are
purged - do not use this storage if you desire persistence.

**Kind**: global class  
**Extends**: [<code>Storage</code>](#Storage)  

* [MemoryStorage](#MemoryStorage) ⇐ [<code>Storage</code>](#Storage)
    * [.store](#MemoryStorage+store) : <code>Object</code>
    * [.getAllItems()](#MemoryStorage+getAllItems) ⇒ <code>Promise.&lt;Array.&lt;\*&gt;&gt;</code>
    * [.getAllKeys()](#MemoryStorage+getAllKeys) ⇒ <code>Promise.&lt;Array.&lt;String&gt;&gt;</code>
    * [.getItem(key)](#MemoryStorage+getItem) ⇒ <code>Promise.&lt;(\*\|null)&gt;</code>
    * [.removeItem(key)](#MemoryStorage+removeItem) ⇒ <code>Promise</code>
    * [.setItem(key, value)](#MemoryStorage+setItem) ⇒ <code>Promise</code>
    * [.getKeyPrefix()](#Storage+getKeyPrefix) ⇒ <code>String</code>
    * [.initialise()](#Storage+initialise) ⇒ <code>Promise</code>

<a name="MemoryStorage+store"></a>

### memoryStorage.store : <code>Object</code>
The job store

**Kind**: instance property of [<code>MemoryStorage</code>](#MemoryStorage)  
<a name="MemoryStorage+getAllItems"></a>

### memoryStorage.getAllItems() ⇒ <code>Promise.&lt;Array.&lt;\*&gt;&gt;</code>
Get all items in the storage

**Kind**: instance method of [<code>MemoryStorage</code>](#MemoryStorage)  
**Overrides**: [<code>getAllItems</code>](#Storage+getAllItems)  
**Returns**: <code>Promise.&lt;Array.&lt;\*&gt;&gt;</code> - A promise that resolves with all items  
<a name="MemoryStorage+getAllKeys"></a>

### memoryStorage.getAllKeys() ⇒ <code>Promise.&lt;Array.&lt;String&gt;&gt;</code>
Get all storage keys

**Kind**: instance method of [<code>MemoryStorage</code>](#MemoryStorage)  
**Overrides**: [<code>getAllKeys</code>](#Storage+getAllKeys)  
**Returns**: <code>Promise.&lt;Array.&lt;String&gt;&gt;</code> - A promise that resolves with an array of
 all the keys in storage  
<a name="MemoryStorage+getItem"></a>

### memoryStorage.getItem(key) ⇒ <code>Promise.&lt;(\*\|null)&gt;</code>
Get an item's value

**Kind**: instance method of [<code>MemoryStorage</code>](#MemoryStorage)  
**Overrides**: [<code>getItem</code>](#Storage+getItem)  
**Returns**: <code>Promise.&lt;(\*\|null)&gt;</code> - A promise that resolves with the value of
 the key or null if not found  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | Get the value of a key |

<a name="MemoryStorage+removeItem"></a>

### memoryStorage.removeItem(key) ⇒ <code>Promise</code>
Remove an item from the memory store

**Kind**: instance method of [<code>MemoryStorage</code>](#MemoryStorage)  
**Overrides**: [<code>removeItem</code>](#Storage+removeItem)  
**Returns**: <code>Promise</code> - A promise that resolves once the key has been removed  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The key of the item to remove |

<a name="MemoryStorage+setItem"></a>

### memoryStorage.setItem(key, value) ⇒ <code>Promise</code>
Set an item in the memory store

**Kind**: instance method of [<code>MemoryStorage</code>](#MemoryStorage)  
**Overrides**: [<code>setItem</code>](#Storage+setItem)  
**Returns**: <code>Promise</code> - Returns a promise that resolves once the item has
 been stored  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The key to store under |
| value | <code>\*</code> | The value to store |

<a name="Storage+getKeyPrefix"></a>

### memoryStorage.getKeyPrefix() ⇒ <code>String</code>
Get the base key prefix
This prefix is prepended to all keys before writing to storage

**Kind**: instance method of [<code>MemoryStorage</code>](#MemoryStorage)  
<a name="Storage+initialise"></a>

### memoryStorage.initialise() ⇒ <code>Promise</code>
Initialise the storage
This usually entails reading the store from the storage so that it is
immediately available

**Kind**: instance method of [<code>MemoryStorage</code>](#MemoryStorage)  
**Returns**: <code>Promise</code> - A promise that resolves once initialisation has
 completed  
<a name="Storage"></a>

## Storage
Storage base class
Provides a storage mechanism for the job handling framework,
allowing jobs to persist between restarts. This is an
interface and does not actually perform any operations.

**Kind**: global class  

* [Storage](#Storage)
    * [.getAllItems()](#Storage+getAllItems) ⇒ <code>Promise.&lt;Array.&lt;\*&gt;&gt;</code>
    * [.getAllKeys()](#Storage+getAllKeys) ⇒ <code>Promise.&lt;Array.&lt;String&gt;&gt;</code>
    * [.getItem(key)](#Storage+getItem) ⇒ <code>Promise.&lt;(\*\|null)&gt;</code>
    * [.getKeyPrefix()](#Storage+getKeyPrefix) ⇒ <code>String</code>
    * [.initialise()](#Storage+initialise) ⇒ <code>Promise</code>
    * [.removeItem(key)](#Storage+removeItem) ⇒ <code>Promise</code>
    * [.setItem(key, value)](#Storage+setItem) ⇒ <code>Promise</code>

<a name="Storage+getAllItems"></a>

### storage.getAllItems() ⇒ <code>Promise.&lt;Array.&lt;\*&gt;&gt;</code>
Get all items in the storage
EXPENSIVE: Returns all items in storage

**Kind**: instance method of [<code>Storage</code>](#Storage)  
**Returns**: <code>Promise.&lt;Array.&lt;\*&gt;&gt;</code> - A promise that resolves with all items  
<a name="Storage+getAllKeys"></a>

### storage.getAllKeys() ⇒ <code>Promise.&lt;Array.&lt;String&gt;&gt;</code>
Get all keys in the storage

**Kind**: instance method of [<code>Storage</code>](#Storage)  
**Returns**: <code>Promise.&lt;Array.&lt;String&gt;&gt;</code> - A promise that resolves with an array of
 all the keys  
<a name="Storage+getItem"></a>

### storage.getItem(key) ⇒ <code>Promise.&lt;(\*\|null)&gt;</code>
Get an item by its key

**Kind**: instance method of [<code>Storage</code>](#Storage)  
**Returns**: <code>Promise.&lt;(\*\|null)&gt;</code> - A promise that resolves with the item, or
 null if the item doesn't exist  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The key to fetch |

<a name="Storage+getKeyPrefix"></a>

### storage.getKeyPrefix() ⇒ <code>String</code>
Get the base key prefix
This prefix is prepended to all keys before writing to storage

**Kind**: instance method of [<code>Storage</code>](#Storage)  
<a name="Storage+initialise"></a>

### storage.initialise() ⇒ <code>Promise</code>
Initialise the storage
This usually entails reading the store from the storage so that it is
immediately available

**Kind**: instance method of [<code>Storage</code>](#Storage)  
**Returns**: <code>Promise</code> - A promise that resolves once initialisation has
 completed  
<a name="Storage+removeItem"></a>

### storage.removeItem(key) ⇒ <code>Promise</code>
Remove an item from storage

**Kind**: instance method of [<code>Storage</code>](#Storage)  
**Returns**: <code>Promise</code> - A promise that resolves once the key has been removed  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The key to remove |

<a name="Storage+setItem"></a>

### storage.setItem(key, value) ⇒ <code>Promise</code>
Set an item

**Kind**: instance method of [<code>Storage</code>](#Storage)  
**Returns**: <code>Promise</code> - A promise that resolves once the value has been
 stored  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | The key to set the value for |
| value | <code>\*</code> | The value to set |

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

<a name="Job"></a>

## Job : <code>Object</code>
A job

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | The job's ID |
| chain | <code>Array.&lt;String&gt;</code> | An array of IDs that form the job's chain |
| type | <code>String</code> | The job type (consumer controlled) |
| status | [<code>Status</code>](#Status) | The current job state |
| priority | [<code>Priority</code>](#Priority) | The job's priority |
| created | <code>Number</code> | The creation timestamp of the job |
| parents | <code>Array.&lt;String&gt;</code> | An array of IDs of the job's parents |
| predicate | <code>String</code> | Predicate function for the job |
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
| attemptsMax | <code>Number</code> | Maximum attempts that can be undertaken  on the job before it is failed |

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
