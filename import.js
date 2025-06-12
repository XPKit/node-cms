#!/usr/bin/env node

'use strict'

const program = require('commander')
const _ = require('lodash')
const path = require('path')
const fs = require('fs-extra')
const logger = new (require(path.join(__dirname, 'lib/logger')))()
const { GoogleSpreadsheet } = require('google-spreadsheet')
const md5File = require('md5-file')
const prompt = require('prompt')
const pAll = require('p-all')
const {setTimeout} = require('node:timers/promises')
const { JWT } = require('google-auth-library')

const h = require('./lib-import/helper')
const Api = require('./lib-import/api')

const pkg = require('./package.json')

program.on('--help', () => {
  console.log('')
  console.log('  Examples:')
  console.log('')
  console.log('    $ cms-import ./dev.json username:password')
  console.log('')
})

program
  .version(pkg.version)
  .usage('<config json> <username:password>')
  .option('-y, --yes', 'Assume Yes to all queries and do not prompt')
  .option('-s, --skip', 'skip downloading gsheet files')
  .option('-c, --createFolders', 'skip downloading gsheet files')
  .option('-o, --createOnly', 'create only')
  .parse(process.argv)

if (!program.args[0] || !program.args[1] || !/^(.+):(.+)$/.test(program.args[1])) {
  program.help()
  process.exit(1)
}

class ImportManager {
  constructor (config, auth) {
    this.config = config
    this.config.protocol = this.config.protocol || 'http://'
    this.api = Api(this.config, auth)
    this.schemaMap = {}
    this.data = {}
    this.binaryMap = {}
    this.cmsRecordsMap = {}
    this.attachmentMap = {}
    this.init()
  }

  async init () {
    // ---------------------- start populating ------------------------------
    let endAllProcess = h.startProcess('Populating data to %s%s ... ... ', this.config.protocol, this.config.host)
    try {
      if (!program.createFolders) {
        await this.askConfirmation()
      }
      await this.checkConnection()
      await this.loadDataFromSpreadSheet()
      await this.checkDuplicatedRecord()
      if (program.createFolders) {
        await this.createDummyFolders()
      } else {
        await this.downloadBinaries()
        const createdRecordsMap = await this.createDummyRecords()
        if (!program.createOnly) {
          await this.deleteUnusedRecords()
        }
        await this.updateRecords(program.createOnly ? createdRecordsMap : null)
      }
    } catch (error) {
      logger.error(_.get(error, 'response.body', error.message || error))
    }

    endAllProcess('done')
  }

  async askConfirmation () {
    if (program.yes) {
      return
    }
    let schema = {
      name: 'confirm',
      description: `Are you sure you want to seed to this environment (${program.args[0]}) to ${this.config.protocol}${this.config.host}? [yes/no]`,
      type: 'string',
      pattern: /^(yes|no)$/i,
      message: 'yes / no',
      required: true
    }
    let ans =  {confirm: 'no'}
    try {
      ans = await Q.ninvoke(prompt, 'get', schema)
    } catch (error) {}
    if (ans.confirm.toLowerCase() !== 'yes') {
      console.log(ans.confirm)
      process.exit(1)
    }
  }

  async checkConnection () {
    logger.info('')
    logger.info('### Check Server Connection ###')
    let endProcess = h.startProcess(`Check server connection ${this.config.protocol}${this.config.host} ... ... `)
    let resources = await this.api().resources()
    _.each(resources, item => {
      let schema = item.schema
      if (_.isArray(item.locales)) {
        _.each(schema, field => {
          if (field.localised || _.isUndefined(field.localised)) {
            field.locales = item.locales
          }
        })
      }
      this.schemaMap[item.title] = schema
    })
    endProcess('done')
  }

  async loadDataFromSpreadSheet () {
    const resourceList = await this.getResourceList()
    await this.downloadDataFromResourceList(resourceList)
    await this.loadDataFromCachedJson(resourceList)
  }

  async getResourceList () {
    logger.info('')
    logger.info('### Preparing data from gsheet ###')
    let endProcess = h.startProcess('Get populating resources list ... ... ')
    let resourcesList = config.resources
    resourcesList = _.compact(_.map(resourcesList, key => ({ id: key })))
    endProcess('done')
    return resourcesList
  }

