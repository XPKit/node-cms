const _ = require('lodash')
const path = require('path')
const fs = require('fs-extra')

class RequestService {
  constructor(auth) {
    this.username = auth.username
    this.password = auth.password
  }

  setAuth(jwtToken) {
    this.auth = `nodeCmsJwt=${jwtToken}`
    this.basicAuth = 'Basic ' + Buffer.from(this.username + ':' + this.password).toString('base64')
  }

  addAuthToRequest(options) {
    if (this.auth) {
      _.set(options, 'headers.cookie', this.auth)
      _.set(options, 'Authorization', this.basicAuth)
    }
  }

  async handleRequest (url, options) {
    try {
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
      this.addAuthToRequest(options)
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
      try {
        json = await response.json()
      } catch (error) {
        console.error('Failed to parse JSON response:', response)
      }
      const code = _.get(json, 'code', _.get(response, 'status', 0))
      if (code === 0 && !response.ok) {
        throw response
      } else if (code < 200 || code > 299) {
        throw json
      }
      return json
    } catch (error) {
      console.error(`Request to ${options.method} ${url} failed`, error)
      throw error
    }
  }

  async get (url, returnJson = true) {
    return await this.handleRequest(url, {method: 'GET', returnJson})
  }

  async getAttachment(url, outputPath, maxRetries = 10) {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36'
      }
    }
    this.addAuthToRequest(options)
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        await fs.ensureDir(path.dirname(outputPath))
        const fileStream = fs.createWriteStream(outputPath)
        await response.body.pipeTo(
          new WritableStream({
            write(chunk) {
              fileStream.write(chunk)
            },
            close() {
              fileStream.end()
            }
          })
        )
      } catch (error) {
        console.error(`Attempt ${url} - ${i + 1} failed:`, error)
        if (i === maxRetries - 1) {
          throw error
        }
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
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

exports = module.exports = RequestService
