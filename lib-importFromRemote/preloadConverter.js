const path = require('path')
const _ = require('lodash')
const fs = require('fs-extra')
const { getFilename, findMatches, getAttachmentFields } = require('./utils')

function getPreloadAttachmentPath(importer, record, resource, uniqueKey, match, locale, attachment) {
  const recordKey = _.get(record, uniqueKey)
  const attachmentFilename = getFilename(attachment)
  if (_.get(importer.config, 'regroupIDs.length', 0) > 0) {
    let regroupedId = _.find(importer.config.regroupIDs, (item) => recordKey.indexOf(item) !== -1)
    if (!regroupedId) {
      regroupedId = _.find(importer.config.regroupIDs, (item) => attachmentFilename.indexOf(item) !== -1)
    }
    if (regroupedId) {
      return path.join(importer.assetsPath, regroupedId, attachmentFilename)
    }
  }
  return path.join(importer.assetsPath, resource, recordKey, `${match.path}${locale ? `.${locale}` : ''}`, attachmentFilename)
}

function copyAttachmentToPreloads(importer, record, resource, uniqueKey, match, locale, attachment) {
  try {
    if (_.isString(attachment) && _.startsWith(attachment, '_attachment://')) {
      return attachment
    }
    const filePath = path.join('./cached', resource, _.get(record, uniqueKey), `${match.path}${locale ? `.${locale}` : ''}`, _.get(attachment, '_id', attachment))
    if (!fs.existsSync(filePath)) {
      throw new Error(`Attachment file does not exist: ${filePath}`)
    }
    const filename = getFilename(attachment)
    if (importer.preloadAssetsMap) {
      const existingEntry = _.find(importer.preloadAssetsMap, { filename: filename })
      if (existingEntry) {
        const exisitingFilePath = `_attachment://assets/${existingEntry.filePath}`
        return exisitingFilePath
      }
    }
    const destPath = getPreloadAttachmentPath(importer, record, resource, uniqueKey, match, locale, attachment)
    const destDir = path.dirname(destPath)
    fs.ensureDirSync(destDir)
    fs.copySync(filePath, destPath)
    if (importer.preloadAssetsMap) {
      importer.preloadAssetsMap[destPath] = filename
    }
    return `_attachment://assets/${resource}/${_.get(record, uniqueKey)}/${match.path}${locale ? `.${locale}` : ''}/${filename}`
  } catch (error) {
    console.error('copyAttachmentToPreloads - Error: ', error)
    console.error('copyAttachmentToPreloads - Error data:', resource, attachment)
    return ''
  }
}

function convertAttachmentsForPreload(importer, resource, locales, uniqueKey, record, attachmentFields) {
  _.each(attachmentFields, (attachmentField, key) => {
    if (_.isString(key)) {
      const testRegexp = new RegExp(key)
      const matches = findMatches(record, testRegexp, attachmentField.field)
      _.each(matches, (match) => {
        if (attachmentField.localised && locales.length > 0) {
          _.each(locales, (locale) => {
            const value = _.get(match.value, `${locale}`, false)
            if (_.isArray(value)) {
              if (value.length === 1) {
                const newUrl = copyAttachmentToPreloads(importer, record, resource, uniqueKey, match, locale, value[0])
                _.set(record, `${match.path}.${locale}`, newUrl)
              } else {
                _.each(value, (v, index) => {
                  const newUrl = copyAttachmentToPreloads(importer, record, resource, uniqueKey, match, locale, v)
                  _.set(record, `${match.path}.${locale}[${index}]`, newUrl)
                })
              }
            } else {
              const newUrl = copyAttachmentToPreloads(importer, record, resource, uniqueKey, match, locale, value)
              _.set(record, `${match.path}.${locale}`, newUrl)
            }
          })
        } else {
          let value = match.value
          const links = []
          _.each(value, (v) => {
            const newUrl = copyAttachmentToPreloads(importer, record, resource, uniqueKey, match, null, v)
            links.push(newUrl)
          })
          _.set(record, match.path, links.length > 1 ? links : _.first(links))
        }
      })
    }
  })
}

