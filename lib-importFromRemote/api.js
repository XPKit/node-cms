// import path from 'path'
import fs from 'fs-extra'
import _ from 'lodash'
import RequestService from './RequestService.js'

export default (config = {}) => {
  config.protocol = _.get(config, 'protocol', 'http://')
  const auth = _.pick(config, ['username', 'password'])
  const request = new RequestService(auth)
  const schemaMap = {}
  const paragraphMap = {}
  const buildUrl = (url)=> `${config.protocol}${config.host}${config.prefix}/${url}`
  return (resource) => {
    return {
      async create (item) {
        return await request.post(buildUrl(`api/${resource}`), item)
      },
      async list (query) {
        return await request.get(buildUrl(`api/${resource}?query=${JSON.stringify(query) || ''}`))
      },
      async update (id, item) {
        return await request.put(buildUrl(`api/${resource}/${id}`), item)
      },
      async remove (id) {
        return await request.delete(buildUrl(`api/${resource}/${id}`))
      },
      async getAttachment (url, outputPath, maxRetries = 10) {
        await request.getAttachment(url, outputPath, maxRetries)
      },
      async createAttachment (recordId, fieldname, filepath, attachment) {
        // console.log(`Uploading ${path.relative(path.resolve('.'), path.normalize(filepath))} ...`)
        const data = new FormData()
        data.append(fieldname, new Blob([fs.readFileSync(filepath)], { type: _.get(attachment, '_contentType') }), _.get(attachment, '_filename' ))
        if (_.get(attachment, '_fields.locale', false)) {
          data.append('locale', attachment._fields.locale)
        }
        if (attachment._filename) {
          data.append('_filename', attachment._filename)
        }
        if (_.get(attachment, 'cropOptions', false)) {
          console.info('detected cropOptions, will add it to the request')
          data.append('cropOptions', JSON.stringify(attachment.cropOptions))
        }
        if (_.get(attachment, 'orderUpdated', false) && _.get(attachment, 'order', false)) {
          console.info('detected orderUpdated, will add it to the request')
          data.append('order', attachment.order)
        }
        return await request.post(buildUrl(`api/${resource}/${recordId}/attachments`), data)
        // return await request.post(buildUrl(`api/${resource}/${recordId}/attachments`), formData)
      },
      async removeAttachment (id, aid) {
        let message
        message = `remove ${aid} ...`
        console.log(message)
        const body = await request.delete(buildUrl(`api/${resource}/${id}/attachments/${aid}`))
        console.log(`${message} done`)
        return body
      },
      async login () {
        const url = buildUrl('admin/login')
        console.warn('will login with ', url, auth)
        const result = await request.post(url, {username: auth.username, password: auth.password})
        request.setAuth(_.get(result, 'token', false))
        return result
      },
      async resources () {
        const resources = await request.get(buildUrl('resources?listAttachments=true'))
        _.each(resources, resource => {
          schemaMap[resource.name] = resource.schema
        })
        return resources
      },
      async paragraphs () {
        let paragraphs = []
        const url = buildUrl('admin/paragraphs')
        try {
          paragraphs = await request.get(url)
          _.each(paragraphs, paragraph => {
            paragraphMap[paragraph.title] = paragraph.schema
          })
        } catch (error) {
          console.error(`Couldn't get paragraphs from: ${url}`, error)
        }
        return paragraphs
      },
      getUniqueKeys () {
        const uniqueKeyField = _.filter(schemaMap[resource], item => item.unique || item.xlsxKey)
        if (_.isEmpty(uniqueKeyField)) {
          throw new Error(`${this.name} - didn't have unique key field`)
        }
        return _.map(uniqueKeyField, 'field')
      }
    }
  }
}
