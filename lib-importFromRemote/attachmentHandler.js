const path = require('path')
const _ = require('lodash')
const fs = require('fs-extra')
const pAll = require('p-all')
const { filterAttachments, md5FileAsync } = require('./utils')

async function downloadBinaries(importer) {
  const bar = importer.multibar.create(_.size(importer.binaryMap), 0, { name: 'Downloading binaries' })
  return await pAll(_.map(importer.binaryMap, (data, resource) => {
    return async () => {
      const uniqueKeys = importer.remoteApi(resource).getUniqueKeys()
      let funcs2 = []
      _.each(data, item => {
        _.each(_.omit(item, uniqueKeys), (attachments, field) => {
          _.each(attachments, (attachment) => {
            funcs2.push(async () => {
              const filename = path.basename(_.first(attachment.url.split('?')))
              const filePath = path.resolve(path.join('.', 'cached', resource, _.get(item, _.first(uniqueKeys)), field, filename))
              try {
                if (!fs.existsSync(filePath)) {
                  await importer.remoteApi().getAttachment(attachment.url, filePath)
                }
              } catch (error) {
                importer.logger.error(_.get(error, 'response.body', error))
              }
            })
          })
        })
      })
      await pAll(funcs2, { concurrency: 5 })
      bar.increment()
    }
  }), { concurrency: 1 })
}

async function loadAttachmentMapData(importer) {
  const bar = importer.multibar.create(1, 0, { name: 'Loading attachment map data' })
  const seedDataPath = path.resolve('./cached')
  let list = fs.readdirSync(seedDataPath)
  _.each(list, name => {
    if (_.isEmpty(importer.localSchemaMap[name]) || !fs.statSync(path.join(seedDataPath, name)).isDirectory()) {
      return
    }
    const uniqueKey = _.first(importer.localApi(name).getUniqueKeys())
    if (!uniqueKey) {
      console.warn(`No unique key for resource ${name}, skipping in loadAttachmentMapData.`)
      return
    }
    importer.attachmentMap[name] = []
    const keyList = filterAttachments(fs.readdirSync(path.join(seedDataPath, name)), importer.attachmentsToIgnore)
    _.each(keyList, key => {
      let folderPath = path.join(seedDataPath, name, key)
      if (!fs.lstatSync(folderPath).isDirectory()) {
        return
      }
      const fieldList = filterAttachments(fs.readdirSync(folderPath), importer.attachmentsToIgnore)
      _.each(fieldList, field => {
        folderPath = path.join(seedDataPath, name, key, field)
        if (!fs.lstatSync(folderPath).isDirectory()) {
          return
        }
        const fileList = filterAttachments(fs.readdirSync(folderPath), importer.attachmentsToIgnore)
        _.each(fileList, file => {
          let filePath = path.join(seedDataPath, name, key, field, file)
          if (!fs.lstatSync(filePath).isFile()) {
            return
          }
          let attachment
          importer.attachmentMap[name].push(attachment = {
            resource: name,
            [uniqueKey]: key,
            file: filePath,
            _name: field,
            _filename: file
          })
          let cmsObject = _.find(importer.cmsRecordsMap[attachment.resource], { [uniqueKey]: attachment[uniqueKey] })
          if (cmsObject) {
            attachment._id = cmsObject._id
          }
        })
      })
    })
  })
  await pAll(_.map(_.flatten(_.values(importer.attachmentMap)), att => {
    return async () => {
      att._md5sum = await md5FileAsync(att.file)
    }
  }), { concurrency: 20 })
  bar.increment()
}

async function createCmsRecordAttachments(importer, createdRecordsMap) {
  const bar = importer.multibar.create(importer.config.resources.length, 0, { name: 'Creating attachments' })
  return pAll(_.map(importer.config.resources, resource => {
    return async () => {
      if (!importer.attachmentMap[resource]) {
        bar.increment()
        return
      }
      const uniqueKeys = importer.localApi(resource).getUniqueKeys()
      let cmsRecordList = importer.cmsRecordsMap[resource]
      let list = _.filter(importer.attachmentMap[resource], item => {
        let obj = _.find(cmsRecordList, _.pick(item, uniqueKeys))
        if (!obj) {
          return false
        }
        item._id = obj._id
        const toFind = _.pick(item, ['_name', '_md5sum', '_filename', '_fields', 'cropOptions'])
        return !_.find(obj._attachments, toFind) && !_.get(obj, item._name, false)
      })
      await pAll(_.map(list, (item) => {
        return async () => {
          if (!createdRecordsMap || _.find(createdRecordsMap[resource], { _id: item._id })) {
            const foundAttachmentData = _.find(importer.binaryMap[resource], (binary) => _.isEqual(_.pick(binary, uniqueKeys), _.pick(item, uniqueKeys)))
            for (const attachment of _.get(foundAttachmentData, item._name, [])) {
              return await importer.localApi(resource).createAttachment(item._id, item._name, item.file, attachment)
            }
          }
        }
      }), { concurrency: 5 })
      bar.increment()
    }
  }), { concurrency: 5 })
}

async function deleteCmsDeleteAttachments(importer, createdRecordsMap) {
  const reversedResources = _.reverse(_.clone(importer.config.resources))
  const bar = importer.multibar.create(reversedResources.length, 0, { name: 'Deleting attachments' })
  return await pAll(_.map(reversedResources, resource => {
    return async () => {
      if (!importer.data[resource]) {
        bar.increment()
        return
      }
      const list = importer.attachmentMap[resource]
      let cmsAttachmentList = _.compact(_.flatten(_.map(importer.cmsRecordsMap[resource], (item) => _.map(item._attachments, (attach) => _.extend({ recordId: item._id }, attach)))))
      cmsAttachmentList = _.filter(cmsAttachmentList, item => {
        return _.isUndefined(_.find(list, _.extend({ _id: item.recordId }, _.pick(item, ['_name', '_md5sum', '_filename']))))
      })
      await pAll(_.map(cmsAttachmentList, (item) => {
        return async () => {
          if (!createdRecordsMap || _.find(createdRecordsMap[resource], { _id: item._id })) {
            return await importer.localApi(resource).removeAttachment(item.recordId, item._id)
          }
        }
      }), { concurrency: 10 })
      bar.increment()
    }
  }), { concurrency: 5 })
}

module.exports = {
  downloadBinaries,
  loadAttachmentMapData,
  createCmsRecordAttachments,
  deleteCmsDeleteAttachments
}
