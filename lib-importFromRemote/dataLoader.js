const path = require('path')
const _ = require('lodash')
const fs = require('fs-extra')
const pAll = require('p-all')
const h = require('./helper')
const { findMatches, getAttachmentFields, getAttachments } = require('./utils')

async function loadData(importer) {
  const resourcesToSync = _.filter(importer.config.resources, (resource) => {
    if (!importer.localSchemaMap[resource]) {
      importer.logger.error(`${resource} not defined in local node-cms, will not import it`)
      return false
    }
    return importer.remoteSchemaMap[resource]
  })
  if (importer.useCache) {
    importer.logger.info('Use cache option detected, will not download from remote')
  } else {
    await downloadDataFromResourceList(importer, resourcesToSync)
  }
  await loadDataFromCachedJson(importer, resourcesToSync)
}

async function downloadDataFromResourceList(importer, resourcesToSync) {
  const bar = importer.multibar.create(resourcesToSync.length, 0, { name: 'Downloading data' })
  await pAll(_.map(resourcesToSync, (resource) => {
    return async () => {
      const records = await importer.remoteApi(resource).list({})
      const jsonFile = path.join(__dirname, 'cached', `${resource}.json`)
      if (!fs.existsSync(path.dirname(jsonFile))) {
        fs.mkdirpSync(path.dirname(jsonFile))
      }
      fs.writeJsonSync(jsonFile, records)
      bar.increment()
    }
  }), { concurrency: 5 })
}

async function loadDataFromCachedJson(importer, resourceList) {
  const bar = importer.multibar.create(resourceList.length, 0, { name: 'Loading data from cache' })
  return await pAll(_.map(resourceList, resource => {
    return async () => {
      const jsonPath = path.join(__dirname, 'cached', `${resource}.json`)
      if (!fs.existsSync(jsonPath)) {
        throw new Error(`${jsonPath} doesn't exist`)
      }
      const records = fs.readJsonSync(jsonPath)
      importer.remoteRecords[resource] = records
      importer.originalRemoteRecords[resource] = _.cloneDeep(records)

      const uniqueKeys = importer.remoteApi(resource).getUniqueKeys()
      if (!uniqueKeys || uniqueKeys.length === 0) {
        importer.logger.warn(`No unique keys found for resource ${resource}, skipping`)
        bar.increment()
        return
      }
      const uniqueKey = _.first(uniqueKeys)
      const schema = _.filter(_.get(importer.remoteSchemaMap[resource], 'schema', []), (field) => !_.includes(['file', 'image'], field.input))
      const locales = _.get(importer.remoteSchemaMap[resource], 'locales', [])
      const attachmentFields = getAttachmentFields(resource, importer.remoteSchemaMap)
      let list = []
      let binaryList = []
      _.each(records, record => {
        let binaryObj = {}
        let obj = {}
        _.each(attachmentFields, (attachmentField, key) => {
          if (_.isString(key)) {
            const testRegexp = new RegExp(key)
            const matches = findMatches(record, testRegexp, attachmentField.field)
            _.each(matches, (match) => {
              const newAttachment = _.omit(record, ['_id', '_createdAt', '_updatedAt'])
              if (attachmentField.localised && locales.length > 0) {
                _.each(locales, (locale) => {
                  binaryObj[`${match.path}.${locale}`] = getAttachments(newAttachment, `${match.path}.${locale}`, importer.config)
                })
              } else {
                const attachments = getAttachments(newAttachment, match.path, importer.config)
                if (!_.isUndefined(attachments)) {
                  binaryObj[match.path] = attachments
                }
              }
            })
          } else {
            const bv = getAttachments(record, attachmentField.field, importer.config)
            if (!_.isUndefined(bv)) {
              _.set(binaryObj, attachmentField.field, bv)
            }
          }
        })
        _.each(schema, field => {
          if (field.input === 'paragraph') {
            _.set(obj, field.field, _.get(record, field.field))
          } else if (field.locales) {
            _.each(field.locales, (locale) => {
              const v = h.convertData(_.get(record, `${locale}.${field.field}`), field.input)
              _.set(obj, `${field.field}.${locale}`, v)
            })
          } else {
            _.set(obj, field.field, h.convertData(_.get(record, field.field), field.input))
          }
        })
        if (!_.isEmpty(_.pick(obj, uniqueKeys))) {
          list.push(obj)
          if (!_.isEmpty(binaryObj)) {
            binaryList.push(_.extend(_.pick(obj, uniqueKeys), binaryObj))
          }
        }
      })
      const map = _.groupBy(list, item => {
        const key = _.get(item, uniqueKey, '')
        return _.first(key.split('.'))
      })
      list = _.map(map, (items, key) => {
        const baseItem = _.find(items, item => _.get(item, uniqueKey) === key)
        const otherItems = _.filter(items, item => _.get(item, uniqueKey) !== key)
        const merged = _.cloneDeep(baseItem) || {}
        _.forEach(otherItems, item => {
          const itemKey = _.get(item, uniqueKey, '')
          const subKey = _.tail(itemKey.split('.')).join('.')
          if (subKey) {
            _.forEach(item, (value, prop) => {
              if (prop !== uniqueKey) {
                _.set(merged, `${prop}.${subKey}`, value)
              }
            })
          } else {
            _.merge(merged, item)
          }
        })
        _.set(merged, uniqueKey, key)
        return merged
      })
      importer.data[resource] = list
      importer.binaryMap[resource] = binaryList
      bar.increment()
    }
  }))
}

module.exports = {
  loadData
}
