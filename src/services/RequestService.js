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
      return response
    }
    const json = await response.json()
    if (options.method === 'GET' && (url.indexOf('limit=') !== -1 || url.indexOf('page=') !== -1)) {
      const test = {
        numRecords: _.toNumber(response.headers.get('numrecords')),
        records: json
      }
      return test
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
