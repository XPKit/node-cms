/**
 * @fileoverview Lightweight API driver for building method-based APIs with hooks and middleware
 * Contains consolidated Events, Context, and Driver classes in a single file
 */

const _ = require('lodash')
const ImageOptimization = require('../imageOptimization')
// const through = require('through')
const pAll = require('p-all')
const h = require('../../helpers')
const fs = require('fs-extra')
const path = require('path')


/**
 * @typedef {Object} ResourceAPIContext
 * @property {Object} params - Method parameters
 * @property {Object} resource - The resource instance
 * @property {Object} methods - Reference to other API methods
 * @property {Function} next - Continue to next middleware/hook
 * @property {Function} result - Set the result value
 * @property {Function} error - Set an error
 * @property {Function} end - End execution
 */

// =============================================================================
// Events Module (formerly events.js)
// =============================================================================

// Regular expression used to split event strings
const eventSplitter = /\s+/

/**
 * Event system module that can be mixed into any object to provide custom events
 * Based on Backbone.Events pattern
 */
const Events = {
  /**
   * Bind one or more space separated events to a callback function
   * @param {string} events - Space-separated event names
   * @param {Function} callback - Callback function to execute
   * @param {Object} [context] - Context to bind the callback to
   * @returns {Object} Returns this for chaining
   */
  on(events, callback, context) {
    let calls, event, list
    if (!callback) {
      return this
    }
    events = events.split(eventSplitter)
    calls = this._callbacks || (this._callbacks = {})
    for (let i = 0; i < events.length; i++) {
      event = events[i]
      list = calls[event] || (calls[event] = [])
      list.push(callback, context)
    }
    return this
  },

  /**
   * Remove one or many callbacks
   * @param {string} [events] - Event names to remove callbacks from
   * @param {Function} [callback] - Specific callback to remove
   * @param {Object} [context] - Context to match for removal
   * @returns {Object} Returns this for chaining
   */
  off(events, callback, context) {
    let event, calls, list
    // No events, or removing *all* events
    if (!(calls = this._callbacks)) {
      return this
    }
    if (!(events || callback || context)) {
      delete this._callbacks
      return this
    }
    events = events ? events.split(eventSplitter) : Object.keys(calls)
    // Loop through the callback list, splicing where appropriate
    for (let i = 0; i < events.length; i++) {
      event = events[i]
      list = calls[event]
      if (!list || !(callback || context)) {
        delete calls[event]
        continue
      }
      for (let j = list.length - 2; j >= 0; j -= 2) {
        if (!(callback && list[j] !== callback || context && list[j + 1] !== context)) {
          list.splice(j, 2)
        }
      }
    }
    return this
  },

  /**
   * Trigger one or many events, firing all bound callbacks
   * @param {string} events - Space-separated event names to trigger
   * @param {...*} args - Arguments to pass to callbacks
   * @returns {Object} Returns this for chaining
   */
  trigger(events) {
    let event, calls, list, i, length, args, all, rest
    if (!(calls = this._callbacks)) {
      return this
    }
    rest = []
    events = events.split(eventSplitter)
    // Fill up `rest` with the callback arguments
    for (i = 1, length = arguments.length; i < length; i++) {
      rest[i - 1] = arguments[i]
    }
    // For each event, walk through the list of callbacks
    for (let i = 0; i < events.length; i++) {
      event = events[i]
      // Copy callback lists to prevent modification
      all = calls.all
      if (all) {
        all = all.slice()
      }
      list = calls[event]
      if (list) {
        list = list.slice()
      }
      // Execute event callbacks
      if (list) {
        for (let j = 0, len = list.length; j < len; j += 2) {
          list[j].apply(list[j + 1] || this, rest)
        }
      }
      // Execute "all" callbacks
      if (all) {
        args = [event].concat(rest)
        for (let j = 0, len = all.length; j < len; j += 2) {
          all[j].apply(all[j + 1] || this, args)
        }
      }
    }
    return this
  }
}

// Aliases for backwards compatibility
Events.bind = Events.on
Events.unbind = Events.off

// =============================================================================
// Context Class (formerly context.js)
// =============================================================================

/**
 * Context object that provides execution context for driver methods
 * Contains parameters, state management, and event handling
 * @class Context
 */
