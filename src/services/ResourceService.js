import _ from 'lodash'
import RequestService from '@s/RequestService'

class ResourceService {
  constructor () {
    this.cacheMap = {}
    this.paragraphs = {}
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

  async getAll() {
    return await RequestService.get(`${window.location.pathname}resources`)
  }

  async getAllParagraphs() {
    const paragraphs = await RequestService.get(`${window.location.pathname}paragraphs`)
    _.each(paragraphs, (paragraph)=> {
      _.set(this.paragraphs, paragraph.title, paragraph)
    })
    // console.warn('ResourceService - getAllParagraphs', this.paragraphs)
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

  getParagraphSchema(key) {
    return _.get(this.paragraphs, key, false)
  }
}

export default new ResourceService()
