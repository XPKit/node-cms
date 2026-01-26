const _ = require('lodash')
const pAll = require('p-all')
const { getAttachmentFields, findMatches, convertKeyToId } = require('./utils')
const { loadAttachmentMapData, createCmsRecordAttachments, deleteCmsDeleteAttachments } = require('./attachmentHandler')

async function createDummyRecords(importer) {
  const bar = importer.multibar.create(importer.config.resources.length, 0, { name: 'Creating dummy records' })
  const createdListMap = {}
  await pAll(
    _.map(importer.config.resources, async (resource) => {
      return async () => {
        if (!importer.data[resource]) {
          return false
        }
        const remoteUniqueKeys = importer.remoteApi(resource).getUniqueKeys()
        const schema = importer.remoteSchemaMap[resource].schema
        if (remoteUniqueKeys.length === 0) {
          const firstField = _.get(schema, '[0]')
          if (firstField && !firstField.source) {
            importer.logger.warn(
              `No unique keys for resource ${resource}, using first field "${firstField.field}" as unique key.`,
            )
            remoteUniqueKeys.push(firstField.field)
          } else {
            importer.logger.error(`No unique keys and no fields for resource ${resource}, cannot create records.`)
            createdListMap[resource] = []
            return false
          }
        }
        const createdRecords = await pAll(
          _.map(importer.originalRemoteRecords[resource], (item) => {
            return async () => {
              const recordToCreate = _.pick(item, remoteUniqueKeys)
              try {
                const record = await importer.localApi(resource).create(recordToCreate)
                _.set(importer.remoteToLocalIdMap, `${resource}.${item._id}`, record._id)
                return record
              } catch (error) {
                console.error('Error creating dummy record:', _.get(error, 'response.body', error), recordToCreate)
              }
            }
          }),
          { concurrency: 10 },
        )
        createdListMap[resource] = createdRecords
        bar.increment()
      }
    }),
    { concurrency: 5 },
  )
  return createdListMap
}

async function deleteUnusedRecords(importer) {
  if (importer.options.overwrite) {
    return
  }
  const reversedResources = _.clone(importer.config.resources).reverse()
  const bar = importer.multibar.create(reversedResources.length, 0, { name: 'Delete unused records' })
  return await pAll(
    _.map(reversedResources, (resource) => {
      return async () => {
        if (!importer.data[resource]) {
          return
        }
        const uniqueKeys = importer.localApi(resource).getUniqueKeys()
        const list = await importer.getNormalizedRecords(resource)
        let oldKeys = _.map(list, (item) => _.pick(item, uniqueKeys))
        const existingKeys = _.map(importer.data[resource], (item) => _.pick(item, uniqueKeys))
        oldKeys = _.filter(oldKeys, (key) => !_.find(existingKeys, key))
        const oldRecords = _.map(oldKeys, (item) => _.find(list, item))
        await pAll(
          _.map(oldRecords, (item) => {
            return async () => {
              await importer.localApi(resource).remove(item._id)
              importer.logger.warn(`${item._id} (${JSON.stringify(_.pick(item, uniqueKeys))}) removed`)
            }
          }),
          { concurrency: 10 },
        )
        bar.increment()
      }
    }),
    { concurrency: 1 },
  )
}

function getLocalAndRemote(importer, resource, uniqueKeys, record, createdRecordsMap) {
  const remoteRecord = _.find(importer.originalRemoteRecords[resource], (r) => {
    return _.isEqual(_.pick(r, uniqueKeys), _.pick(record, uniqueKeys))
  })
  if (!remoteRecord) {
    importer.logger.warn(
      `No matching remote record found for local record in resource ${resource}:`,
      _.pick(record, uniqueKeys),
    )
    return {}
  }
  const createdRecord = _.find(createdRecordsMap[resource], (r) => {
    return _.isEqual(_.pick(r, uniqueKeys), _.pick(remoteRecord, uniqueKeys))
  })
  return { remoteRecord, createdRecord }
}