class Context {
  /**
   * Creates a new Context instance
   * @param {Object} params - Method parameters
   * @param {Object} endpoint - Method endpoint definition
   * @param {Driver} driver - Driver instance
   */
  constructor(params, endpoint, driver) {
    this.options = driver.options
    this.params = params
    this.endpoint = endpoint
    this.driver = driver
  }

  /**
   * Fire 'next' event to continue pipeline execution
   */
  next() {
    this.trigger('next', this)
  }

  /**
   * Set result and interrupt chain processing
   * @param {*} result - The result value to set
   * @returns {Context} Returns this context for chaining
   */
  result(result) {
    this._result = result
    this.trigger('result', result, this)
    this.end()
    return this
  }

  /**
   * Set error and interrupt chain processing
   * @param {Error|string} error - The error to set
   * @returns {Context} Returns this context for chaining
   */
  error(error) {
    this._error = error
    this.trigger('error', error, this)
    this.end()
    return this
  }

  /**
   * End context execution and remove all event listeners
   */
  end() {
    this.trigger('end', this)
    this.off()
  }

  /**
   * Get the current result value
   * @returns {*} The result value or null if undefined
   */
  getResult() {
    return (this._result === void 0) ? null : this._result
  }

  /**
   * Get the current error value
   * @returns {Error|string|null} The error value or null if undefined
   */
  getError() {
    return (this._error === void 0) ? null : this._error
  }
}

// Extend Context with Events functionality
_.extend(Context.prototype, Events)

// =============================================================================
// Driver Class (main driver functionality)
// =============================================================================

/**
 * Lightweight API driver that provides method definition, middleware, and hook support
 * @class Driver
 */
class Driver {
  /**
   * Creates a new Driver instance
   * @param {string} name - The name of the driver
   * @param {Object} [options] - Optional configuration options
   *
   * @example
   * const driver = new Driver('myAPI', { timeout: 5000 })
   *
   * // Can also be called without 'new'
   * const driver = Driver('myAPI', { timeout: 5000 })
   */
  constructor(name, options) {
    this.options = options
    this.name = name
    this._middleware = []
    this._methods = {}
    this._hooks = {
      before: [],
      after: []
    }
  }

  /**
   * Get or create a method definition
   * @private
   * @param {string} name - The method name
   * @returns {Object} The method definition object
   */
  _method(name) {
    this._methods[name] = this._methods[name] || {
      name,
      before: [],
      invoke: null,
      after: [],
      params: undefined
    }
    return this._methods[name]
  }

  /**
   * Add middleware to the driver that runs before all methods
   * @param {Function} middleware - Middleware function that receives a context parameter
   * @returns {Driver} Returns this driver instance for chaining
   * @throws {Error} If middleware is not a function
   *
   * @example
   * driver.use((context) => {
   *   console.log('Before method:', context.method.name)
   *   context.next()
   * })
   */
  use(middleware) {
    if (!_.isFunction(middleware)) {
      throw new Error('`use` expects a function')
    }
    this._middleware.push(middleware)
    return this
  }

  /**
   * Define a new driver method with optional parameter validation
   * @param {string} name - The method name
   * @param {string[]|Function} [params] - Parameter names array (optional parameters end with '?')
   * @param {Function} fn - The method implementation function that receives a context parameter
   * @returns {Driver} Returns this driver instance for chaining
   * @throws {Error} If method name is not defined or function is not provided
   *
   * @example
   * // Simple method without parameter validation
   * driver.define('list', function(context) {
   *   // Implementation
   *   context.result(data)
   * })
   *
   * // Method with parameter validation
   * driver.define('find', ['id', 'options?'], function(context) {
   *   const { id, options } = context.params
   *   // Implementation
   *   context.result(foundItem)
   * })
   */
  define() {
    const args = Array.prototype.slice.call(arguments)
    if (!_.isString(args[0])) {
      throw new Error('method name is not defined')
    }
    const name = args.shift()
    if (_.isArray(args[0])) {
      this._method(name).params = args.shift()
    }
    if (!_.isFunction(args[0])) {
      throw new Error('method body is not defined')
    } else {
      this._method(name).invoke = args[0]
    }
    return this
  }