  async downloadDataFromResourceList (resourceList) {
    // get jwt client to check file
    const jwtClient = new JWT({
      email: this.config.oauth.email,
      key: fs.readFileSync(this.config.oauth.keyFile, 'utf-8'),
      scopes: [
        'https://www.googleapis.com/auth/drive'
      ],
      subject: null
    })
    await jwtClient.authorize()
    await pAll(_.map(resourceList, sheet => {
      return async () => {
        let endProcess = h.startProcess(`Download data from gsheet (${sheet.id}) ... ... `)
        if (_.isEmpty(config.gsheetId)) {
          throw new Error('gsheetId or gsheet is not defined in config file')
        } else if (program.skip) {
          return endProcess('skip')
        }
        let jsonFile = path.join(__dirname, 'cached', `${sheet.id}-active.json`)
        if (!fs.existsSync(path.dirname(jsonFile))) {
          fs.mkdirpSync(path.dirname(jsonFile))
        }
        let jsonLastModified = null
        let gsheetLastModified = null
        if (fs.existsSync(jsonFile)) {
          jsonLastModified = fs.statSync(jsonFile).mtime
        }
        if (jsonLastModified) {
          gsheetLastModified = await this.getGsheetLastModifiedDate(config.gsheetId, jwtClient)
          if (jsonLastModified && gsheetLastModified < jsonLastModified) {
            return endProcess('cached')
          }
          logger.warn(`${sheet.id} on google drive is updated`)
        }
        const doc = new GoogleSpreadsheet(this.config.gsheetId)
        await doc.useServiceAccountAuth({
          client_email: config.oauth.email,
          private_key: fs.readFileSync(config.oauth.keyFile, 'utf-8')
        })
        await doc.loadInfo()
        const gsheet = doc.sheetsByTitle[sheet.id]
        await gsheet.loadCells()
        const rows = {}
        _.each(_.range(gsheet.rowCount), rowIdx => {
          _.each(_.range(gsheet.columnCount), columnIdx => {
            let value = gsheet.getCell(rowIdx, columnIdx).formattedValue
            if (value !== null) {
              _.setWith(rows, `${rowIdx + 1}.${columnIdx + 1}`, value, Object)
            }
          })
        })
        fs.writeJsonSync(jsonFile, rows)
        return endProcess('done')
      }
    }), {concurrency: 1})
  }

