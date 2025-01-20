/* eslint-disable standard/no-callback-literal */
/*
 * Lightweight API driver
 */

/*
 * Module dependencies
 */

const Context = require('./context')
const _ = require('lodash')
const Q = require('q')

/*
 * Constructor
 *
 * @param {String} name
 * @param {Object} options, optional
 */

function Driver (name, options) {
  if (!(this instanceof Driver)) {
    return new Driver(name, options)
  }

  this.options = options
  this.name = name
  this._middleware = []
  this._methods = {}
  this._hooks = {
    before: [],
    after: []
  }
}

/*
 * Get driver method
 *
 * @api private
 * @param {String} name
 * @return {Object} method, method definition
 */

Driver.prototype._method = function (name) {
  this._methods[name] = this._methods[name] ||
    {
      name, before: [], invoke: null, after: [], params: undefined
    }
  return this._methods[name]
}

/*
 * Middleware support
 *
 * @api public
 * @param {Function} middleware(context)
 * @return {Driver} self
 */

Driver.prototype.use = function (middleware) {
  if (typeof middleware !== 'function') {
    throw new Error('`use` expects a function')
  }
  this._middleware.push(middleware)
  return this
}

/*
 * Define a new driver method
 *
 * @api public
 * @param {String} name
 * @param {Function} fn(context)
 * @return {Driver} self
 *
 * @example:
 *   driver.define('find', ['query', 'options?'], function(context) {});
 */

Driver.prototype.define = function () {
  const args = Array.prototype.slice.call(arguments)

  if (typeof args[0] !== 'string') {
    throw new Error('method name is not defined')
  }

  const name = args.shift()

  if (Array.isArray(args[0])) {
    this._method(name).params = args.shift()
  }

  if (typeof args[0] !== 'function') {
    throw new Error('method body is not defined')
  } else {
    this._method(name).invoke = args[0]
  }

  return this
}

/*
 * Support before hooks
 *
 * @api public
 * @param {String} name, method name
 * @param {Function} fn(context)
 * @return {Driver} self
 */

Driver.prototype.before = function (name, fn) {
  if (typeof fn !== 'function') {
    throw new Error('`hook` expects a function')
  }
  this._method(name).before.push(fn)
  return this
}

/*
 * Support after hooks
 *
 * @api public
 * @param {String} name, method name
 * @param {Function} fn(context)
 * @return {Driver} self
 */

Driver.prototype.after = function (name, fn) {
  if (typeof fn !== 'function') {
    throw new Error('`hook` expects a function')
  }
  this._method(name).after.unshift(fn)
  return this
}

/*
 * Support before all hooks
 *
 * @api public
 * @param {Function} fn(context)
 * @return {Driver} self
 */

Driver.prototype.beforeAll = function (fn) {
  if (typeof fn !== 'function') {
    throw new Error('`hook` expects a function')
  }
  this._hooks.before.push(fn)
  return this
}

/*
 * Support after all hooks
 *
 * @api public
 * @param {Function} fn(context)
 * @return {Driver} self
 */

Driver.prototype.afterAll = function (fn) {
  if (typeof fn !== 'function') {
    throw new Error('`hook` expects a function')
  }
  this._hooks.after.unshift(fn)
  return this
}

/*
 * Build API from driver configuration
 *
 * @api public
 * @return {Object} api
 */

Driver.prototype.build = function () {
  let api = {}
  let self = this

  const hooks = {
    middleware: [],
    beforeAll: [],
    before: {},
    after: {},
    afterAll: []
  }

  api.use = function (fn) {
    hooks.middleware.push(fn)
  }

  api.before = function (name, fn) {
    hooks.before[name] = hooks.before[name] || []
    hooks.before[name].push(fn)
  }

  api.after = function (name, fn) {
    hooks.after[name] = hooks.after[name] || []
    hooks.after[name].unshift(fn)
  }

  api.beforeAll = function (fn) {
    hooks.beforeAll.push(fn)
  }

  api.afterAll = function (fn) {
    hooks.afterAll.unshift(fn)
  }

  _.each(this._methods, (method, name) => {
    if (!method.invoke) {
      return
    }

    api[name] = function () {
      let deferred = Q.defer()
      let args = Array.prototype.slice.call(arguments)
      let params = {}
      let callback

      if (typeof args[args.length - 1] === 'function') {
        let func = args.pop()
        callback = (error, result) => {
          if (error) {
            deferred.reject(error)
          } else {
            deferred.resolve(result)
          }
          func(error, result)
        }
      } else {
        callback = (error, result) => {
          if (error) {
            deferred.reject(error)
          } else {
            deferred.resolve(result)
          }
        }
      }

      if (method.params) {
        const missing = _.find(method.params, (param, index) => {
          let optional = false

          if (param.indexOf('?') > -1) {
            optional = true
            param = param.split('?')[0]
          }

          const value = args[index]

          if (typeof value === 'undefined') {
            if (optional !== true) {
              return true
            }
          }

          params[param] = value

          return false
        })

        if (missing) {
          callback(`Parameter [${missing}] is missing`)
          return deferred.promise
        }
      } else {
        params = args
      }

      const pipe = [].concat(
        self._middleware,
        hooks.middleware,
        self._hooks.before,
        hooks.beforeAll,
        hooks.before[name] || [],
        method.before,
        method.invoke
      )

      // method.after,
      // hooks.after[name] || [],
      // hooks.afterAll,
      // self._hooks.after

      let context = new Context(params, method, self)

      context.methods = api

      let index = 0

      context.on('next', () => {
        index++
        if (pipe[index]) {
          pipe[index](context)
        } else {
          context.end()
        }
      })

      context.on('end', () => {
        if (context.getError()) {
          return callback(context.getError(), context.getResult())
        }

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

      pipe[index](context)

      return deferred.promise
    }
  })

  return api
}



exports = module.exports = Driver