  /**
   * Add a before hook for a specific method
   * @param {string} name - The method name to add the hook to
   * @param {Function} fn - Hook function that receives a context parameter
   * @returns {Driver} Returns this driver instance for chaining
   * @throws {Error} If hook is not a function
   *
   * @example
   * driver.before('find', (context) => {
   *   console.log('About to find:', context.params.id)
   *   context.next()
   * })
   */
  before(name, fn) {
    if (!_.isFunction(fn)) {
      throw new Error('`hook` expects a function')
    }
    this._method(name).before.push(fn)
    return this
  }

  /**
   * Add an after hook for a specific method
   * @param {string} name - The method name to add the hook to
   * @param {Function} fn - Hook function that receives a context parameter
   * @returns {Driver} Returns this driver instance for chaining
   * @throws {Error} If hook is not a function
   *
   * @example
   * driver.after('find', (context) => {
   *   console.log('Found result:', context.getResult())
   *   context.next()
   * })
   */
  after(name, fn) {
    if (!_.isFunction(fn)) {
      throw new Error('`hook` expects a function')
    }
    this._method(name).after.unshift(fn)
    return this
  }

  /**
   * Add a before hook that runs before all methods
   * @param {Function} fn - Hook function that receives a context parameter
   * @returns {Driver} Returns this driver instance for chaining
   * @throws {Error} If hook is not a function
   *
   * @example
   * driver.beforeAll((context) => {
   *   console.log('Before any method execution')
   *   context.next()
   * })
   */
  beforeAll(fn) {
    if (!_.isFunction(fn)) {
      throw new Error('`hook` expects a function')
    }
    this._hooks.before.push(fn)
    return this
  }

  /**
   * Add an after hook that runs after all methods
   * @param {Function} fn - Hook function that receives a context parameter
   * @returns {Driver} Returns this driver instance for chaining
   * @throws {Error} If hook is not a function
   *
   * @example
   * driver.afterAll((context) => {
   *   console.log('After any method execution')
   *   context.next()
   * })
   */
  afterAll(fn) {
    if (!_.isFunction(fn)) {
      throw new Error('`hook` expects a function')
    }
    this._hooks.after.unshift(fn)
    return this
  }

  /**
   * Build the final API object from the driver configuration
   * Creates executable methods with full middleware and hook pipeline
   * @returns {Object} The built API object with all defined methods
   *
   * @example
   * const api = driver.build()
   *
   * // Use the built API
   * const result = await api.find('user-123')
   *
   * // Or with callback
   * api.find('user-123', (error, result) => {
   *   if (error) throw error
   *   console.log(result)
   * })
   */
  build() {
    let api = {}
    let self = this
    const hooks = {
      middleware: [],
      beforeAll: [],
      before: {},
      after: {},
      afterAll: []
    }
    /**
     * Add runtime middleware to the built API
     * @param {Function} fn - Middleware function
     */
    api.use = function (fn) {
      hooks.middleware.push(fn)
    }
    /**
     * Add runtime before hook to a specific method
     * @param {string} name - Method name
     * @param {Function} fn - Hook function
     */
    api.before = function (name, fn) {
      hooks.before[name] = hooks.before[name] || []
      hooks.before[name].push(fn)
    }
    /**
     * Add runtime after hook to a specific method
     * @param {string} name - Method name
     * @param {Function} fn - Hook function
     */
    api.after = function (name, fn) {
      hooks.after[name] = hooks.after[name] || []
      hooks.after[name].unshift(fn)
    }
    /**
     * Add runtime before hook that runs before all methods
     * @param {Function} fn - Hook function
     */
    api.beforeAll = function (fn) {
      hooks.beforeAll.push(fn)
    }
    /**
     * Add runtime after hook that runs after all methods
     * @param {Function} fn - Hook function
     */
    api.afterAll = function (fn) {
      hooks.afterAll.unshift(fn)
    }
    // Build each defined method
    _.each(this._methods, (method, name) => {
      if (!method.invoke) {
        return
      }
      /**
       * Generated API method
       * @param {...*} args - Method arguments (last can be callback function)
       * @returns {Promise} Promise that resolves with method result
       */
      api[name] = function () {
        return new Promise((resolve, reject) => {
          let args = Array.prototype.slice.call(arguments)
          let params = {}
          let callback
          // Extract callback if provided
          if (_.isFunction(args[args.length - 1])) {
            let func = args.pop()
            callback = (error, result) => {
              if (error) {
                reject(error)
              } else {
                resolve(result)
              }
              func(error, result)
            }
          } else {
            callback = (error, result) => {
              if (error) {
                reject(error)
              } else {
                resolve(result)
              }
            }
          }
          // Validate parameters if defined
          if (method.params) {
            const missing = _.find(method.params, (param, index) => {
              let optional = false
              if (param.indexOf('?') > -1) {
                optional = true
                param = param.split('?')[0]
              }
              const value = args[index]
              if (_.isUndefined(value)) {
                if (optional !== true) {
                  return true
                }
              }
              params[param] = value
              return false
            })
            if (missing) {
              callback(`Parameter [${missing}] is missing`)
              return
            }
          } else {
            params = args
          }
          // Build execution pipeline
          const pipe = [].concat(
            self._middleware,
            hooks.middleware,
            self._hooks.before,
            hooks.beforeAll,
            hooks.before[name] || [],
            method.before,
            method.invoke
          )
          let context = new Context(params, method, self)
          context.methods = api
          let index = 0
          // Handle pipeline progression
          context.on('next', () => {
            index++
            if (pipe[index]) {
              pipe[index](context)
            } else {
              context.end()
            }
          })
          // Handle pipeline completion
          context.on('end', () => {
            if (context.getError()) {
              return callback(context.getError(), context.getResult())
            }
            // Execute after hooks
            const afterHooks = [].concat(
              method.after,
              hooks.after[name] || [],
              hooks.afterAll,
              self._hooks.after
            )
            if (afterHooks.length) {
              const error = context.getError()
              const result = context.getResult()
              context = new Context(params, method, self)
              context._error = error
              context._result = result
              index = 0
              context.on('next', () => {
                index++
                if (afterHooks[index]) {
                  afterHooks[index](context)
                } else {
                  context.end()
                }
              })
              context.on('end', () => {
                callback(context.getError(), context.getResult())
              })
              afterHooks[index](context)
            } else {
              callback(context.getError(), context.getResult())
            }
          })
          // Start pipeline execution
          pipe[index](context)
        })
      }
    })
    return api
  }