  async getGsheetLastModifiedDate (gsheetId, jwtClient) {
    if (_.isEmpty(jwtClient.credentials.access_token)) {
      throw new Error('jwt is not ready')
    }
    const options = {
      headers: {
        authorization: `Bearer ${jwtClient.credentials.access_token}`
      }
    }
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${gsheetId}?fields=modifiedTime`, options)
    const data = await response.json()
    return new Date(data.modifiedTime)
  }

  async loadDataFromCachedJson (resourceList) {
    return await pAll(_.map(resourceList, sheet => {
      return async () => {
        let endProcess = h.startProcess(`Get Data from cached json ${sheet.id} ... ... `)
        let jsonPath = path.join(__dirname, 'cached', `${sheet.id}-active.json`)
        if (!fs.existsSync(jsonPath)) {
          throw new Error(`${jsonPath} not exists`)
        }
        const uniqueKeys = this.api(sheet.id).getUniqueKeys()
        let rows = fs.readJsonSync(jsonPath)
        let schema = this.schemaMap[sheet.id]
        const isTranspose = rows['1']['1'] === 'transpose'
        if (isTranspose) {
          let newRows = {}
          _.each(rows, (row, y) => {
            _.each(row, (value, x) => {
              _.set(newRows, `${x}.${y}`, value)
            })
          })
          rows = newRows
        }
        let header = rows['1']
        delete rows['1']
        let list = []
        let binaryList = []
        _.each(rows, row => {
          let binaryObj = {}
          let obj = {}
          let gsheetObj = {}
          _.each(row, (value, key) => _.set(gsheetObj, _.trim(header[key]), value))
          if (_.isEmpty(_.pick(gsheetObj, uniqueKeys))) {
            gsheetObj = _.omit(gsheetObj, uniqueKeys)
            return
          }
          if (uniqueKeys.length === 1) {
            const uniqueKey = _.first(uniqueKeys)
            let subKeys = _.tail(gsheetObj[uniqueKey].split('.'))
            if (!_.isEmpty(subKeys)) {
              const otherValues = _.omit(gsheetObj, uniqueKey)
              gsheetObj = {
                [uniqueKey]: gsheetObj[uniqueKey]
              }
              _.set(gsheetObj, `${subKeys.join('.')}`, otherValues)
            }
          }
          _.each(schema, item => {
            if (_.includes(['file', 'image'], item.input)) {
              let bv = _.get(gsheetObj, item.field)
              if (!_.isUndefined(bv)) {
                _.set(binaryObj, item.field, bv)
              }
              return
            }
            if (item.locales) {
              _.each(item.locales, (locale) => {
                let v = _.get(gsheetObj, `
                  ${item.field}.${locale}`)
                v = h.convertData(v, item.input)
                _.set(obj, `${item.field}.${locale}`, v)
              })
            } else {
              let v = _.get(gsheetObj, item.field)
              v = h.convertData(v, item.input)
              _.set(obj, item.field, v)
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
        this.data[sheet.id] = list
        this.binaryMap[sheet.id] = binaryList
        endProcess('done')
      }
    }))
  }

  async checkDuplicatedRecord () {
    let endProcess = h.startProcess('Check duplicated records ... ... ')
    let duplicatedMap = {}
    _.each(this.data, (data, resource) => {
      const uniqueKeys = this.api(resource).getUniqueKeys()
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
      throw new Error('Dulplicated records')
    }
    endProcess('done')
  }

  async createDummyFolders () {
    logger.info('')
    logger.info('### Create dummy folders ###')
    let funcs = _.map(this.data, (data, resource) => {
      return async () => {
        let endProcess = h.startProcess('Add dummy records %s ... ... ', resource)
        const uniqueKeys = this.api(resource).getUniqueKeys()
        const fields = _.filter(this.schemaMap[resource], item => _.includes(['image', 'file'], item.input))
        _.each(data, item => {
          _.each(fields, field => {
            const folderPath = path.resolve(path.join('.', resource, _.get(item, _.first(uniqueKeys)), field.field))
            fs.ensureDirSync(folderPath)
          })
        })
        endProcess('done')
      }
    })
    return await pAll(funcs, {concurrency: 1})
  }

  async downloadBinaries () {
    logger.info('')
    logger.info('### Download binaries ###')
    let funcs = _.map(this.binaryMap, (data, resource) => {
      return async () => {
        let endProcess = h.startProcess('download binaries for %s ... ... ', resource)
        const uniqueKeys = this.api(resource).getUniqueKeys()
        let funcs2 = []
        _.each(data, item => {
          _.each(_.omit(item, uniqueKeys), (link, field) => {
            if (!_.isEmpty(link)) {
              funcs2.push(async () => {
                const filename = path.basename(_.first(link.split('?')))
                const filePath = path.resolve(path.join('.', resource, _.get(item, _.first(uniqueKeys)), field, filename))
                let endSubProcess
                try {
                  if (!fs.existsSync(filePath)) {
                    endSubProcess = h.startProcess(`downloading binary file ${link} ... ...`)
                    const response = await fetch(link, {
                      headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36'
                      }
                    })
                    const buffer = await response.arrayBuffer()
                    await fs.ensureDir(path.dirname(filePath))
                    await fs.writeFile(filePath, Buffer.from(buffer))
                    endSubProcess('done')
                    await setTimeout(200)
                  }
                } catch (error) {
                  logger.error(_.get(error, 'response.body', error))
                  endSubProcess('error')
                }
              })
            }
          })
        })
        await pAll(funcs2, {concurrency: 1})
        endProcess(`${funcs2.length} binary downloaded`)
      }
    })
    return await pAll(funcs, {concurrency: 1})
  }

  async getRelationMap (resource) {
    let schema = this.schemaMap[resource]
    const relationMap = {}
    const relationResources = _.uniq(_.compact(_.map(schema, item => _.isString(item.source) && item.source)))
    await pAll(_.map(relationResources, resource => {
      return async () => {
        relationMap[resource] = await this.api(resource).list()
      }
    }), {concurrency: 1})
    return relationMap
  }

  async getNormalizedRecords (resource, relationMap) {
    let schema = this.schemaMap[resource]
    let list = await this.api(resource).list()
    list = _.map(list, item => {
      _.each(schema, field => {
        let value = _.get(item, field.field)
        if (!_.isUndefined(value)) {
          if (_.isString(field.source)) {
            const relationList = relationMap[field.source]
            const uniqueKeys = this.api(field.source).getUniqueKeys()
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

  async createDummyRecords () {
    logger.info('')
    logger.info('### Create dummy new records ###')

    const createdListMap = {}
    let funcs = _.map(this.data, (data, resource) => {
      return async () => {
        let endProcess = h.startProcess('Add dummy records %s ... ... ', resource)
        const uniqueKeys = this.api(resource).getUniqueKeys()
        let schema = this.schemaMap[resource]
        const relationMap = await this.getRelationMap(resource)
        const list = await this.getNormalizedRecords(resource, relationMap)
        let existingKeys = _.map(list, item => _.pick(item, uniqueKeys))
        let newKeys = null
        newKeys = _.map(data, item => _.pick(item, uniqueKeys))
        newKeys = _.filter(newKeys, item => !_.find(existingKeys, item))
        let funcs2 = _.map(newKeys, key => {
          return async () => {
            let createObject = {}
            _.each(schema, field => {
              let value = _.get(key, field.field)
              if (!_.isUndefined(value)) {
                if (_.isString(field.source)) {
                  const relationList = relationMap[field.source]
                  const uniqueKeys = this.api(field.source).getUniqueKeys()
                  const uniqueKey = _.first(uniqueKeys)
                  const item = _.find(relationList, {[uniqueKey]: value})
                  if (item) {
                    value = item._id
                  }
                }
                _.set(createObject, field.field, value)
              }
            })
            return await this.api(resource).create(createObject)
          }
        })
        createdListMap[resource] = await pAll(funcs2, {concurrency: 1})
        endProcess(`${newKeys.length} records created`)
      }
    })
    await pAll(funcs, {concurrency: 1})
    return createdListMap
  }

  async deleteUnusedRecords () {
    // ---------------------- Delete unused records ------------------------------
    logger.info('')
    logger.info('### Delete unused records ###')
    let funcs = _.map(this.data, (data, resource) => {
      return async () => {
        let endProcess = h.startProcess('remove old records %s ... ... ', resource)
        const uniqueKeys = this.api(resource).getUniqueKeys()
        let oldRecords = null
        const relationMap = await this.getRelationMap(resource)
        const list = await this.getNormalizedRecords(resource, relationMap)
        let oldKeys = _.map(list, item => _.pick(item, uniqueKeys))
        let existingKeys = _.map(data, item => _.pick(item, uniqueKeys))
        oldKeys = _.filter(oldKeys, key => !_.find(existingKeys, key))
        oldRecords = _.map(oldKeys, (item) => _.find(list, item))
        let funcs2 = _.map(oldRecords, (item) => {
          return async () => {
            await this.api(resource).remove(item._id)
            logger.warn(`${item._id} (${JSON.stringify(_.pick(item, uniqueKeys))}) removed`)
          }
        })
        await pAll(funcs2, {concurrency: 1})
        endProcess(`${oldRecords.length} records removed`)
      }
    })
    return await pAll(funcs, {concurrency: 1})
  }

  async updateRecords (createdRecordsMap) {
    await this.cacheCmsRecords()
    await this.updateCmsRecords(createdRecordsMap)
    await this.loadAttachmentMapData()
    await this.createCmsRecordAttachments(createdRecordsMap)
    await this.deleteCmsDeleteAttachments(createdRecordsMap)
  }

  async cacheCmsRecords () {
    logger.info('')
    logger.info('### cache cms records ###')
    let cachingList = _.keys(this.data)
    _.each(cachingList, resource => {
      let list = _.compact(_.map(this.schemaMap[resource], (item) => _.isString(item.source) && item.source))
      cachingList = _.union(cachingList, list)
    })
    let funcs = _.map(cachingList, resource => {
      return async () => {
        let endProcess = h.startProcess('cache cms records %s ... ... ', resource)
        let list = await this.api(resource).list()
        this.cmsRecordsMap[resource] = list
        endProcess(`${list.length} records cached`)
      }
    })
    await pAll(funcs, {concurrency: 1})
    return this.cmsRecordsMap
  }

  async updateCmsRecords (createdRecordsMap) {
    // ---------------------- update records ------------------------------
    logger.info('')
    logger.info('### Update records ###')
    let funcs = _.map(this.data, (data, resource) => {
      return async () => {
        let endProcess = h.startProcess('update records %s ... ... ', resource)
        const uniqueKeys = this.api(resource).getUniqueKeys()
        let schema = this.schemaMap[resource]
        let resourceErrors = []
        _.each(data, item => {
          let errors = []
          _.each(schema, field => {
            if (!_.isString(field.source)) {
              return
            }
            if (field.locales) {
              _.each(field.locales, locale => {
                let v = _.get(item, `${field.field}.${locale}`)
                if (_.isEmpty(v)) {
                  return _.set(item, `${field.field}.${locale}`, null)
                }
                const relationUniqueKeys = this.api(field.source).getUniqueKeys()
                v = h.convertKeyToId(v, field.input, this.cmsRecordsMap[field.source], field.source, relationUniqueKeys, errors)
                _.set(item, `${field.field}.${locale}`, v)
              })
            } else {
              let v = _.get(item, field.field)
              if (_.isEmpty(v)) {
                return _.set(item, field.field, null)
              }
              const relationUniqueKeys = this.api(field.source).getUniqueKeys()
              v = h.convertKeyToId(v, field.input, this.cmsRecordsMap[field.source], field.source, relationUniqueKeys, errors)
              _.set(item, field.field, v)
            }
          })

          errors = _.map(errors, (error) => error += `, in record ${JSON.stringify(_.pick(item, uniqueKeys))}`)
          resourceErrors = resourceErrors.concat(errors)
        })
        if (!_.isEmpty(resourceErrors)) {
          _.each(resourceErrors, (error) => logger.error(error))
        }
        let locales = _.compact(_.uniq(_.flatten(_.map(schema, 'locales'))))
        data = _.compact(_.map(data, excelObject => {
          let cmsObject = _.find(this.cmsRecordsMap[resource], _.pick(excelObject, uniqueKeys))
          let isUpdated = false
          _.each(locales, locale => {
            if (isUpdated) {
              return
            }
            _.each(excelObject[locale], (value, key) => {
              if (isUpdated) {
                return
              } else if (!_.isEqual(value, cmsObject[locale] && cmsObject[locale][key])) {
                isUpdated = true
              }
            })
          })
          if (!isUpdated) {
            let tempObj = _.omit(excelObject, locales)
            _.each(tempObj, (value, key) => {
              if (isUpdated) {
                return
              } else if (!_.isEqual(value, cmsObject[key])) {
                isUpdated = true
              }
            })
          }
          if (!isUpdated) {
            return null
          }
          excelObject._id = cmsObject._id
          return excelObject
        }))
        let funcs2 = _.map(data, item => {
          return async () => {
            if (!createdRecordsMap || _.find(createdRecordsMap[resource], {_id: item._id})) {
              return await this.api(resource).update(item._id, item)
            }
          }
        })
        await pAll(funcs2, {concurrency: 1})
        endProcess(`${data.length} records updated`)
      }
    })
    return await pAll(funcs, {concurrency: 1})
  }

  async loadAttachmentMapData () {
    logger.info('')
    logger.info('### load attachments data ###')
    let seedDataPath = path.resolve('.')
    let list = fs.readdirSync(seedDataPath)
    list = _.map(list, item => ({
      name: item,
      stat: fs.statSync(path.join(seedDataPath, item))
    }))
    list = _.filter(list, (item) => item.stat.isDirectory())
    _.each(list, item => {
      if (_.isEmpty(this.schemaMap[item.name])) {
        return
      }
      const uniqueKeys = this.api(item.name).getUniqueKeys()
      const uniqueKey = _.first(uniqueKeys)
      this.attachmentMap[item.name] = []
      let keyList = fs.readdirSync(path.join(seedDataPath, item.name))
      keyList = _.filter(keyList, key => !_.includes(['.DS_Store', 'desktop.ini', 'Icon\r'], key))
      _.each(keyList, key => {
        let folderPath = path.join(seedDataPath, item.name, key)
        if (!fs.lstatSync(folderPath).isDirectory()) {
          return
        }
        let fieldList = fs.readdirSync(folderPath)
        fieldList = _.filter(fieldList, (key) => !_.includes(['.DS_Store', 'desktop.ini', 'Icon\r'], key))
        _.each(fieldList, field => {
          folderPath = path.join(seedDataPath, item.name, key, field)
          if (!fs.lstatSync(folderPath).isDirectory()) {
            return
          }
          let fileList = fs.readdirSync(folderPath)
          fileList = _.filter(fileList, (key) => !_.includes(['.DS_Store', 'desktop.ini', 'Icon\r'], key))
          _.each(fileList, file => {
            let filePath = path.join(seedDataPath, item.name, key, field, file)
            if (!fs.lstatSync(filePath).isFile()) {
              return
            }
            let attachment
            this.attachmentMap[item.name].push(attachment = {
              resource: item.name,
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
    const funcs = _.map(_.flatten(_.values(this.attachmentMap)), att => {
      return async () => {
        att._md5sum = await md5File(att.file)
      }
    })
    return pAll(funcs, {concurrency: 1})
  }

  async createCmsRecordAttachments (createdRecordsMap) {
    // ---------------------- create attachments ------------------------------
    logger.info('')
    logger.info('### create attachments ###')
    let funcs = _.map(_.keys(this.attachmentMap), resource => {
      return async () => {
        let endProcess = h.startProcess('create attachments %s ... ... ', resource)
        const uniqueKeys = this.api(resource).getUniqueKeys()
        let list = this.attachmentMap[resource]
        let cmsRecordList = this.cmsRecordsMap[resource]
        list = _.filter(list, item => {
          let obj = _.find(cmsRecordList, _.pick(item, uniqueKeys))
          if (!obj) {
            return false
          }
          item._id = obj._id
          return !_.find(obj._attachments, _.pick(item, ['_name', '_md5sum', '_filename']))
        })
        let funcs2 = _.map(list, item => {
          return () => {
            if (!createdRecordsMap || _.find(createdRecordsMap[resource], {_id: item._id})) {
              return this.api(resource).createAttachment(item._id, item._name, item.file)
            }
          }
        })
        await pAll(funcs2, {concurrency: 1})
        endProcess(`${list.length} attachments created)`)
      }
    })
    return pAll(funcs, {concurrency: 1})
  }

  async deleteCmsDeleteAttachments (createdRecordsMap) {
    logger.info('')
    logger.info('### remove attachments ###')
    let funcs = _.map(_.keys(this.data), resource => {
      return async () => {
        let endProcess = h.startProcess('remove attachments %s ... ... ', resource)
        let list = this.attachmentMap[resource]
        let cmsAttachmentList = _.compact(_.flatten(_.map(this.cmsRecordsMap[resource], (item) => _.map(item._attachments, (attach) => _.extend({recordId: item._id}, attach)))))
        cmsAttachmentList = _.filter(cmsAttachmentList, item => {
          let obj = _.find(list, _.extend({_id: item.recordId}, _.pick(item, ['_name', '_md5sum', '_filename'])))
          return obj ? false : true
        })
        let funcs2 = _.map(cmsAttachmentList, (item) => {
          return async () => {
            if (!createdRecordsMap || _.find(createdRecordsMap[resource], {_id: item._id})) {
              return await this.api(resource).removeAttachment(item.recordId, item._id)
            }
          }
        })
        await pAll(funcs2, {concurrency: 1})
        endProcess(`${cmsAttachmentList.length} attachments removed)`)
      }
    })
    await pAll(funcs, {concurrency: 1})
  }
}

let config = require(path.resolve(program.args[0]))
if (config && config.oauth && config.oauth.keyFile) {
  config.oauth.keyFile = path.resolve(config.oauth.keyFile)
}

let [username, password] = program.args[1].split(':')
let auth = {username, password}

exports = new ImportManager(config, auth)
