import _ from 'lodash'
import RequestService from '@s/RequestService'
import pAll from 'p-all'

class ResourceService {
  constructor () {
    this.cacheMap = {}
    this.schemas = []
  }

  getCacheKey (resource, limit = -1, page = 1, filtering = false) {
    return `[${resource}][${limit}-${page}${filtering ? `-${filtering}` : ''}]`
  }

  async cache (resource, limit = -1, page = 1, filtering = false) {
    const url =`${window.location.pathname}../api/${resource}?limit=${limit}&page=${page}&filtering=${filtering}`
    const data = await RequestService.get(url)
    if (_.get(data, 'userLoggedOut', false)) {
      console.info('Received userLoggedOut from server, will redirect to login page')
      window.location.reload()
      return []
    }
    const key = this.getCacheKey(resource, limit, page, filtering)
    _.set(this.cacheMap, key, data)
    console.warn(`ResourceService - added in cache ${key}`, data)
    return this.get(resource, limit, page)
  }

  removeFromCache (resource, limit = -1, page = 1, filtering = false) {
    if (limit === -1) {
      // NOTE: Deletes all the cache for that resource
      return _.set(this.cacheMap, `[${resource}]`, undefined)
    }
    const key = this.getCacheKey(resource, limit, page, filtering)
    if (!_.get(this.cacheMap, key, false)) {
      return console.warn(`${key} not found in cache`)
    }
    _.set(this.cacheMap, key, undefined)
  }

  notCached (resource, limit, page) {
    console.info(`resource [${resource}][${limit}-${page}] - is not cached`)
    return {numRecords: 0, records: []}
  }

  getPaging (resource) {
    return _.get(_.find(this.schemas, { title: resource }), 'paging', -1)
  }

  async getExtraSources (resource, forDisplayName = false) {
    let resources = _.values(resource.extraSources)
    const extraResources = (obj) => {
      if (_.isArray(obj)) {
        _.each(obj, item => extraResources(item))
      } else {
        _.each(obj, (value, key) => {
          if (key === 'input') {
            const extraSources = _.get(obj, 'options.extraSources')
            resources.push(..._.values(extraSources))
            if (value === 'select' || value === 'multiselect') {
              const source = _.get(obj, 'source')
              if (_.isString(source)) {
                resources.push(source)
                const schema = this.getSchema(source)
                resources.push(..._.values(schema.extraSources))
              }
            } else if (value === 'paragraph') {
              _.each(_.get(obj, 'options.types'), item => {
                extraResources(item)
                const paragraphSchema = _.get(item, 'schema')
                extraResources(paragraphSchema)
              })
            }
          } else if (key === 'extraSources') {
            resources.push(..._.values(value))
          }
        })
      }
    }
    extraResources(resource.schema)
    resources = _.uniq(resources)
    console.warn(`extraResources ${forDisplayName ? 'for display name' : ''}`, resources)
    if (forDisplayName) {
      console.warn(`found display name ${displayItem}`)
      return await pAll(_.map(resources, item => {
      // TODO: hugo - add the filtering in the cache to get only the needed fields for the records name
        return async () => await this.cache(item, -1, 1, this.displayItemToFields(item, displayItem))
      }), {concurrency: 10})
    }
    const displayItem =  _.get(resource, 'displayItem', false)
    if (!displayItem || displayItem.indexOf('{{#') === -1) {
      return await pAll(_.map(resources, item => {
        return async () => await this.cache(item, -1, 1)
      }), {concurrency: 10})
    }
  }

  displayItemToFields (resource, displayItem) {
    // TODO: hugo - find the fields in which these resources are being used, or get the list when we get the extraResources
    const schema = this.getSchema(resource)
    console.warn('displayItemToFields - before - schema ', schema)
    const strRegex = `{{(${resource}.*?)}}`
    const matches = new RegExp(strRegex, 'g').exec(displayItem)
    console.warn('displayItemToFields - regex matches', strRegex, matches)
    // for (const match of matches) {
    //   console.warn('WATCH ----', match[1])
    // }
  }

  get (resource, limit = -2, page = 1) {
    if (limit === -2) {
      limit = this.getPaging(resource)
    }
    let data = _.get(this.cacheMap, this.getCacheKey(resource, limit, page), undefined)
    if (!_.isUndefined(data)) {
      return data
    }
    if (limit === -1 && page === 1) {
      return this.notCached(resource, limit, page)
    }
    console.warn(`ResourceService - get ${resource} - limit = ${limit} | page = ${page}`)
    data = _.get(this.cacheMap, this.getCacheKey(resource), undefined)
    if (_.isUndefined(data)) {
      return this.notCached(resource, limit, page)
    }
    if (limit !== -1) {
      data.records = _.get(_.chunk(data.records, limit), `[${page - 1}]`, data.records)
    }
    return data
  }

  setSchemas (schemas) {
    this.schemas = schemas
  }

  getSchema (resource) {
    return _.find(this.schemas, { title: resource })
  }
}

export default new ResourceService()
