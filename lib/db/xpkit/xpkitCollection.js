// const path = require('path')
const sift = require('sift')
const _ = require('lodash')
// const path = require('path')
// const logger = new (require(path.join(__dirname, 'logger')))()
const XpkitClient = require('./xpkitClient')

class XpkitCursor {
  constructor (collection, query) {
    this.collection = collection
    this.query = query
    // console.warn(`New XpkitCursor with query:`, query)
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
      // console.warn(`\n\n\nno more pages\n\n\n`)
      return
    }
    if (_.get(this.documents, 'length', 0) !== 0 && this._currentDocument < this.documents.length) {
      this._currentDocument++
      const record = this.getCurrentDocument()
      // console.warn(`RETURN NEXT DOCUMENT ${this._currentDocument}`)
      return record
    }
    if (this._next !== 0) {
      _.set(this.query, 'query.x__token', this._next)
    }
    const response = await this.collection.find(this.query, true)
    this._next = _.get(response, 'next_token', null)
    this._currentDocument = 0
    // console.warn(`\n\n\n\nnext is now ${this._next}\n\n\n\n\n`)
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
    // console.warn(`UPDATE ONE - `, key, value)
    _.set(value, 'name', _.get(value, 'name', `${this.collectionName}-${_.get(value, '_id', false)}`))
    const result = await this.client.patch({url: this.urlWithId(value), json: value})
    // console.warn(`UPDATE ONE - after`, result)
    return result
  }

  async insertOne (value) {
    // console.warn(`INSERT ONE - `, value)
    _.set(value, 'name', _.get(value, 'name', `${this.collectionName}-${_.get(value, '_id', false)}`))
    const result = await this.client.post({url: this.url, json: value})
    // console.warn(`INSERT ONE - after`, result)
    return result
  }

  async deleteOne (key, value) {
    // console.warn(`DELETE ONE - `, key, value)
    const result = await this.client.delete({url: this.urlWithId(value)})
    // console.warn(`DELETE ONE - after`, result)
    return result
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
    // console.warn(`formatOptions -----`, url)
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
    // console.warn(`URL PARAMS before = ${withEmptyQuery}`, urlParams)
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

  async list (query = false, fullQuery = false, urlParams = false) {
    let additionalParams = ''
    const withEmptyQuery = this.hasEmptyQuery(urlParams)

    if (urlParams) {
      urlParams = this.formatUrlParams(urlParams, withEmptyQuery)
      // console.warn(`URL PARAMS after = `, urlParams)
      if (!_.isEmpty(urlParams)) {
        additionalParams = `?${_.join(_.map(urlParams, (val, key) => `${key}=${val}`), '&')}`
        // logger.warn(`XPKipCollection - list - found additional params: `, additionalParams)
      }
    }
    const response = await this.client.get({url: `${this.url}${urlParams ? additionalParams : ''}`})
    _.set(response, 'results', this.mapXpkitIdsToCmsIds(_.get(response, 'results', [])))
    if (withEmptyQuery && _.get(response, 'results.length', 0) > 1) {
      // logger.warn(`Detected request with empty query, will return only the first record`)
      _.set(response, 'results', _.first(response.results))
    }
    if (!fullQuery) {
      return _.compact(_.map(_.get(response, 'results', []), (item) => _.get(item, 'resource', false)))
    }
    // logger.warn(`list ${this.collectionName} query - `, query, response)
    return response
  }

  filterRecordsFromResponse (response, query = false, limit = -1) {
    let filtered = _.map(_.get(response, 'results', []), 'resource')
    if (query) {
      filtered = filtered.filter(sift(query))
    }
    if (limit !== -1) {
      return _.take(filtered, limit)
    }
    return filtered
  }

  async find (query, fullQuery = false, limit = -1) {
    const queryParams = _.get(query, 'query', false)
    let urlParams = _.omit(_.get(query, 'urlParams', false), ['unpublished', 'keepPassword', 'page', 'limit'])
    urlParams = _.isEmpty(urlParams) ? false : urlParams
    const response = await this.list(queryParams, fullQuery, urlParams)
    // logger.warn(`FIND - query = `, fullQuery, queryParams, urlParams, response)
    if (fullQuery) {
      _.set(response, 'results', this.filterRecordsFromResponse(response, queryParams, limit))
      _.set(response, 'count', _.get(response, 'results.length', 0))
      // logger.warn(`FIND - result = `, fullQuery, queryParams, urlParams, response)
      return response
    }
    return _.get(response, 'results', false)
  }

  async findOne (query, fullQuery = false) {
    const response = await this.client.get({url: `${this.url}?_id=${_.get(query, '_id', false)}`})
    let record = _.get(response, 'results[0]', false)
    if (!record) {
      return false
    }
    record = _.get(this.mapXpkitIdsToCmsIds(record), 'resource', false)
    return record
  }
}

module.exports = XpkitCollection
