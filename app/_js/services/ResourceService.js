import axios from 'axios/dist/axios.min'
import _ from 'lodash'

class ResourceService {
  constructor () {
    this.cacheMap = {}
  }

  async cache (resource) {
    const {data} = await axios.get(`../api/${resource}`)
    this.cacheMap[resource] = data
    return this.get(resource)
  }

  get (resource) {
    const data = this.cacheMap[resource]
    if (_.isUndefined(data)) {
      console.warn(`resource (${resource}) is not cached`)
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
