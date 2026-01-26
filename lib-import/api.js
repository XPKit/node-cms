const path = require('node:path')
const fs = require('fs-extra')
const _ = require('lodash')

module.exports = (config, auth) => {
  config.protocol = config.protocol || 'http://'
  const schemaMap = {}
  return (resource) => {
    return {
      create: async (item) => {
        const response = await fetch(`${config.protocol}${config.host}${config.prefix}/api/${resource}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...auth,
          },
          body: JSON.stringify(item),
        })
        return response.json()
      },
      list: async (query) => {
        const response = await fetch(
          `${config.protocol}${config.host}${config.prefix}/api/${resource}?query=${JSON.stringify(query) || ''}`,
          {
            headers: {
              ...auth,
            },
          },
        )
        return response.json()
      },
      update: async (id, item) => {
        const response = await fetch(`${config.protocol}${config.host}${config.prefix}/api/${resource}/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...auth,
          },
          body: JSON.stringify(item),
        })
        return response.json()
      },
      remove: async (id) => {
        const response = await fetch(`${config.protocol}${config.host}${config.prefix}/api/${resource}/${id}`, {
          method: 'DELETE',
          headers: {
            ...auth,
          },
        })
        return response.json()
      },
      createAttachment: async (id, fieldname, filepath) => {
        const message = `uploading ${path.relative(path.resolve('.'), path.normalize(filepath))} ... ....`
        console.log(message)
        const formData = new FormData()
        formData.append(fieldname, fs.createReadStream(filepath))
        const response = await fetch(
          `${config.protocol}${config.host}${config.prefix}/api/${resource}/${id}/attachments`,
          {
            method: 'POST',
            headers: {
              ...auth,
            },
            body: formData,
          },
        )
        return response.json()
      },
      removeAttachment: async (id, aid) => {
        const message = `remove ${aid} ... ....`
        console.log(message)
        const response = await fetch(
          `${config.protocol}${config.host}${config.prefix}/api/${resource}/${id}/attachments/${aid}`,
          {
            method: 'DELETE',
            headers: {
              ...auth,
            },
          },
        )
        const body = await response.json()
        console.log(`${message} done`)
        return body
      },
      resources: async () => {
        const response = await fetch(`${config.protocol}${config.host}${config.prefix}/admin/resources`, {
          headers: {
            ...auth,
          },
        })
        const resources = await response.json()
        _.each(resources, (resource) => {
          schemaMap[resource.name] = resource.schema
        })
        return resources
      },
      getUniqueKeys() {
        const uniqueKeyField = _.filter(schemaMap[resource], (item) => item.unique || item.xlsxKey)
        if (_.isEmpty(uniqueKeyField)) {
          throw new Error(`${this.name} didn't have unique key field`)
        }
        return _.map(uniqueKeyField, 'field')
      },
    }
  }
}
