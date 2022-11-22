const GotCJS = require('got-cjs')
const path = require('path')
const moment = require('moment')
const crypto = require('crypto')
const autoBind = require('auto-bind')
const _ = require('lodash')
const log4js = require('log4js')
const pkg = path.join(__dirname, 'package.json')
let logger = log4js.getLogger()
const got = GotCJS.got

class XPToolkitRequest {
  constructor (config) {
    autoBind(this)
    const requestOptions = _.get(config, 'requestOptions', {})
    delete config.requestOptions
    const souvenirConf = this.getSouvenirConfiguration(config)
    this.createEndpoints(souvenirConf, this.getMode(config, souvenirConf))
    this.setGotRequestsOptions(requestOptions)
  }

  setGotRequestsOptions (requestOptions) {
    // NOTE: assigns the callbacks for download & upload progress if passed in the config
    this.onDownloadProgress = _.get(requestOptions, 'downloadProgress', (progress) => {
      // logger.info('on downloadProgress', progress)
    })
    delete requestOptions.downloadProgress
    this.onUploadProgress = _.get(requestOptions, 'uploadProgress', (progress) => {
      // logger.info('on uploadProgress', progress)
    })
    delete requestOptions.uploadProgress
    const defaultOptions = {
      retry: {
        limit: 0,
        methods: [
          'GET',
          'PUT',
          'HEAD',
          'DELETE',
          'OPTIONS',
          'TRACE'
        ],
        statusCodes: [
          408,
          413,
          429,
          500,
          502,
          503,
          504,
          521,
          522,
          524
        ],
        errorCodes: [
          'ETIMEDOUT',
          'ECONNRESET',
          'EADDRINUSE',
          'ECONNREFUSED',
          'EPIPE',
          'ENOTFOUND',
          'ENETUNREACH',
          'EAI_AGAIN'
        ],
        maxRetryAfter: undefined,
        calculateDelay: function (retryObject) {
          if (retryObject.attemptCount >= retryObject.retryOptions.limit) {
            if (retryObject.retryOptions.limit !== 0) {
              logger.error(`already tried the request ${retryObject.attemptCount} times, will cancel the request`)
            }
            return 0
          }
          logger.warn(`will retry request in 0.5 seconds - ${retryObject.attemptCount} < ${retryObject.retryOptions.limit}`)
          return 500
        }
      },
      timeout: {
        lookup: 1000,
        connect: 2000,
        secureConnect: 2000,
        socket: 2000,
        send: 60000,
        read: 2000,
        request: 60000,
        response: 2000
      }
    }
    this.requestOptions = _.merge(defaultOptions, requestOptions)
    // logger.info('Request options are: ', this.requestOptions)
  }

  getMode (config, souvenirConf) {
    let mode
    if (_.get(config, 'forceTest', false)) {
      mode = 'test'
    } else {
      if (!_.isUndefined(_.get(souvenirConf, 'test', undefined))) {
        mode = souvenirConf.test
      } else {
        mode = 'test'
      }
      mode = souvenirConf.test ? 'test' : 'live'
    }
    logger.debug(`XPToolkit launched in mode: ${mode}`)
    return mode
  }

  getSouvenirConfiguration (config) {
    let souvenirConf = {
      test: true,
      domain: {
        live: 'pt.imagination.net',
        test: 'xp.imagination-xpkit.cn'
      },
      oauth: {
        live: {
          auth_url: 'https://auth.pt.imagination.net/api/o/token/',
          client_id: 'hxaOnGNTLEeE5ApelmNAOwAWdBSuycpLPSeEBdb7',
          client_secret: '3qYLceoGzxNsuRWysl570zXTdrMKZirY6ZTYJfvTxwtDqYecNphHZB9q7zjLCJkkWNNj757wGLB0aK7bvzmLuPl2DR7GYBuJWYLHlV7Xr6eW6Clm3YMaVjTYU9xQS2EM'
        },
        test: {
          auth_url: 'https://auth.xp.imagination-xpkit.cn/api/o/token/',
          client_id: 'DnUMEFg8kChjAjg9ExhHQKlzl7IO2qHCGdmL9iV2',
          client_secret: 'ElhIr3AvPeCJSERtEFtwGMXPkl23d3Xm6QfZpkwFT0yEPMVWztJirPjGKCyktxjbVb85HVgdmN8K90wgVj9GCF6fOSEOxO5ino6qaK2zNY1ciSx9ykNwHYf9yA1Fk47D'
        }
      }
    }
    if (_.isUndefined(config) || !_.isObject(config)) {
      if (!_.isObject(config)) {
        logger.debug('Test mode detected')
      }
      logger.debug('Will use the config from package.json.')
      souvenirConf = pkg.config.server.souvenir
    } else {
      logger.debug('Will use the config passed.', config)
      souvenirConf = config
    }
    return souvenirConf
  }

