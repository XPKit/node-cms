const _ = require('lodash')
const XPKitRequest = require('./xpkitRequest')
const logger = new (require('img-sh-logger'))()

/**
 * XpkitClient class for managing XPKit API interactions
 */
class XpkitClient {
  constructor (config) {
    // logger.warn(`Will init XPToolkit lib with config:`, config)
    // this.XPTOOLKIT = XPToolkit.getInstance(config)
    this.xpkitRequest = XPKitRequest.getInstance(config)
    // this.XPTOOLKIT.createSouvenirConfiguration(config)
  }

  async getToken () {
    return await this.xpkitRequest._getToken()
  }

  async tokenIsValid () {
    return await this.xpkitRequest.tokenIsValid()
  }

  async put (options) {
    logger.debug('PUT', options)
    return await this.xpkitRequest.put(_.omit(options, ['sync']))
  }

  formatJson (options) {
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

  async patch (options) {
    try {
      return await this.xpkitRequest.patch(this.formatJson(options))
    } catch (error) {
      logger.error('Error:', _.get(error, 'response.body'))
      throw error
    }
  }

  async post (options) {
    try {
      return await this.xpkitRequest.post(this.formatJson(options))
    } catch (error) {
      logger.error('Error:', _.get(error, 'response.body'))
      throw error
    }
  }

  async head (options) {
    return await this.xpkitRequest.head(options)
  }

  async del (options) {
    // logger.debug(`DEL`, options)
    return await this.xpkitRequest.del(options)
  }

  async delete (options) {
    // logger.debug(`DELETE`, options)
    options.isStream = true
    return await this.xpkitRequest.delete(options)
  }

  async get (options) {
    // logger.debug(`GET`, options)
    options.isStream = true
    try {
      return await this.xpkitRequest.get(options)
    } catch (error) {
      if (_.get(error, 'response.statusCode', false) === 404) {
        return false
      }
      throw error
    }
  }
}

module.exports = XpkitClient