  /**
   * Static method: Read records as a stream with filtering
   * @static
   * @param {Object} resource - The resource instance
   * @param {Object} [query] - Query parameters
   * @param {Object} [options] - Options
   * @returns {Promise<ReadableStream>} Stream of records
   */
  static async read(resource, query, options) {
    return resource.read(query, options)
  }

  /**
   * Static method: List all records matching the query
   * @static
   * @param {Object} resource - The resource instance
   * @param {Object} [query] - MongoDB-style query object
   * @param {Object} [options] - Query options
   * @returns {Promise<Array<Object>>} Array of matching records
   */
  static async list(resource, query, options) {
    return resource.list(query, options)
  }

  /**
   * Static method: Find a single record by ID or query
   * @static
   * @param {Object} resource - The resource instance
   * @param {string|Object} query - Record ID or query object
   * @param {Object} [options] - Query options
   * @returns {Promise<Object>} The matching record
   */
  static async find(resource, query, options) {
    return resource.find(query, options)
  }

  /**
   * Static method: Check if a record exists
   * @static
   * @param {Object} resource - The resource instance
   * @param {string|Object} query - Record ID or query object
   * @returns {Promise<boolean>} True if record exists
   */
  static async exists(resource, query) {
    return resource.exists(query)
  }

  /**
   * Static method: Create a new record
   * @static
   * @param {Object} resource - The resource instance
   * @param {Object} object - Record data to create
   * @param {Object} [options] - Creation options
   * @returns {Promise<Object>} The created record
   */
  static async create(resource, object, options) {
    return resource.create(object, options)
  }

  /**
   * Static method: Update an existing record
   * @static
   * @param {Object} resource - The resource instance
   * @param {string} id - Record ID
   * @param {Object} object - Updated record data
   * @param {Object} [options] - Update options
   * @returns {Promise<Object>} The updated record
   */
  static async update(resource, id, object, options) {
    return resource.update(id, object, options)
  }

  /**
   * Static method: Remove a record
   * @static
   * @param {Object} resource - The resource instance
   * @param {string} id - Record ID
   * @returns {Promise<Object>} The removed record
   */
  static async remove(resource, id) {
    return resource.remove(id)
  }

  /**
   * Static method: Create an attachment for a record
   * @static
   * @param {Object} resource - The resource instance
   * @param {string} id - Record ID
   * @param {Object} attachmentData - Attachment data
   * @returns {Promise<Object>} The created attachment
   */
  static async createAttachment(resource, id, attachmentData) {
    return resource.createAttachment(id, attachmentData)
  }

