const Dayjs = require('dayjs')
const crypto = require('crypto')
const {v4: uuid} = require('uuid')
const autoBind = require('auto-bind')
const _ = require('lodash')
const logger = new (require('img-sh-logger'))()

class XPKitRequest {
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
    this.onDownloadProgress = _.get(requestOptions, 'downloadProgress', () => {
      // logger.info('on downloadProgress', progress)
    })
    delete requestOptions.downloadProgress
    this.onUploadProgress = _.get(requestOptions, 'uploadProgress', () => {
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
    if (_.isUndefined(config) || !_.isObject(config)) {
      logger.error('Error: No configuration found')
      throw new Error('No configuration found')
    }
    logger.debug('Will use the config passed.', config)
    return config
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
    _.each(this.endpoints, (val, key) => logger.debug(`\t${key}: ${val}`))
  }

  async _getToken () {
    const formdata = {
      grant_type: 'client_credentials',
      client_id: this._clientId,
      client_secret: this._clientSecret
    }
    logger.debug('Requesting token...')
    try {
      const response = await fetch(this._tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(formdata)
      })
      const res = await response.json()
      this._accessToken = res.access_token
      this._accessTokenExpiresIn = res.expires_in
      this._accessTokenTimestamp = Dayjs()
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
    const now = Dayjs()
    const expirationDateTime = this._accessTokenTimestamp.clone().add(this._accessTokenExpiresIn, 'seconds')
    return !now.isAfter(expirationDateTime)
  }

  // perform the actual request
  // if server reports an error, get a new token and try one more time
  async _issueRequest (options) {
    options = options || {}
    options.headers = { Authorization: `Bearer ${this._accessToken}` }
    options = this.formatRequestOptions(options)
    // logger.debug(`--------- Request ${options.method}: ${options.url}`)
    try {
      // logger.debug('REQUEST OPTIONS-------------------', options)
      const fetchOptions = {
        method: options.method || 'GET',
        headers: options.headers
      }

      if (options.json) {
        fetchOptions.headers['Content-Type'] = 'application/json'
        fetchOptions.body = JSON.stringify(options.json)
      } else if (options.form) {
        fetchOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded'
        fetchOptions.body = new URLSearchParams(options.form)
      } else if (options.body) {
        fetchOptions.body = options.body
      }

      // Call progress callbacks if provided (simplified - no actual progress tracking)
      const downloadProgress = _.get(options, 'downloadProgress', false) || this.onDownloadProgress
      const uploadProgress = _.get(options, 'uploadProgress', false) || this.onUploadProgress
      if (downloadProgress) downloadProgress({ percent: 0 })
      if (uploadProgress) uploadProgress({ percent: 0 })

      const res = await fetch(options.url, fetchOptions)

      if (downloadProgress) downloadProgress({ percent: 1 })
      if (uploadProgress) uploadProgress({ percent: 1 })

      if (options.method === 'DELETE') {
        // Since xpkit doesn't return anything on DELETE
        return true
      }
      return await res.json()
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
   * @returns {XPKitRequest}
   */
  getInstance (forceTest) {
    if (forceTest == null) {
      forceTest = false
    }
    if (this.self === null) {
      if (_.isFunction(crypto.randomUUID)) {
        this.id = crypto.randomUUID()
      } else {
        this.id = uuid()
      }
      this.self = new XPKitRequest(forceTest)
    }
    return this.self
  }
}

