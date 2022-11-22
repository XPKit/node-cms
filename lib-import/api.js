const request = require('request-promise')
const path = require('path')
const fs = require('fs-extra')
const _ = require('lodash')

exports = module.exports = (config, auth) => {
  config.protocol = config.protocol || 'http://'
  const schemaMap = {}
  return (resource) => {
    return {
      create: (item) => {
        return request.post(`${config.protocol}${config.host}${config.prefix}/api/${resource}`, {
          auth: auth,
          json: true,
          body: item
        })
      },
      list: (query) => {
        return request.get(`${config.protocol}${config.host}${config.prefix}/api/${resource}?query=${JSON.stringify(query) || ''}`, {
          auth: auth,
          json: true
        })
      },
      update: (id, item, cb) => {
        return request.put(`${config.protocol}${config.host}${config.prefix}/api/${resource}/${id}`, {
          auth: auth,
          json: true,
          body: item
        })
      },
      remove: (id, cb) => {
        return request.del(`${config.protocol}${config.host}${config.prefix}/api/${resource}/${id}`, {
          auth: auth,
          json: true
        })
      },
      createAttachment: (id, fieldname, filepath, cb) => {
        var formData, message, obj
        message = `uploading ${path.relative(path.resolve('.'), path.normalize(filepath))} ... ....`
        console.log(message)
        formData = (
          obj = {},
          obj['' + fieldname] = fs.createReadStream(filepath),
          obj
        )
        return request.post(`${config.protocol}${config.host}${config.prefix}/api/${resource}/${id}/attachments`, {
          auth: auth,
          json: true,
          formData: formData
        })
      },
      removeAttachment: async (id, aid, cb) => {
        var message
        message = 'remove ' + aid + ' ... ....'
        console.log(message)

        let body = await request.del(`${config.protocol}${config.host}${config.prefix}/api/${resource}/${id}/attachments/${aid}`, {
          auth: auth,
          json: true
        })

        console.log(message + 'done')
        return body
      },
      resources: async (cb) => {
        const resources = await request.get(`${config.protocol}${config.host}${config.prefix}/admin/resources`, {
          auth: auth,
          json: true
        })
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
