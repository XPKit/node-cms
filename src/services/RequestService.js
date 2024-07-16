import _ from 'lodash'

class RequestService {
  async handleRequest (url, options) {
    const returnJson = _.get(options, 'returnJson', false)
    if (returnJson) {
      delete options.returnJson
    }
    options.headers = {
      'Accept': 'application/json'
    }
    const contentType = options.body instanceof FormData ? 'x-www-form-urlencoded' : 'json'
    _.set(options.headers, 'Content-Type', `application/${contentType}`)
    if (contentType === 'json' && _.get(options, 'body', false) && _.isObject(options.body)) {
      options.body = JSON.stringify(options.body)
    }
    const response = await fetch(url, options)
    if (!returnJson) {
      return response
    }
    return await response.json()
  }

  async get (url, returnJson = true) {
    return await this.handleRequest(url, {method: 'GET', returnJson})
  }

  async post (url, body = {}, returnJson = true) {
    return await this.handleRequest(url, {method: 'POST', body: body, returnJson})
  }

  async put (url, body = {}, returnJson = true) {
    return await this.handleRequest(url, {method: 'PUT', body: body, returnJson})
  }

  async delete (url, body = {}, returnJson = true) {
    return await this.handleRequest(url, {method: 'DELETE', body: body, returnJson})
  }
}

export default new RequestService()