  createEndpoints (souvenirConf, mode) {
    this._tokenUrl = souvenirConf.oauth[`${mode}`].auth_url
    this._clientId = souvenirConf.oauth[`${mode}`].client_id
    this._clientSecret = souvenirConf.oauth[`${mode}`].client_secret
    this.domain = souvenirConf.domain[`${mode}`]
    this._accessToken = undefined
    this._accessTokenTimestamp = undefined // timestamp of last token that we got
    this._accessTokenExpiresIn = undefined // in seconds, provided by server
    logger.debug(`use client id: ${this._clientId}`)
    logger.debug(`Use secret key: ${this._clientSecret}`)
    this.endpoints = {
      profile: `https://profiles.${this.domain}/api/profile/`,
      interaction: `https://interactions.${this.domain}/api/interaction/`,
      job: `https://jobs.${this.domain}/api/job/`,
      socialAuth: `https://socialauth.${this.domain}/api/`,
      vcc: `https://vcc.${this.domain}/api/`
    }
    logger.debug('XPToolkit endpoints are:')
    _.forEach(this.endpoints, (val, key) => logger.debug(`\t${key}: ${val}`))
  }

  async _getToken () {
    const formdata = {
      grant_type: 'client_credentials',
      client_id: this._clientId,
      client_secret: this._clientSecret
    }
    logger.debug('Requesting token...')
    try {
      let res = await got.post(this._tokenUrl, { form: formdata })
      res = JSON.parse(res.body)
      this._accessToken = res.access_token
      this._accessTokenExpiresIn = res.expires_in
      this._accessTokenTimestamp = moment()
      logger.debug(`Received token: ${this._accessToken}`)
      return res
    } catch (error) {
      logger.debug(`Error: ${error}`)
      return false
    }
  }

  // short helper function to check if a token exists and if it's still within its lifetime
  tokenIsValid () {
    // don't have an access token at all, therefor not valid OR don't have a timestamp present, therefor invalid
    if (!this._accessToken || !this._accessTokenTimestamp) {
      return false
    }
    const now = moment()
    const expirationDateTime = this._accessTokenTimestamp.clone().add(this._accessTokenExpiresIn, 'seconds')
    return !now.isAfter(expirationDateTime)
  }

  // perform the actual request
  // if server reports an error, get a new token and try one more time
  async _issueRequest (options) {
    options = options || {}
    options.headers = { Authorization: `Bearer ${this._accessToken}` }
    options = this.formatRequestOptions(options)
    logger.debug(`--------- Request ${options.method}: ${options.url}`)
    try {
      // logger.debug('REQUEST OPTIONS-------------------', options)
      const res = await got(_.omit(options, ['isStream', 'downloadProgress', 'uploadProgress', 'asBuffer']))
        .on('downloadProgress', _.get(options, 'downloadProgress', false) || this.onDownloadProgress)
        .on('uploadProgress', _.get(options, 'uploadProgress', false) || this.onUploadProgress)
      if (options.method === 'DELETE') {
        // Since xpkit doesn't return anything on DELETE
        return true
      }
      return JSON.parse(res.body)
    } catch (error) {
      logger.warn(`Something went wrong: ${options.url} - ${error}`, options)
      // NOTE: If request has a stream in it, it should not retry it with the same stream
      if (_.get(options, 'isStream', false)) {
        throw error
      }
      // something went wrong,
      // discard the token, request a new one, and try one more time again
      this._accessToken = undefined
      this._accessTokenTimestamp = undefined
      logger.debug('Getting token...')
      try {
        await this._getToken()
        options.headers = { Authorization: `Bearer ${this._accessToken}` }
        logger.debug('Reprocess request')
        return await this.request(options)
      } catch (error) {
        if (_.get(options, 'isStream', false)) {
          throw error
        }
        logger.debug('Error: Unable to obtain a token:', error)
        return false
      }
    }
  }

  formatRequestOptions (options) {
    return _.merge(_.cloneDeep(this.requestOptions), options)
  }

  // Wrapper for got, injecting the token
  async request (options) {
    options = options || {}
    options.followRedirect = true
    // check if token is tokenIsValid
    // if yes, issue request directly,
    // if no, try to obtain token and if no error, issue request
    if (this.tokenIsValid()) {
      return await this._issueRequest(options)
    }
    try {
      await this._getToken()
      return await this._issueRequest(options)
    } catch (error) {
      if (_.get(error, 'response.statusCode', false)) {
        logger.debug(`Error: Unable to obtain a token - status code ${error.response.statusCode}:`, error)
      } else {
        logger.debug('Error: Unable to obtain a token:', error)
      }
      if (_.get(options, 'isStream', false)) {
        throw error
      }
      return false
    }
  }

  put (options) {
    options = options || {}
    options.method = 'PUT'
    return this.request(options)
  }

  patch (options) {
    options = options || {}
    options.method = 'PATCH'
    return this.request(options)
  }

  post (options) {
    options = options || {}
    options.method = 'POST'
    return this.request(options)
  }

  head (options) {
    options = options || {}
    options.method = 'HEAD'
    return this.request(options)
  }

  del (options) {
    options = options || {}
    options.method = 'DELETE'
    options.followRedirect = true
    return this.request(options)
  }

  delete (options) {
    options = options || {}
    options.method = 'DELETE'
    return this.request(options)
  }

  get (options) {
    options = options || {}
    options.method = 'GET'
    return this.request(options)
  }
}

module.exports = {
  self: null,
  id: null,
  /**
   * @param  {Object} forceTest Configuration object (see format in README) or Boolean true to use test mode
   * @returns {XPToolkitRequest}
   */
  getInstance (forceTest) {
    if (forceTest == null) {
      forceTest = false
    }
    if (this.self === null) {
      this.id = crypto.randomUUID()
      this.self = new XPToolkitRequest(forceTest)
    }
    return this.self
  }
}
