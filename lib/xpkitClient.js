const log4js = require('log4js')
const _ = require('lodash')
const XPToolkitRequest = require('./xpToolkitRequest')
let logger = log4js.getLogger()

function XpkitClient (config) {
  if (!(this instanceof XpkitClient)) {
    return new XpkitClient(config)
  }
  // logger.warn(`Will init XPToolkit lib with config:`, config)
  // this.XPTOOLKIT = XPToolkit.getInstance(config)
  this.xpToolkitRequest = XPToolkitRequest.getInstance(config)
  // this.XPTOOLKIT.createSouvenirConfiguration(config)
}

XpkitClient.prototype.getToken = async function () {
  return await this.xpToolkitRequest._getToken()
}

XpkitClient.prototype.tokenIsValid = async function () {
  return await this.xpToolkitRequest.tokenIsValid()
}

XpkitClient.prototype.put = async function (options) {
  logger.debug(`PUT`, options)
  return await this.xpToolkitRequest.put(_.omit(options, ['sync']))
}
XpkitClient.prototype.formatJson = function (options) {
  // Since xpkit doesn't allow null values
  options.isStream = true
  if (_.get(options, 'json', false)) {
    const formatted = {}
    _.each(options.json, (val, key) => {
      _.set(formatted, key, _.isNull(val) ? false : val)
    })
    options.json = formatted
  }
  return options
}
XpkitClient.prototype.patch = async function (options) {
  try {
    return await this.xpToolkitRequest.patch(this.formatJson(options))
  } catch (error) {
    logger.error(`Error:`, _.get(error, 'response.body'))
    throw error
  }
}

XpkitClient.prototype.post = async function (options) {
  try {
    return await this.xpToolkitRequest.post(this.formatJson(options))
  } catch (error) {
    logger.error(`Error:`, _.get(error, 'response.body'))
    throw error
  }
}

XpkitClient.prototype.head = async function (options) {
  return await this.xpToolkitRequest.head(options)
}

XpkitClient.prototype.del = async function (options) {
  // logger.debug(`DEL`, options)
  return await this.xpToolkitRequest.del(options)
}

XpkitClient.prototype.delete = async function (options) {
  // logger.debug(`DELETE`, options)
  options.isStream = true
  return await this.xpToolkitRequest.delete(options)
}

XpkitClient.prototype.get = async function (options) {
  // logger.debug(`GET`, options)
  options.isStream = true
  try {
    return await this.xpToolkitRequest.get(options)
  } catch (error) {
    if (_.get(error, 'response.statusCode', false) === 404) {
      return false
    }
    throw error
  }
}

module.exports = XpkitClient
