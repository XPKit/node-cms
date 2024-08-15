

const _ = require('lodash')
const Events = require('./events')

/*
 * Constructor
 *
 * @param {Object} params
 * @param {Endpoint} endpoint
 * @param {Driver} driver
 */

function Context (params, endpoint, driver) {
  this.options = driver.options
  this.params = params
  this.endpoint = endpoint
  this.driver = driver
}

/*
 * Fire 'next' event
 */

Context.prototype.next = function () {
  this.trigger('next', this)
}

/*
 * Interrupt chain processing and fire 'result' event
 *
 * @param result
 * @return {Context} context
 */

Context.prototype.result = function (result) {
  this._result = result
  this.trigger('result', result, this)
  this.end()
  return this
}

/*
 * Interrupt chain processing and fire 'error' event
 *
 * @param error
 * @return {Context} context
 */

Context.prototype.error = function (error) {
  this._error = error
  this.trigger('error', error, this)
  this.end()
  return this
}

/*
 * Interrupt chain processing and remove all event listeners
 */

Context.prototype.end = function () {
  this.trigger('end', this)
  this.off()
}

/*
 * Return invocation result
 */

Context.prototype.getResult = function () {
  return (this._result === void 0) ? null : this._result
}

/*
 * Return invocation error
 */

Context.prototype.getError = function () {
  return (this._error === void 0) ? null : this._error
}

/*
 * Extends Backbone Events
 */

_.extend(Context.prototype, Events)


exports = module.exports = Context