  /**
   * Static method: Update an attachment
   * @static
   * @param {Object} resource - The resource instance
   * @param {string} id - Record ID
   * @param {string} aid - Attachment ID
   * @param {Object} object - Updated attachment data
   * @returns {Promise<Object>} The updated attachment
   */
  static async updateAttachment(resource, id, aid, object) {
    return resource.updateAttachment(id, aid, object)
  }

  /**
   * Static method: Find a file by attachment ID
   * @static
   * @param {Object} resource - The resource instance
   * @param {string} aid - Attachment ID
   * @returns {Promise<ReadableStream>} The file stream
   */
  static async findFile(resource, aid) {
    return resource.findFile(aid)
  }

  /**
   * Static method: Find an attachment by record and attachment ID
   * @static
   * @param {Object} resource - The resource instance
   * @param {string} id - Record ID
   * @param {string} aid - Attachment ID
   * @param {Object} [opts] - Optional options i.e {resize: '100xauto'}
   * @returns {Promise<Object>} The attachment with stream
   */
  static async findAttachment(resource, id, aid, opts = false) {
    return resource.findAttachment(id, aid, opts)
  }

  /**
   * Static method: Remove an attachment
   * @static
   * @param {Object} resource - The resource instance
   * @param {string} id - Record ID
   * @param {string} aid - Attachment ID
   * @returns {Promise<boolean>} True if removal was successful
   */
  static async removeAttachment(resource, id, aid) {
    return resource.removeAttachment(id, aid)
  }

  /**
   * Static method: Clean unused attachments
   * @static
   * @param {Object} resource - The resource instance
   * @returns {Promise<boolean>} True if cleanup was successful
   */
  static async cleanAttachment(resource) {
    return resource.cleanAttachment()
  }

  /**
   * Clean all cached versions of an attachment
   * @static
   * @param {Object} resource - The resource instance
   * @param {string} attachmentId - The attachment ID
   * @returns {Promise} Promise that resolves when cleanup is complete
   */
  static async cleanAttachmentCache(resource, attachmentId) {
    const aidList = await resource.file.list()
    const cachedVersions = _.filter(aidList, aid =>
      aid.startsWith(`${attachmentId}-`) && aid !== attachmentId
    )
    if (cachedVersions.length === 0) {
      return
    }
    console.log(`Cleaning ${cachedVersions.length} cached versions for attachment ${attachmentId}`)
    pAll(_.map(cachedVersions, cacheId => {
      return async () => {
        try {
          await resource.file.remove(cacheId)
          console.log(`Removed cached version: ${cacheId}`)
        } catch (error) {
          console.error(`Failed to remove cached version ${cacheId}:`, error)
        }
      }
    }), {concurrency: 5})
  }

  /**
   * Read operation implementation
   * @static
   * @param {Object} context - Execution context
   * @returns {Promise} Promise that resolves when operation completes
   */
  static async _readImpl(context) {
    const mid = context.options.cms.mid
    let results = await context.resource.json.read(context.params.query, context.params.options)
    // Ensure results is always an array of valid objects
    if (!_.isArray(results)) {
      if (results && _.isObject(results) && results._id) {
        results = [results]
      } else {
        results = []
      }
    }
    // Only set _local on objects with _id
    results = _.filter(results, r => _.get(r, '_id', false))
    _.each(results, (record) => {
      record._local = _.get(record, '_id', '').indexOf(mid) === 8
    })
    return context.result(results)
  }

  /**
   * List operation implementation
   * @static
   * @param {Object} context - Execution context
   * @returns {Promise} Promise that resolves when operation completes
   */
  static async _listImpl(context) {
    context.params.options = context.params.options || {}
    let results = await context.methods.read(context.params.query, context.params.options)
    // If results is a collection object (object with only numeric keys), convert to array
    if (results && _.isObject(results) && !_.isArray(results)) {
      // Check if all keys are numeric (like '0', '1', ...)
      const keys = Object.keys(results)
      if (keys.length && keys.every(k => /^\d+$/.test(k))) {
        results = keys.map(k => results[k])
      }
    }
    results = _.filter(results, r => _.get(r, '_id', false))
    context.results = results
    // Don't throw error for empty results - return empty array instead
    context.result(context.results)
    return context.results
  }