function convertRecordForPreload(importer, resource, locales, uniqueKey, record, attachmentFields) {
  record = _.omit(record, ['_local', '_id', '_createdAt', '_updatedAt', '_publishedAt', '_preloadedVersion', '_updatedBy'])
  const schema = _.get(importer.remoteSchemaMap, [resource, 'schema'], [])
  _.each(schema, (field) => {
    if (_.isString(field.source)) {
      const relatedResource = field.source
      const relatedRecords = _.get(importer.remoteRecords, relatedResource, [])
      const relatedUniqueKeys = importer.remoteApi(relatedResource).getUniqueKeys()
      const value = _.get(record, field.field)
      const makeRelationUri = (found) => {
        if (!found) return null
        let uniqueId
        if (relatedUniqueKeys.length === 1) {
          uniqueId = _.get(found, relatedUniqueKeys[0])
        } else {
          uniqueId = relatedUniqueKeys.map(k => _.get(found, k)).join('__')
        }
        return `${relatedResource}://${uniqueId}`
      }
      if (_.isArray(value)) {
        const newValues = _.map(value, (v) => {
          const found = _.find(relatedRecords, { _id: v })
          const uri = makeRelationUri(found)
          return uri || v
        })
        _.set(record, field.field, newValues)
      } else if (!_.isNil(value)) {
        const found = _.find(relatedRecords, { _id: value })
        const uri = makeRelationUri(found)
        if (uri) {
          _.set(record, field.field, uri)
        }
      }
    }
  })
  convertAttachmentsForPreload(importer, resource, locales, uniqueKey, record, attachmentFields)
  return record
}

function getAllFiles(dir, baseDir = null) {
  let results = []
  if (!fs.existsSync(dir)) {
    return results
  } else if (!baseDir) {
    baseDir = path.resolve('./preloads/assets')
  }
  const list = fs.readdirSync(dir)
  _.each(list, filename => {
    const filePath = path.join(dir, filename)
    const stat = fs.statSync(filePath)
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath, baseDir))
    } else {
      results.push({ filePath: path.relative(baseDir, filePath).replace(/\\/g, '/'), filename })
    }
  })
  return results
}

async function convertDataToPreload(importer) {
  const bar = importer.multibar.create(importer.config.resources.length, 0, { name: 'Converting data to preload' })
  const preloadPath = path.resolve('./preloads')
  fs.ensureDirSync(preloadPath)
  importer.assetsPath = path.resolve('./preloads/assets')
  fs.ensureDirSync(importer.assetsPath)
  importer.preloadAssetsMap = []
  const allPreloadFiles = getAllFiles(importer.assetsPath)
  _.each(allPreloadFiles, (v) => {
    importer.preloadAssetsMap.push(v)
  })
  for (const resource of importer.config.resources) {
    let jsonPath = path.join(__dirname, 'cached', `${resource}.json`)
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`${jsonPath} doesn't exist`)
    }
    let items = fs.readJsonSync(jsonPath)
    const filePath = path.join(preloadPath, `${resource}.json`)
    let uniqueKeys = []
    if (importer.remoteApi && importer.remoteApi(resource) && importer.remoteApi(resource).getUniqueKeys) {
      uniqueKeys = importer.remoteApi(resource).getUniqueKeys()
    }
    const uniqueKey = _.first(uniqueKeys) || '_id'
    const attachmentFields = getAttachmentFields(resource, importer.remoteSchemaMap)
    const locales = _.get(importer.remoteSchemaMap[resource], 'locales', [])
    items = _.map(items, record => convertRecordForPreload(importer, resource, locales, uniqueKey, record, attachmentFields))
    fs.writeJsonSync(filePath, { version: 1, forced: true, items }, { spaces: 2 })
    bar.increment()
  }
}

module.exports = {
  convertDataToPreload
}
