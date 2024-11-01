const got = require('got')
const path = require('path')
const fs = require('fs-extra')
const _ = require('lodash')

exports = module.exports = (config, auth) => {
  config.protocol = config.protocol || 'http://'
  const schemaMap = {}
  return (resource) => {
    return {
      create: (item) => {
        return got.post(`${config.protocol}${config.host}${config.prefix}/api/${resource}`, {
          ...auth,
          json: item
        }).json()
      },
      list: (query) => {
        return got.get(`${config.protocol}${config.host}${config.prefix}/api/${resource}?query=${JSON.stringify(query) || ''}`, {
          ...auth
        }).json()
      },
      update: (id, item) => {
        return got.put(`${config.protocol}${config.host}${config.prefix}/api/${resource}/${id}`, {
          ...auth,
          json: item
        }).json()
      },
      remove: (id) => {
        return got.del(`${config.protocol}${config.host}${config.prefix}/api/${resource}/${id}`, {
          ...auth
        }).json()
      },
      createAttachment: (id, fieldname, filepath) => {
        let formData, message, obj
        message = `uploading ${path.relative(path.resolve('.'), path.normalize(filepath))} ... ....`
        console.log(message)
        formData = (
          obj = {},
          obj['' + fieldname] = fs.createReadStream(filepath),
          obj
        )
        return got.post(`${config.protocol}${config.host}${config.prefix}/api/${resource}/${id}/attachments`, {
          ...auth,
          formData
        }).json()
      },
      removeAttachment: async (id, aid) => {
        let message
        message = 'remove ' + aid + ' ... ....'
        console.log(message)

        let body = await got.del(`${config.protocol}${config.host}${config.prefix}/api/${resource}/${id}/attachments/${aid}`, {
          ...auth
        }).json()

        console.log(message + 'done')
        return body
      },
      resources: async () => {
        const resources = await got.get(`${config.protocol}${config.host}${config.prefix}/admin/resources`, {
          ...auth
        }).json()
        _.each(resources, resource => {
          schemaMap[resource.name] = resource.schema
        })
        return resources
      },
      getUniqueKeys () {
        const uniqueKeyField = _.filter(schemaMap[resource], item => item.unique || item.xlsxKey)
        if (_.isEmpty(uniqueKeyField)) {
          throw new Error(`${this.name} didn't have unique key field`)
        }
        return _.map(uniqueKeyField, 'field')
      }
    }
  }
}