  /**
   * Find operation implementation
   * @static
   * @param {Object} context - Execution context
   * @returns {Promise} Promise that resolves when operation completes
   */
  static async _findImpl(context) {
    const params = context.params
    if (_.isString(params.query)) {
      try {
        const result = await context.resource.json.find(params.query)
        if (result && _.isObject(result) && result._id) {
          result._local = _.get(result, '_id', '').indexOf(context.options.cms.mid) === 8
        }
        return context.result(h.injectDependency(result, context.dependencyMap, context.resource.options, context.resource.resolveMap))
      } catch (error) {
        return context.error(h.recordNotFoundError(context.resource.name, params.query, error))
      }
    }
    try {
      const results = await context.methods.list(params.query, _.extend(params.options || {}, {page: 0, limit: 1}))
      if (!results.length) {
        return context.result(null)
      }
      return context.result(results[0])
    } catch (error) {
      return context.error(h.listRecordError(context.resource.name, params.query, error))
    }
  }

  /**
   * Exists operation implementation
   * @static
   * @param {Object} context - Execution context
   * @returns {Promise} Promise that resolves when operation completes
   */
  static async _existsImpl(context) {
    if (_.isString(context.params.query)) {
      try {
        await context.resource.json.find(context.params.query)
        return context.result(true)
      } catch (error) {
        if (error.notFound) {
          return context.result(false)
        }
        return context.error(h.recordNotFoundError(context.resource.name, context.params.query))
      }
    }
    try {
      const results = await new Promise((resolve, reject) => {
        context.methods.list(context.params.query, { page: 0, limit: 1 }, (error, result) => {
          if (error) reject(error)
          else resolve(result)
        })
      })
      if (!results.length) {
        return context.result(false)
      }
      return context.result(true)
    } catch (error) {
      return context.error(h.recordNotFoundError(context.resource.name, context.params.query, error))
    }
  }

  /**
   * Create operation implementation
   * @static
   * @param {Object} context - Execution context
   * @returns {Promise} Promise that resolves when operation completes
   */
  static async _createImpl(context) {
    try {
      const result = await context.resource.json.create(context.params.object._id, context.params.object)
      if (result) {
        result._local = _.get(result, '_id', '').indexOf(context.options.cms.mid) === 8
        return context.result(h.injectDependency(result, context.dependencyMap, context.resource.options, context.resource.resolveMap))
      } else {
        // Record creation failed, return error or empty result
        return context.error(new Error('Record creation failed or returned undefined'))
      }
    } catch (error) {
      return context.error(error)
    }
  }

  /**
   * Update operation implementation
   * @static
   * @param {Object} context - Execution context
   * @returns {Promise} Promise that resolves when operation completes
   */
  static async _updateImpl(context) {
    delete context.params.object._id
    delete context.params.object._createdAt
    delete context.params.object._attachments
    context.params.object._updatedAt = Date.now()
    h.merge(context.record, context.params.object)
    try {
      const result = await context.resource.json.update(context.params.id, context.record)
      h.releaseResource(context)
      return context.result(result)
    } catch (error) {
      return context.error(h.updateRecordError(context.resource.name, context.params.id, error))
    }
  }

  /**
   * Remove operation implementation
   * @static
   * @param {Object} context - Execution context
   * @returns {Promise} Promise that resolves when operation completes
   */
  static async _removeImpl(context) {
    try {
      const result = await context.resource.json.remove(context.params.id)
      return context.result(result)
    } catch (error) {
      return context.error(h.removeRecordError(context.resource.name, context.params.id, error))
    }
  }

  /**
   * Create attachment operation implementation
   * @static
   * @param {Object} context - Execution context
   * @returns {Promise} Promise that resolves when operation completes
   */
  static async _createAttachmentImpl(context) {
    const now = Date.now()
    const obj = context.params.object
    const attachment = (context.attachment = {
      _id: context.attachmentId,
      _createdAt: now,
      _updatedAt: now,
      _name: _.get(obj, 'name', ''),
      _contentType: _.get(obj, 'contentType', ''),
      _md5sum: context.md5sum,
      _payload: _.get(obj, 'payload', {}),
      _size: context.size,
      _filename: _.get(obj, 'fields._filename', _.get(obj, 'filename', '')),
      _fields: _.get(obj, 'fields', {})
    })
    _.each(['cropOptions', 'order'], (key) => {
      const val = _.get(obj, key, false)
      if (val) {
        _.set(attachment, key, val)
      }
    })
    try {
      if (_.get(attachment, '_name.length', 0) === 0) {
        throw new Error('missing field name')
      }
      context.record._attachments = _.get(context.record, '_attachments', [])
      context.record._attachments.push(attachment)
      context.record._attachments = _.orderBy(context.record._attachments, ['order'], ['asc'])
      context.record._updatedAt = now
      await context.resource.json.update(context.record._id, context.record)
      h.releaseResource(context)
      return context.result(attachment)
    } catch (error) {
      return context.error(error)
    }
  }

