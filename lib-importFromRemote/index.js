const path = require('path')
const _ = require('lodash')
const fs = require('fs-extra')
const autoBind = require('auto-bind')
const md5File = require('md5-file')
const h = require('./helper')
const Api = require('./api')
const logger = new (require('img-sh-logger'))()
const pAll = require('p-all')

class ImportWrapper {
  constructor () {
    autoBind(this)
    this.progressCallback = null
    this.ongoingImport = false
  }

  init (progressCallback) {
    this.progressCallback = progressCallback
  }

  prepareImport(config, noPrompt, createOnly, askConfirmation) {
    this.config = config
    this.noPrompt = noPrompt
    this.createOnly = createOnly
    this.askConfirmation = askConfirmation
    // Default local/remote to {} if undefined
    const localConfig = this.config.local || {}
    const remoteConfig = this.config.remote || {}
    this.localApi = Api(localConfig)
    this.remoteApi = Api(remoteConfig)
    this.binaryMap = {}
    this.cmsRecordsMap = {}
    this.attachmentMap = {}
    this.localSchemaMap = {}
    this.localParagraphMap = {}
    this.remoteSchemaMap = {}
    this.remoteParagraphMap = {}
    this.remoteRecords = {}
    this.data = {}
    this.attachmentsToIgnore = ['.DS_Store', 'desktop.ini', 'Icon\r']
    //  NOTE: For paragraphs to work, '/admin/paragraphs' should be in config.cms.routesToAuth for both local & remote CMS
  }

  async startImport(config, noPrompt, createOnly, askConfirmation) {
    if (this.ongoingImport) {
      return logger.warn('Ongoing import, will cancel')
    }
    this.ongoingImport = true
    this.prepareImport(config, noPrompt, createOnly, askConfirmation)
    logger.info('Starting import...')
    const importStartedAt = Date.now()
    try {
      if (!noPrompt) {
        await this.askConfirmation()
      }
      await pAll(_.map(['local', 'remote'], (key)=> {
        return async () => {
          await this.checkConnection(_.get(this, `${key}Api`), key === 'remote')
          await this.getSchemaMap(_.get(this, `${key}Api`), _.get(this, `${key}SchemaMap`), _.get(this, `${key}ParagraphMap`), key === 'remote')
        }
      }), {concurrency: 2})
      await this.loadData()
      await this.checkDuplicatedRecord()
      if (this.createFolders) {
        await this.createDummyFolders()
      } else {
        await this.downloadBinaries()
        const createdRecordsMap = await this.createDummyRecords()
        if (!this.createOnly) {
          await this.deleteUnusedRecords()
        }
        await this.updateRecords(this.createOnly ? createdRecordsMap : null)
      }
      logger.info(`Import took ${Date.now() - importStartedAt}ms`)
    } catch (error) {
      logger.error(_.get(error, 'response.body', _.get(error, 'message', error)))
    }
  }

  async loadData () {
    const resourcesToSync = _.filter(this.config.resources, (resource)=> {
      if (!this.localSchemaMap[resource]) {
        logger.error(`${resource} not defined in local node-cms, will not import it`)
        return false
      }
      return this.remoteSchemaMap[resource]
    })
    await this.downloadDataFromResourceList(resourcesToSync)
    await this.loadDataFromCachedJson(resourcesToSync)
  }

  async downloadDataFromResourceList(resourcesToSync) {
    await pAll(_.map(resourcesToSync, (resource)=> {
      return async ()=> {
        const records = await this.remoteApi(resource).list({})
        let jsonFile = path.join(__dirname, 'cached', `${resource}.json`)
        if (!fs.existsSync(path.dirname(jsonFile))) {
          fs.mkdirpSync(path.dirname(jsonFile))
        }
        fs.writeJsonSync(jsonFile, records)
      }
    }), {concurrency: 5})
  }

  getAttachments(record, attachmentName) {
    const attachments = _.get(record, attachmentName, _.filter(_.get(record, '_attachments', []), {_name: attachmentName}))
    return _.compact(_.map(attachments, (attachment)=> {
      if (_.get(attachment, 'url', false)) {
        attachment.url = `${this.buildUrl(this.config.remote, false)}${attachment.url}`
        return _.omit(attachment, ['_id', '_createdAt', '_updatedAt'])
      }
    }))
  }

