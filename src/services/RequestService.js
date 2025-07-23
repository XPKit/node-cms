import _ from 'lodash'

class RequestService {
  async handleRequest (url, options) {
    const returnJson = _.get(options, 'returnJson', false)
    if (returnJson) {
      delete options.returnJson
    }
    const contentType = options.body instanceof FormData ? false : 'application/json'
    if (!(options.body instanceof FormData)) {
      options.headers = {
        'Accept': 'application/json',
        'Content-Type': contentType
      }
    }
    if (_.get(options.headers, 'Content-Type', false) === 'application/json' && _.get(options, 'body', false) && _.isObject(options.body)) {
      options.body = JSON.stringify(options.body)
    }
    const response = await fetch(url, options)
    if (!returnJson) {
      if (!response.ok) {
        throw response
      }
      return response
    }
    let json = null
    json = await response.json()
    const code = _.get(json, 'code', _.get(response, 'status', 0))
    if (code === 0 && !response.ok) {
      throw response
    } else if (code < 200 || code > 299) {
      throw json
    }
    return json
  }

  async get (url, returnJson = true) {
    return await this.handleRequest(url, {method: 'GET', returnJson})
  }

  async post (url, body = {}, returnJson = true) {
    return await this.handleRequest(url, {method: 'POST', body, returnJson})
  }

  async put (url, body = {}, returnJson = true) {
    return await this.handleRequest(url, {method: 'PUT', body, returnJson})
  }

  async delete (url, body = {}, returnJson = true) {
    return await this.handleRequest(url, {method: 'DELETE', body, returnJson})
  }
}

export default new RequestService()