  /**
   * Update attachment operation implementation
   * @static
   * @param {Object} context - Execution context
   * @returns {Promise} Promise that resolves when operation completes
   */
  static async _updateAttachmentImpl(context) {
    const now = Date.now()
    const obj = context.params.object
    let foundAttachment = false
    const attachmentIndex = _.findIndex(context.record._attachments, {_id: context.params.aid})
    if (attachmentIndex !== -1) {
      foundAttachment = context.record._attachments[attachmentIndex]
      foundAttachment = _.merge(foundAttachment, obj)
      foundAttachment._updatedAt = now
      context.record._attachments[attachmentIndex] = foundAttachment
    }
    context.record._updatedAt = now
    try {
      await context.resource.json.update(context.record._id, context.record)
      h.releaseResource(context)
      return context.result(foundAttachment)
    } catch (error) {
      return context.error(error)
    }
  }

  /**
   * Find file operation implementation
   * @static
   * @param {Object} context - Execution context
   * @returns {Promise} Promise that resolves when operation completes
   */
  static _findFileImpl(context) {
    context.stream = context.resource.file.read(context.params.aid)
    return context.result(context.stream)
  }

  /**
   * Find attachment operation implementation
   * @static
   * @param {Object} context - Execution context
   * @returns {Promise} Promise that resolves when operation completes
   */
  static async _findAttachmentImpl(context) {
    context.attachment.stream = context.resource.file.read(context.attachment._id)
    const contentType = _.get(context.attachment, '_contentType', 'application/octet-stream')
    const resizeOptions = _.get(context, 'params.opts.resize', false)
    const smartOptions = _.get(context, 'params.opts.smart', false)
    if (resizeOptions && h.resizeOptionsValid(resizeOptions) && _.includes(['image/jpeg', 'image/gif', 'image/png'], contentType)) {
      // Check if smart cropping is requested
      if (smartOptions) {
        // Smart cropping cache key generation
        const faceOnlyFlag = context.params.opts.faceOnly ? '-faceonly' : ''
        const objectDetectionFlag = context.params.opts.objectDetection ? '-objects' : ''
        // Default smart behavior now uses object detection, so add flag for cache differentiation
        const defaultSmartFlag = (!context.params.opts.faceOnly && !context.params.opts.objectDetection) ? '-default' : ''
        const smartCacheKey = `${context.attachment._id}-smart${faceOnlyFlag}${objectDetectionFlag}${defaultSmartFlag}-${resizeOptions}`
        const smartCacheFile = path.join(context.resource.file._dir, smartCacheKey)
        if (fs.existsSync(smartCacheFile)) {
          // Use existing smart crop cache
          context.attachment.stream = context.resource.file.read(smartCacheKey)
          console.info(`Using cached smart cropped attachment: ${smartCacheKey}`)
        } else {
          // Cache miss - create smart cropped image and save to cache
          console.info(`Smart crop cache miss for ${smartCacheKey} @ ${smartCacheFile}, creating and caching smart cropped image`)
          try {
            const result = await ImageOptimization.smartCropAttachment(context.attachment.stream, resizeOptions, {
              detectFaces: true,
              minScale: 0.8,
              faceOnly: context.params.opts.faceOnly || false,
              objectDetection: context.params.opts.objectDetection || false
            })
            // Save smart cropped image to cache
            const cacheWriteStream = context.resource.file.write(smartCacheKey)
            result.stream.pipe(cacheWriteStream)
            // Wait for cache write to complete before reading
            await new Promise((resolve, reject) => {
              cacheWriteStream.on('finish', resolve)
              cacheWriteStream.on('error', reject)
            })
            // Read from cache for consistency
            context.attachment.stream = context.resource.file.read(smartCacheKey)
            // Add crop metadata to response
            if (result.cropResult) {
              context.attachment.cropResult = result.cropResult
            }
          } catch (smartCropError) {
            console.error(`Error smart cropping and caching attachment ${context.attachment._id}:`, smartCropError)
            // Fallback to regular resize if smart crop fails
            try {
              // Create a fresh stream for fallback since the original was consumed
              const freshStream = context.resource.file.read(context.attachment._id)
              const result = await ImageOptimization.resizeAttachment(freshStream, resizeOptions)
              context.attachment.stream = result.stream
            } catch (resizeError) {
              console.error(`Fallback resize also failed for ${context.attachment._id}:`, resizeError)
              // Final fallback to original attachment - create fresh stream
              context.attachment.stream = context.resource.file.read(context.attachment._id)
            }
          }
        }
      } else {
        // Regular resize with caching
        const cacheKey = `${context.attachment._id}-${resizeOptions}`
        const cacheFile = path.join(context.resource.file._dir, cacheKey)

        if (fs.existsSync(cacheFile)) {
          // Use existing cache
          context.attachment.stream = context.resource.file.read(cacheKey)
          console.info(`Using cached resized attachment: ${cacheKey}`)
        } else {
          // Cache miss - create resized image and save to cache
          console.info(`Cache miss for ${cacheKey}, creating and caching resized image`)
          try {
            const result = await ImageOptimization.resizeAttachment(context.attachment.stream, resizeOptions)
            // Save resized image to cache
            const cacheWriteStream = context.resource.file.write(cacheKey)
            result.stream.pipe(cacheWriteStream)
            // Wait for cache write to complete before reading
            await new Promise((resolve, reject) => {
              cacheWriteStream.on('finish', resolve)
              cacheWriteStream.on('error', reject)
            })
            // Read from cache for consistency
            context.attachment.stream = context.resource.file.read(cacheKey)
          } catch (resizeError) {
            console.error(`Error resizing and caching attachment ${context.attachment._id}:`, resizeError)
            // Fallback to original attachment if resize fails
            context.attachment.stream = context.resource.file.read(context.attachment._id)
          }
        }
      }
    }
    return context.result(context.attachment)
  }

