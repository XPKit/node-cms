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
    // Whether the request failed is the HTTP status's business and nothing else's. Reading a `code`
    // out of the body made a record's own field decide: a country code, a product code, an error
    // code stored as data, and a request that had succeeded threw its own record back (#113).
    if (!response.ok) {
      throw returnJson ? await this.asError(response) : response
    }
    if (!returnJson) {
      return response
    }
    return await response.json()
  }

  /*
   * A failure as the caller sees it: whatever the server sent - a message, a data payload - under
   * the status it sent it with, so an empty error body still says what went wrong.
   *
   * @param {Response} response, a response that is not ok
   * @return {Object} an error carrying at least a code and a message
   */
  async asError (response) {
    let body = null
    try {
      body = await response.json()
    } catch (parseError) {
      // A proxy's HTML error page, a truncated body. The status still describes the failure, but
      // the parse error is the only account of why the body was unreadable, so it is logged rather
      // than dropped.
      console.warn(`Failed to parse the error body of a ${_.get(response, 'status', 0)} response:`, parseError)
      body = null
    }
    let error = {}
    if (_.isPlainObject(body)) {
      error = _.clone(body)
    } else if (!_.isNil(body)) {
      // An error body that is not an object - a bare string, a list - is still what the server said.
      error = {data: body}
    }
    // The status is the status: a body carrying its own `code` describes the failure, never renames it.
    error.code = _.get(response, 'status', 0)
    if (!_.isString(error.message)) {
      error.message = _.get(response, 'statusText') || `Request failed with status ${error.code}`
    }
    return error
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