  getAttachmentFields(resource) {
    const attachmentFields = _.get(this.remoteSchemaMap[resource], '_attachmentFields', false)
    return attachmentFields ? attachmentFields : _.filter(this.remoteSchemaMap[resource].schema, (field)=> _.includes(['file', 'image'], field.input))
  }

  findMatches(obj, regex, field) {
    const results = []
    function traverse(current, path = '') {
      if (current && _.isObject(current)) {
        if (regex.test(path) && _.endsWith(path, field)) {
          results.push({
            path: path,
            value: current
          })
        }
        for (let key in current) {
          const newPath = path ? `${path}.${key}` : key
          if (_.isArray(current)) {
            traverse(current[key], `${path}[${key}]`)
          } else {
            traverse(current[key], newPath)
          }
        }
      }
    }
    traverse(obj)
    return results
  }

  async loadDataFromCachedJson (resourceList) {
    return await pAll(_.map(resourceList, resource => {
      return async () => {
        let endProcess = h.startProcess(`Get Data from cached json ${resource} ...`)
        let jsonPath = path.join(__dirname, 'cached', `${resource}.json`)
        if (!fs.existsSync(jsonPath)) {
          throw new Error(`${jsonPath} doesn't exist`)
        }
        let records = fs.readJsonSync(jsonPath)
        this.remoteRecords[resource] = records
        const uniqueKeys = this.remoteApi(resource).getUniqueKeys()
        const schema = _.filter(_.get(this.remoteSchemaMap[resource], 'schema', []), (field)=> !_.includes(['file', 'image'], field.input))
        const locales = _.get(this.remoteSchemaMap[resource], 'locales', [])
        const attachmentFields = this.getAttachmentFields(resource)
        let list = []
        let binaryList = []
        _.each(records, record => {
          let binaryObj = {}
          let obj = {}
          _.each(attachmentFields, (attachmentField, key)=> {
            if (_.isString(key)) {
              const testRegexp = new RegExp(key)
              const matches = this.findMatches(record, testRegexp, attachmentField.field)
              _.each(matches, (match)=> {
                const newAttachment = _.omit(record, ['_id', '_createdAt', '_updatedAt'])
                if (attachmentField.localised && locales.length > 0) {
                  _.each(locales, (locale)=> {
                    binaryObj[`${match.path}.${locale}`] = this.getAttachments(newAttachment, `${match.path}.${locale}`)
                  })
                } else {
                  const attachments = this.getAttachments(newAttachment, match.path)
                  console.warn('NOT localised attachment field', attachmentField, attachments)
                  if (!_.isUndefined(attachments)) {
                    binaryObj[match.path] = attachments
                  }
                }
              })
            } else {
              const bv = this.getAttachments(record, attachmentField.field)
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
        if (uniqueKeys.length === 1) {
          const uniqueKey = _.first(uniqueKeys)
          const map = _.groupBy(list, item => _.first(item[uniqueKey].split('.')))
          list = _.map(map, (items, key) => {
            let newItem = {}
            _.each(items, item => {
              let subKeys = _.tail(item[uniqueKey].split('.'))
              delete item[uniqueKey]
              if (!_.isEmpty(subKeys)) {
                const subKeyStr = subKeys.join('.')
                _.set(newItem, subKeyStr, _.get(item, subKeyStr))
              } else {
                newItem = item
              }
            })
            return {[uniqueKey]: key, ...newItem}
          })
        }
        this.data[resource] = list
        this.binaryMap[resource] = binaryList
        endProcess('done')
      }
    }))
  }

  async checkDuplicatedRecord () {
    let endProcess = h.startProcess('Check duplicated records ...')
    let duplicatedMap = {}
    _.each(this.data, (data, resource) => {
      const uniqueKeys = this.remoteApi(resource).getUniqueKeys()
      let dataMap = _.countBy(data, (item) => JSON.stringify(_.pick(item, uniqueKeys)))
      dataMap = _.omitBy(dataMap, (value) => value === 1)
      if (!_.isEmpty(dataMap)) {
        duplicatedMap[resource] = _.keys(dataMap)
      }
    })
    if (!_.isEmpty(duplicatedMap)) {
      _.each(duplicatedMap, (list, key) => {
        _.each(list, item => logger.warn`resource (${key}) has duplicate record (${item})`)
      })
      throw new Error('Duplicated records')
    }
    endProcess('done')
  }

  async createDummyFolders () {
    logger.info('### Create dummy folders ###')
    return await pAll(_.map(this.data, (data, resource) => {
      return async () => {
        let endProcess = h.startProcess(`Add dummy folders ${resource}...`)
        const uniqueKeys = this.remoteApi(resource).getUniqueKeys()
        const fields = _.filter(this.remoteSchemaMap[resource], item => _.includes(['image', 'file'], item.input))
        _.each(data, item => {
          _.each(fields, field => {
            const folderPath = path.resolve(path.join('.', resource, _.get(item, _.first(uniqueKeys)), field.field))
            fs.ensureDirSync(folderPath)
          })
        })
        endProcess('done')
      }
    }), {concurrency: 1})
  }

  async downloadBinaries () {
    logger.info('### Download binaries ###')
    return await pAll(_.map(this.binaryMap, (data, resource) => {
      return async () => {
        let endProcess = h.startProcess(`download binaries for ${resource}...`)
        const uniqueKeys = this.remoteApi(resource).getUniqueKeys()
        let funcs2 = []
        _.each(data, item => {
          _.each(_.omit(item, uniqueKeys), (attachments, field) => {
            _.each(attachments, (attachment)=> {
              funcs2.push(async () => {
                const filename = path.basename(_.first(attachment.url.split('?')))
                const filePath = path.resolve(path.join('.', 'cached', resource, _.get(item, _.first(uniqueKeys)), field, filename))
                let endSubProcess
                try {
                  if (!fs.existsSync(filePath)) {
                    endSubProcess = h.startProcess(`downloading binary file ${attachment.url} ...`)
                    await this.remoteApi().getAttachment(attachment.url, filePath)
                    endSubProcess('done')
                  }
                } catch (error) {
                  logger.error(_.get(error, 'response.body', error))
                  endSubProcess('error')
                }
              })
            })
          })
        })
        await pAll(funcs2, {concurrency: 5})
        endProcess(`${funcs2.length} binary downloaded`)
      }
    }), {concurrency: 1})
  }

  async createDummyRecords () {
    logger.info('### Create dummy new records ###')
    const createdListMap = {}
    await pAll(_.map(this.data, (data, resource) => {
      return async () => {
        let endProcess = h.startProcess(`Add dummy records ${resource}...`)
        const uniqueKeys = this.remoteApi(resource).getUniqueKeys()
        let schema = this.remoteSchemaMap[resource].schema
        const relationMap = await this.getRelationMap(resource)
        const list = await this.getNormalizedRecords(resource, relationMap)
        let existingKeys = _.map(list, item => _.pick(item, uniqueKeys))
        let newKeys = null
        newKeys = _.map(data, item => _.pick(item, uniqueKeys))
        newKeys = _.filter(newKeys, item => !_.find(existingKeys, item))
        createdListMap[resource] = await pAll(_.map(newKeys, key => {
          return async () => {
            let createObject = {}
            _.each(schema, field => {
              try {
                let value = _.get(key, field.field)
                if (!_.isUndefined(value)) {
                  if (_.isString(field.source) ) {
                    const relationList = relationMap[field.source]
                    const uniqueKeys = this.remoteApi(field.source).getUniqueKeys()
                    const uniqueKey = _.first(uniqueKeys)
                    const item = _.find(relationList, {[uniqueKey]: value})
                    if (item) {
                      value = item._id
                    }
                  }
                  _.set(createObject, field.field, value)
                }
              } catch (error) {
                logger.error('ERROR: ', error)
              }
            })
            return await this.localApi(resource).create(createObject)
          }
        }), {concurrency: 10})
        endProcess(`${newKeys.length} records created`)
      }
    }), {concurrency: 1})
    logger.info('### All dummy records created ###')
    return createdListMap
  }

  async getRelationMap (resource) {
    let schema = this.remoteSchemaMap[resource]
    const relationMap = {}
    const relationResources = _.uniq(_.compact(_.map(schema, item => {
      if (_.isString(_.get(item, 'source', false))) {
        return item.source
      }
    })))
    await pAll(_.map(relationResources, resource => {
      return async () => {
        relationMap[resource] = await this.remoteApi(resource).list()
      }
    }), {concurrency: 1})
    return relationMap
  }

  async getNormalizedRecords (resource, relationMap) {
    let schema = _.compact(this.remoteSchemaMap[resource])
    let list = await this.localApi(resource).list()
    list = _.map(list, item => {
      _.each(schema, field => {
        let value = _.get(item, field.field)
        if (!_.isUndefined(value)) {
          if (_.isString(field.source)) {
            const relationList = relationMap[field.source]
            const uniqueKeys = this.localApi(field.source).getUniqueKeys()
            const uniqueKey = _.first(uniqueKeys)
            const item = _.find(relationList, {_id: value})
            value = item && item[uniqueKey]
          }
          _.set(item, field.field, value)
        }
      })
      return item
    })
    return list
  }

  async deleteUnusedRecords () {
    logger.info('### Delete unused records ###')
    return await pAll(_.map(this.data, (data, resource) => {
      return async () => {
        let endProcess = h.startProcess(`remove old records ${resource}...`)
        const uniqueKeys = this.localApi(resource).getUniqueKeys()
        let oldRecords = null
        const relationMap = await this.getRelationMap(resource)
        const list = await this.getNormalizedRecords(resource, relationMap)
        let oldKeys = _.map(list, item => _.pick(item, uniqueKeys))
        let existingKeys = _.map(data, item => _.pick(item, uniqueKeys))
        oldKeys = _.filter(oldKeys, key => !_.find(existingKeys, key))
        oldRecords = _.map(oldKeys, (item) => _.find(list, item))
        await pAll(_.map(oldRecords, (item) => {
          return async () => {
            await this.localApi(resource).remove(item._id)
            logger.warn(`${item._id} (${JSON.stringify(_.pick(item, uniqueKeys))}) removed`)
          }
        }), {concurrency: 10})
        endProcess(`${oldRecords.length} records removed`)
      }
    }), {concurrency: 1})
  }

  async updateRecords (createdRecordsMap) {
    await this.cacheCmsRecords()
    await this.updateCmsRecords(createdRecordsMap)
    await this.loadAttachmentMapData()
    await this.createCmsRecordAttachments(createdRecordsMap)
    await this.deleteCmsDeleteAttachments(createdRecordsMap)
  }

  async cacheCmsRecords () {
    logger.info('### cache cms records ###')
    let cachingList = _.keys(this.data)
    _.each(cachingList, resource => {
      let list = _.compact(_.map(this.remoteSchemaMap[resource], (item) => {
        if (_.isString(_.get(item, 'source', false))) {
          return item.source
        }
      }))
      cachingList = _.union(cachingList, list)
    })
    await pAll(_.map(cachingList, resource => {
      return async () => {
        let endProcess = h.startProcess(`cache cms records ${resource} ...`)
        this.cmsRecordsMap[resource] = await this.localApi(resource).list()
        endProcess(`${this.cmsRecordsMap[resource].length} records cached`)
      }
    }), {concurrency: 1})
    return this.cmsRecordsMap
  }

  convertKeyToId(field, v, errors) {
    const relationUniqueKeys = this.remoteApi(field.source).getUniqueKeys()
    const foundRemoteRecord = _.find(this.remoteRecords[field.source], {_id: v})
    const objToFind = _.pick(foundRemoteRecord, relationUniqueKeys)
    const foundLocalRecord = _.find(this.cmsRecordsMap[field.source], (r)=> {
      return _.isEqual(_.pick(r, relationUniqueKeys), objToFind)
    })
    if (!foundLocalRecord) {
      errors.push(`record (${v}) not found in resource ${field.source}`)
    }
    return _.get(foundLocalRecord, '_id')
  }

  checkForSchemaErrors(resource, schema, uniqueKeys, data) {
    let resourceErrors = []
    _.each(data, item => {
      let errors = []
      _.each(schema, field => {
        if (!_.isString(field.source)) {
          return
        } else if (field.locales) {
          // NOTE: Kept it for conversion from old node-cms schema to new one (en.name -> name.en)
          _.each(field.locales, locale => {
            const key = `${field.field}.${locale}`
            const v = _.get(item, key)
            if (_.isEmpty(v)) {
              return _.set(item, key, null)
            }
            _.set(item, key, this.convertKeyToId(field, v, errors))
          })
          return
        }
        const v = _.get(item, field.field)
        if (_.isEmpty(v)) {
          return _.set(item, field.field, null)
        }
        _.set(item, field.field, this.convertKeyToId(field, v, errors))
      })
      errors = _.map(errors, (error) => error += `, in record ${JSON.stringify(_.pick(item, uniqueKeys))}`)
      resourceErrors = resourceErrors.concat(errors)
    })
    _.each(resourceErrors, (error) => logger.error(error))
  }

  removeAttachments (obj, attachmentsRegExps) {
    const regexPatterns = _.map(attachmentsRegExps, (pattern)=> new RegExp(pattern))
    const processObject = (object) => {
      if (!object || !_.isObject(object)) {
        return object
      } else if (_.isArray(object)) {
        return object.map(item => processObject(item))
      }
      return Object.fromEntries(
        Object.entries(object)
          .filter(([key]) => !regexPatterns.some(pattern => pattern.test(key)))
          .map(([key, value]) => [key, processObject(value)])
      )
    }
    return processObject(obj)
  }

  async processUpdatedRecords(resource, schema, uniqueKeys, data, createdRecordsMap) {
    const locales = _.compact(_.uniq(_.flatten(_.map(schema, 'locales'))))
    const fieldsToUpdate = _.concat(_.map(schema, 'field'), ['_id', '_createdAt', '_updatedAt'])
    const attachmentFields = this.getAttachmentFields(resource)
    return await pAll(_.map(data, record => {
      return async ()=> {
        let cmsObject = _.find(this.cmsRecordsMap[resource], _.pick(record, uniqueKeys))
        let isUpdated = false
        _.each(schema, (field)=> {
          if (isUpdated) {
            return
          } else if (!_.isEqual(record[field.field], cmsObject[field.field])) {
            isUpdated = true
          }
        })
        _.each(locales, locale => {
          if (isUpdated) {
            return
          }
          _.each(record[locale], (value, key) => {
            if (isUpdated) {
              return
            } else if (!_.isEqual(value, cmsObject[locale] && cmsObject[locale][key])) {
              isUpdated = true
            }
          })
        })
        if (isUpdated) {
          record._id = cmsObject._id
          if (!createdRecordsMap || _.find(createdRecordsMap[resource], {_id: record._id})) {
            let toUpdate = _.pick(record, fieldsToUpdate)
            _.each(attachmentFields, (attachmentField, key)=> {
              if (_.isString(key)) {
                const test = new RegExp(key)
                const matches = this.findMatches(toUpdate, test, attachmentField.field)
                toUpdate = _.omit(toUpdate, _.map(matches, (match)=> match.path))
              }
            })
            // console.warn('will update record ----', record._id)
            try {
              return await this.localApi(resource).update(record._id, toUpdate)
            } catch (error) {
              console.error(`Failed to update record ${record._id} in resource ${resource}:`, error)
              return {}
            }
          }
        }
      }
    }), {concurrency: 10})
  }

  async updateCmsRecords (createdRecordsMap) {
    logger.info('### Update records ###')
    return await pAll(_.map(this.data, (data, resource) => {
      return async () => {
        let endProcess = h.startProcess(`update records ${resource} ...`)
        const uniqueKeys = this.remoteApi(resource).getUniqueKeys()
        const schema = this.localSchemaMap[resource].schema
        this.checkForSchemaErrors(resource, schema, uniqueKeys, data)
        data = await this.processUpdatedRecords(resource, schema, uniqueKeys, data, createdRecordsMap)
        endProcess(`${data.length} records updated`)
      }
    }), {concurrency: 1})
  }

  filterAttachments(list) {
    return _.filter(list, key => !_.includes(this.attachmentsToIgnore, key))
  }

  async loadAttachmentMapData () {
    logger.info('### load attachments data ###')
    const seedDataPath = path.resolve('./cached')
    let list = fs.readdirSync(seedDataPath)
    _.each(list, name => {
      if (_.isEmpty(this.localSchemaMap[name]) || !fs.statSync(path.join(seedDataPath, name)).isDirectory()) {
        return
      }
      const uniqueKey = _.first(this.localApi(name).getUniqueKeys())
      this.attachmentMap[name] = []
      const keyList = this.filterAttachments(fs.readdirSync(path.join(seedDataPath, name)))
      _.each(keyList, key => {
        let folderPath = path.join(seedDataPath, name, key)
        if (!fs.lstatSync(folderPath).isDirectory()) {
          return
        }
        const fieldList = this.filterAttachments(fs.readdirSync(folderPath))
        _.each(fieldList, field => {
          folderPath = path.join(seedDataPath, name, key, field)
          if (!fs.lstatSync(folderPath).isDirectory()) {
            return
          }
          const fileList = this.filterAttachments(fs.readdirSync(folderPath))
          _.each(fileList, file => {
            let filePath = path.join(seedDataPath, name, key, field, file)
            if (!fs.lstatSync(filePath).isFile()) {
              return
            }
            let attachment
            this.attachmentMap[name].push(attachment = {
              resource: name,
              [uniqueKey]: key,
              file: filePath,
              _name: field,
              _filename: file
            })
            let cmsObject = _.find(this.cmsRecordsMap[attachment.resource], {[uniqueKey]: attachment[uniqueKey]})
            if (cmsObject) {
              attachment._id = cmsObject._id
            }
          })
        })
      })
    })
    await pAll(_.map(_.flatten(_.values(this.attachmentMap)), att => {
      return async () => {
        att._md5sum = await md5File(att.file)
      }
    }), {concurrency: 20})
  }

  async createCmsRecordAttachments (createdRecordsMap) {
    logger.info('### create attachments ###')
    return pAll(_.map(_.keys(this.attachmentMap), resource => {
      return async () => {
        let endProcess = h.startProcess(`create attachments ${resource}...`)
        const uniqueKeys = this.localApi(resource).getUniqueKeys()
        let list = this.attachmentMap[resource]
        let cmsRecordList = this.cmsRecordsMap[resource]
        list = _.filter(list, item => {
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
            if (!createdRecordsMap || _.find(createdRecordsMap[resource], {_id: item._id})) {
              const foundAttachmentData = _.find(this.binaryMap[resource], (binary)=> _.isEqual(_.pick(binary, uniqueKeys), _.pick(item, uniqueKeys)))
              for (const attachment of _.get(foundAttachmentData, item._name, [])) {
                return await this.localApi(resource).createAttachment(item._id, item._name, item.file, attachment)
              }
            }
          }
        }), {concurrency: 5})
        endProcess(`${resource} - ${list.length} attachments created`)
      }
    }), {concurrency: 1})
  }

  async deleteCmsDeleteAttachments (createdRecordsMap) {
    return await pAll(_.map(_.keys(this.data), resource => {
      logger.info(`### remove attachments ### ${resource}`)
      return async () => {
        let endProcess = h.startProcess(`remove attachments ${resource}...`)
        let list = this.attachmentMap[resource]
        let cmsAttachmentList = _.compact(_.flatten(_.map(this.cmsRecordsMap[resource], (item) => _.map(item._attachments, (attach) => _.extend({recordId: item._id}, attach)))))
        cmsAttachmentList = _.filter(cmsAttachmentList, item => {
          return _.isUndefined(_.find(list, _.extend({_id: item.recordId}, _.pick(item, ['_name', '_md5sum', '_filename']))))
        })
        await pAll(_.map(cmsAttachmentList, (item) => {
          return async () => {
            if (!createdRecordsMap || _.find(createdRecordsMap[resource], {_id: item._id})) {
              return await this.localApi(resource).removeAttachment(item.recordId, item._id)
            }
          }
        }), {concurrency: 1})
        endProcess(`${cmsAttachmentList.length} attachments removed`)
      }
    }), {concurrency: 1})
  }

  async checkConnection (api, isRemote = false) {
    logger.info('### Check Server Connection ###')
    let endProcess = h.startProcess(`Check ${isRemote ? 'remote' : 'local'} server connection ...`)
    await api().login()
    endProcess('done')
  }

  formatSchema(map, resourcesOrParagraphs) {
    _.each(resourcesOrParagraphs, item => {
      let schema = item.schema
      if (_.isArray(item.locales)) {
        _.each(schema, field => {
          if (field.localised || _.isUndefined(field.localised)) {
            field.locales = item.locales
          }
        })
      }
      map[item.title] = {schema, locales: item.locales}
      if (_.get(item, '_attachmentFields', false)) {
        map[item.title]._attachmentFields = item._attachmentFields
      }
    })
  }

  async getSchemaMap(api, schemaMap, paragraphMap, isRemote = false) {
    logger.info('### Getting schema map ###')
    let endProcess = h.startProcess(`Getting schema map from ${isRemote ? 'remote' : 'local'} server ...`)
    this.formatSchema(schemaMap, await api().resources())
    this.formatSchema(paragraphMap, await api().paragraphs())
    endProcess('done')
  }

  buildUrl(config, withPrefix = true) {
    return `${config.protocol}${config.host}${withPrefix ? config.prefix : ''}`
  }
}

module.exports = ImportWrapper

