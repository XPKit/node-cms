import _ from 'lodash'
import RequestService from '@s/RequestService'

class ResourceService {
  constructor () {
    this.cacheMap = {}
  }

  async cache (resource) {
    const data = await RequestService.get(`${window.location.pathname}../api/${resource}`)
    if (_.get(data, 'userLoggedOut', false)) {
      console.info('Received userLoggedOut from server, will redirect to login page')
      window.location.reload()
      return []
    }
    this.cacheMap[resource] = data
    return this.get(resource)
  }

  get (resource) {
    const data = this.cacheMap[resource]
    if (_.isUndefined(data)) {
      console.info(`resource (${resource}) is not cached`)
    }
    // return _.cloneDeep(data)
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