async function processUpdatedRecords(importer, resource, schema, uniqueKeys, data, createdRecordsMap) {
  const locales = _.compact(_.uniq(_.flatten(_.map(schema, 'locales'))))
  let fieldsToUpdate = _.filter(_.map(schema, 'field'), (key) => !_.includes(uniqueKeys, key))
  fieldsToUpdate = _.concat(fieldsToUpdate, ['_id', '_createdAt', '_updatedAt'])
  const attachmentFields = getAttachmentFields(resource, importer.remoteSchemaMap)
  const upatedRecords = await pAll(
    _.map(data, (localRecord) => {
      return async () => {
        const { remoteRecord, createdRecord } = getLocalAndRemote(
          importer,
          resource,
          uniqueKeys,
          localRecord,
          createdRecordsMap,
        )
        if (!remoteRecord || !createdRecord) {
          return
        }
        let toUpdate = _.pick(remoteRecord, fieldsToUpdate)
        _.each(schema, (field) => {
          if (field.localised) {
            if (_.get(field, 'source', false) && _.isArray(field.source)) {
              _.each(locales, (locale) => {
                const localizedField = `${field.field}.${locale}`
                toUpdate[localizedField] = _.get(createdRecord, localizedField, [])
              })
            }
          } else {
            if (!_.get(field, 'source', false)) {
              toUpdate[field.field] = _.get(remoteRecord, field.field, _.get(localRecord, field.field))
            } else if (_.isArray(field.source)) {
              toUpdate[field.field] = _.get(remoteRecord, field.field, [])
            } else {
              if (field.input === 'multiselect') {
                const remoteIds = _.get(remoteRecord, field.field, [])
                const localIds = _.compact(
                  _.map(remoteIds, (remoteRelatedId) =>
                    _.get(importer.remoteToLocalIdMap, `${field.source}.${remoteRelatedId}`, null),
                  ),
                )
                toUpdate[field.field] = localIds
              } else {
                toUpdate[field.field] = convertKeyToId(
                  field,
                  _.get(remoteRecord, field.field),
                  importer.remoteToLocalIdMap,
                  importer.originalRemoteRecords,
                )
              }
            }
          }
        })
        _.each(attachmentFields, (attachmentField, key) => {
          const matches = findMatches(toUpdate, new RegExp(key), attachmentField.field)
          toUpdate = _.omit(
            toUpdate,
            _.map(matches, (match) => match.path),
          )
        })
        try {
          return await importer.localApi(resource).update(createdRecord._id, toUpdate)
        } catch (error) {
          importer.logger.error(
            `Failed to update record ${createdRecord._id} in resource ${resource}:`,
            _.get(error, 'response.body', error),
          )
          return false
        }
      }
    }),
    { concurrency: 10 },
  )
  return _.compact(upatedRecords)
}

async function updateCmsRecords(importer, createdRecordsMap) {
  const bar = importer.multibar.create(importer.config.resources.length, 0, { name: 'Updating records' })
  await pAll(
    _.map(importer.config.resources, (resource) => {
      return async () => {
        if (!importer.data[resource]) {
          return
        }
        const uniqueKeys = importer.remoteApi(resource).getUniqueKeys()
        const schema = importer.localSchemaMap[resource].schema
        const clonedData = _.cloneDeep(importer.data[resource])
        checkForSchemaErrors(importer, resource, schema, clonedData)
        await processUpdatedRecords(importer, resource, schema, uniqueKeys, clonedData, createdRecordsMap)
        bar.increment()
      }
    }),
    { concurrency: 1 },
  )
}

function checkForSchemaErrors(importer, _resource, schema, data) {
  _.each(data, (item) => {
    _.each(schema, (field) => {
      if (!_.isString(field.source)) {
        return
      } else if (field.locales) {
        _.each(field.locales, (locale) => {
          const key = `${field.field}.${locale}`
          const v = _.get(item, key)
          if (_.isEmpty(v)) {
            return _.set(item, key, null)
          }
          _.set(item, key, convertKeyToId(field, v, importer.remoteToLocalIdMap, importer.originalRemoteRecords))
        })
        return
      }
      const v = _.get(item, field.field)
      if (_.isNil(v) || _.isEmpty(v)) {
        return _.set(item, field.field, null)
      } else if (_.isArray(v)) {
        const newValues = _.map(v, (val) =>
          convertKeyToId(field, val, importer.remoteToLocalIdMap, importer.originalRemoteRecords),
        )
        _.set(item, field.field, _.compact(newValues))
      } else {
        _.set(item, field.field, convertKeyToId(field, v, importer.remoteToLocalIdMap, importer.originalRemoteRecords))
      }
    })
  })
}

async function cacheCmsRecords(importer) {
  const relationResources = _.uniq(
    _.compact(
      _.flattenDeep(
        _.map(importer.config.resources, (resource) => _.map(importer.remoteSchemaMap[resource].schema, 'source')),
      ),
    ),
  )
  const cachingList = _.filter(_.union(importer.config.resources, relationResources), (c) => importer.localSchemaMap[c])
  await pAll(
    _.map(cachingList, (resource) => {
      return async () => {
        importer.cmsRecordsMap[resource] = await importer.localApi(resource).list()
      }
    }),
    { concurrency: 5 },
  )
}

async function updateRecords(importer, createdRecordsMap) {
  await cacheCmsRecords(importer)
  await updateCmsRecords(importer, createdRecordsMap)
  await loadAttachmentMapData(importer)
  await createCmsRecordAttachments(importer, createdRecordsMap)
  if (!importer.overwrite) {
    await deleteCmsDeleteAttachments(importer, createdRecordsMap)
  }
}

module.exports = {
  createDummyRecords,
  deleteUnusedRecords,
  updateRecords,
}
