const _ = require('lodash')
const path = require('node:path')
const md5File = require('md5-file')

function determineResourceOrder(resources, schemaMap) {
  const graph = new Map()
  const inDegree = new Map()
  for (const resource of resources) {
    graph.set(resource, [])
    inDegree.set(resource, 0)
  }
  for (const resource of resources) {
    const schema = _.get(schemaMap, [resource, 'schema'], [])
    for (const field of schema) {
      if (field.source && resources.includes(field.source)) {
        if (!graph.get(field.source).includes(resource)) {
          graph.get(field.source).push(resource)
          inDegree.set(resource, inDegree.get(resource) + 1)
        }
      }
    }
  }
  const queue = []
  for (const [resource, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(resource)
    }
  }
  const sortedOrder = []
  while (queue.length > 0) {
    const resource = queue.shift()
    sortedOrder.push(resource)
    const neighbors = graph.get(resource)
    for (const neighbor of neighbors) {
      inDegree.set(neighbor, inDegree.get(neighbor) - 1)
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor)
      }
    }
  }
  if (sortedOrder.length !== resources.length) {
    return resources
  }
  return sortedOrder
}

function getFilename(attachment) {
  return _.get(attachment, '_filename', path.basename(_.first(_.get(attachment, 'url', attachment).split('?'))))
}

function findMatches(obj, regex, field) {
  const results = []
  function traverse(value, path = '') {
    if (value && _.isObject(value)) {
      if (regex.test(path) && _.endsWith(path, field)) {
        results.push({ path, value })
      }
      for (const key in value) {
        if (_.isArray(value)) {
          traverse(value[key], `${path}[${key}]`)
        } else {
          traverse(value[key], path ? `${path}.${key}` : key)
        }
      }
    }
  }
  traverse(obj)
  return results
}

function getAttachmentFields(resource, remoteSchemaMap) {
  const attachmentFields = _.get(remoteSchemaMap[resource], '_attachmentFields', false)
  return attachmentFields
    ? attachmentFields
    : _.filter(remoteSchemaMap[resource].schema, (field) => _.includes(['file', 'image'], field.input))
}

function getAttachments(record, attachmentName, config) {
  const attachments = _.get(
    record,
    attachmentName,
    _.filter(_.get(record, '_attachments', []), { _name: attachmentName }),
  )
  return _.compact(
    _.map(attachments, (attachment) => {
      if (_.get(attachment, 'url', false)) {
        if (!_.startsWith(attachment.url, 'http')) {
          attachment.url = `${buildUrl(config.remote, false)}${attachment.url}`
        }
        return _.omit(attachment, ['_id', '_createdAt', '_updatedAt'])
      }
    }),
  )
}

function convertKeyToId(field, v, remoteToLocalIdMap, originalRemoteRecords) {
  const localId = _.get(remoteToLocalIdMap, `${field.source}.${v}`, false)
  if (!localId) {
    const foundRemoteRecord = _.find(originalRemoteRecords[field.source], { _id: v })
    if (!foundRemoteRecord) {
      return null
    }
  }
  return localId || v
}

function buildUrl(config, withPrefix = true) {
  return `${config.protocol}${config.host}${withPrefix ? config.prefix : ''}`
}

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]))
    }
  }
  return { ...target, ...source }
}

function filterAttachments(list, attachmentsToIgnore) {
  return _.filter(list, (key) => !_.includes(attachmentsToIgnore, key))
}

async function md5FileAsync(filePath) {
  return await md5File(filePath)
}

module.exports = {
  determineResourceOrder,
  getFilename,
  findMatches,
  getAttachmentFields,
  getAttachments,
  convertKeyToId,
  buildUrl,
  deepMerge,
  filterAttachments,
  md5FileAsync,
}