  /**
   * Remove attachment operation implementation
   * @static
   * @param {Object} context - Execution context
   * @returns {Promise} Promise that resolves when operation completes
   */
  static async _removeAttachmentImpl(context) {
    context.record._attachments = _.filter(context.record._attachments, attachment => attachment._id !== context.attachment._id)
    context.record._updatedAt = Date.now()
    try {
      await context.resource.json.update(context.record._id, context.record)
      h.releaseResource(context)
      return context.result(true)
    } catch (error) {
      return context.error(error)
    }
  }

  /**
   * Clean attachment operation implementation
   * @static
   * @param {Object} context - Execution context
   * @returns {Promise} Promise that resolves when operation completes
   */
  static _cleanAttachmentImpl(context) {
    return context.resource.file.list((error, aidList) => {
      if (error) {
        return context.error(error)
      }
      const stream = context.resource.json.read()
      stream
        .on('data', (data) => {
          const attachments = data._attachments
          if (_.isArray(attachments)) {
            const list = _.map(attachments, item => item._id)
            return aidList = _.reject(aidList, item => _.includes(list, item))
          }
          return []
        })
        .on('error', attachmentError => context.error(attachmentError))
        .on('end', async () => {
          if (aidList.length > 0) {
            console.log('removing %s attachments ... ...', aidList.length)
            let count = 0
            try {
              await pAll(_.map(aidList, aid => {
                return async () => {
                  console.log('removing %s ... ...', aid)
                  try {
                    await context.resource.file.remove(aid)
                    console.log('removing %s ... ... done (%s/%s)', aid, ++count, aidList.length)
                  } catch (error) {
                    throw h.removeAttachmentError(context.resource.name, 'unknown', aid, error)
                  }
                }
              }), {concurrency: 10})
            } catch (error) {
              return context.error(error)
            }
          }
          return context.result(true)
        })
    })
  }
}

/**
 * Factory function export that maintains backward compatibility
 * Supports both direct instantiation and 'new' keyword usage
 */
module.exports = function(name, options) {
  return new Driver(name, options)
}

// Export the Driver class for direct access
module.exports.Driver = Driver
