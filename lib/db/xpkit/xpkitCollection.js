// const path = require('path')
const sift = require('sift')
const _ = require('lodash')
// const path = require('path')
// const logger = new (require('img-sh-logger'))()
const XpkitClient = require('./xpkitClient')

class XpkitCursor {
  constructor (collection, query) {
    this.collection = collection
    this.query = query
    this._next = 0
    this._currentDocument = 0
    this.documents = []
  }

  async hasNext () {
    return !_.isNull(this._next)
  }

  getCurrentDocument () {
    return _.get(this.documents, `[${this._currentDocument}]`, false)
  }

  async next () {
    if (this._next === null && this._currentDocument === this.documents.length) {
      return
    }
    if (_.get(this.documents, 'length', 0) !== 0 && this._currentDocument < this.documents.length) {
      this._currentDocument++
      const record = this.getCurrentDocument()
      return record
    }
    if (this._next !== 0) {
      _.set(this.query, 'query.x__token', this._next)
    }
    const response = await this.collection.find(this.query, true)
    this._next = _.get(response, 'next_token', null)
    this._currentDocument = 0
    this.documents = _.get(response, 'results', [])
    return this.getCurrentDocument()
  }
}

class XpkitCollection {
  constructor (collectionName, config) {
    this.config = config
    this.collectionName = collectionName
    this.client = new XpkitClient(config)
    const domain = _.get(config, `domain.${_.get(config, 'test', true) ? 'test' : 'live'}`, false)
    if (!domain) {
      throw new Error('Xpkit configuration incomplete, no domain found')
    }
    this.url = `https://resources.${domain}/api/${this.collectionName}`
  }

  urlWithId (value) {
    return `${this.url}/${_.get(value, '_xpkitId', false)}`
  }

  async updateOne (key, value) {
    _.set(value, 'name', _.get(value, 'name', `${this.collectionName}-${_.get(value, '_id', false)}`))
    return await this.client.patch({url: this.urlWithId(value), json: value})
  }

  async insertOne (value) {
    _.set(value, 'name', _.get(value, 'name', `${this.collectionName}-${_.get(value, '_id', false)}`))
    return await this.client.post({url: this.url, json: value})
  }

  async deleteOne (key, value) {
    return await this.client.delete({url: this.urlWithId(value)})
  }

  getCursor (query) {
    return new XpkitCursor(this, query)
  }

  formatOptions (query) {
    let url = this.url
    if (query && !_.isEmpty(query)) {
      url += '?' + _.join(_.map(query, (val, key) => {
        return `${key}=${val}`
      }), ',')
    }
    return {url}
  }

  mapXpkitIdsToCmsIds (results) {
    // Maps resource_id to _id
    let returnSingleResult = false
    if (!_.isArray(results)) {
      returnSingleResult = true
      results = [results]
    }
    const formatted = _.map(results, (result) => {
      if (_.get(result, 'resource.id', false)) {
        _.set(result, 'resource._id', _.get(result, 'resource.id', false))
      }
      if (!_.get(result, 'resource._id', false)) {
        _.set(result, 'resource._id', _.get(result, 'resource_id', false))
      }
      if (!_.get(result, 'resource._xpkitId')) {
        _.set(result, 'resource._xpkitId', _.get(result, 'resource_id', false))
      }
      return result
    })
    return returnSingleResult ? _.first(formatted) : formatted
  }

  hasEmptyQuery (urlParams) {
    let withEmptyQuery = _.get(urlParams, 'query', false)
    return _.isObject(withEmptyQuery) && _.isEmpty(withEmptyQuery)
  }

  formatUrlParams (urlParams, withEmptyQuery) {
    let formatted = {}
    if (_.get(urlParams, 'query', false) === false || withEmptyQuery) {
      return _.omit(urlParams, ['query'])
    }
    if (_.get(urlParams, 'query', false)) {
      _.each(urlParams, (val, key) => {
        if (key === 'query') {
          _.each(val, (val2, key2) => {
            if (!_.isObject(val)) {
              _.set(formatted, key2, val2)
            }
          })
        } else if (!_.isObject(val)) {
          _.set(formatted, key, val)
        }
      })
    }
    return formatted
  }

  async list (_query = false, fullQuery = false, urlParams = false) {
    let additionalParams = ''
    const withEmptyQuery = this.hasEmptyQuery(urlParams)
    if (urlParams) {
      urlParams = this.formatUrlParams(urlParams, withEmptyQuery)
      if (!_.isEmpty(urlParams)) {
        additionalParams = `?${_.join(_.map(urlParams, (val, key) => `${key}=${val}`), '&')}`
      }
    }
    const response = await this.client.get({url: `${this.url}${urlParams ? additionalParams : ''}`})
    _.set(response, 'results', this.mapXpkitIdsToCmsIds(_.get(response, 'results', [])))
    if (withEmptyQuery && _.get(response, 'results.length', 0) > 1) {
      _.set(response, 'results', _.first(response.results))
    }
    if (!fullQuery) {
      return _.compact(_.map(_.get(response, 'results', []), (item) => _.get(item, 'resource', false)))
    }
    return response
  }

  filterRecordsFromResponse (response, query = false, limit = -1) {
    let filtered = _.map(_.get(response, 'results', []), 'resource')
    if (query) {
      filtered = filtered.filter(sift(query))
    }
    return limit === -1 ? filtered : _.take(filtered, limit)
  }

  async find (query, fullQuery = false, limit = -1) {
    const queryParams = _.get(query, 'query', false)
    let urlParams = _.omit(_.get(query, 'urlParams', false), ['keepPassword', 'page', 'limit'])
    urlParams = _.isEmpty(urlParams) ? false : urlParams
    const response = await this.list(queryParams, fullQuery, urlParams)
    if (fullQuery) {
      _.set(response, 'results', this.filterRecordsFromResponse(response, queryParams, limit))
      _.set(response, 'count', _.get(response, 'results.length', 0))
      return response
    }
    return _.get(response, 'results', false)
  }

  async findOne (query, _fullQuery = false) {
    const response = await this.client.get({url: `${this.url}?_id=${_.get(query, '_id', false)}`})
    const record = _.get(response, 'results[0]', false)
    return record ? _.get(this.mapXpkitIdsToCmsIds(record), 'resource', false) : false
  }
}

module.exports = XpkitCollection
