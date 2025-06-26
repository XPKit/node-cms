/*
 * CMS Admin API exposed as plugin
 */



const path = require('path')
const _ = require('lodash')
const express = require('express')
const fs = require('fs-extra')
const autoBind = require('auto-bind')
const pAll = require('p-all')
const os = require('os')
const { GoogleSpreadsheet } = require('google-spreadsheet')
const h = require('../../../lib-import/helper')
const logger = new (require('img-sh-logger'))()
const { JWT } = require('google-auth-library')
// got removed - using native fetch
const multer = require('multer')
const xlsx = require('xlsx')

const upload = multer({ dest: os.tmpdir() })

class ImportClass {
  constructor (cms, options) {
    autoBind(this)
    this.cms = cms
    this.cms.$import = this
    this.config = options.import || options
    this.api = cms.api()
    this.schemaMap = {}
    this.data = {}
    this.cachedFolder = path.join(os.tmpdir(), 'node-cms', 'import')
    this.initialize()

  }

  initialize() {
    this.app = express()
    this.app.get('/status', this.onGetStatus)
    this.app.get('/execute', this.onGetExecute)
    this.app.post('/statusXlsx', upload.single('xlsx'), this.onGetStatusXlsx)
    this.app.post('/executeXlsx', upload.single('xlsx'), this.onGetExecuteXlsx)
    _.each(_.keys(this.cms._resources), item => {
      const options = this.api(item).options
      let schema = options.schema
      schema = _.cloneDeep(schema)
      if (_.isArray(options.locales)) {
        _.each(schema, field => {
          if (field.localised || _.isUndefined(field.localised)) {
            field.locales = options.locales
          }
        })
      }
      this.schemaMap[item] = schema
    })

    // add import function
    _.each(this.config.resources, resource => {
      if (_.get(this.cms, `_resources[${resource}]`, false)) {
        this.cms._resources[resource].import = async () => {
          await this.loadDataFromSpreadSheet(resource)
          const importMap = await this.getImportMap(this.config.createOnly)
          await pAll(_.map(importMap, (map, resource) => {
            return async () => {
              if (!_.isEmpty(map.remove)) {
                await pAll(_.map(map.remove, item => {
                  return () => this.api(resource).remove(item._id)
                }), {concurrency: 1})
              }
              if (!_.isEmpty(map.create)) {
                await pAll(_.map(map.create, item => {
                  return () => this.api(resource).create(item)
                }), {concurrency: 1})
              }
              if (!_.isEmpty(map.update)) {
                await pAll(_.map(map.update, item => {
                  return () => this.api(resource).update(item._id, item)
                }), {concurrency: 1})
              }
            }
          }), {concurrency: 1})
          const status = {}
          _.each(importMap, (map, resource) => {
            _.each(map, (list, key) => {
              _.set(status, `${resource}.${key}`, list.length)
            })
          })
          return status
        }
      } else {
        logger.debug(`Couldn't initialize import for resource ${resource}`)
      }
    })
    this.cms._app.use('/import', this.app)
    return this
  }

  async onGetStatus (req, res, next) {
    try {
      await this.loadDataFromSpreadSheet()
      const importMap = await this.getImportMap(this.config.createOnly)
      const status = {}
      _.each(importMap, (map, resource) => {
        _.each(map, (list, key) => {
          _.set(status, `${resource}.${key}`, list.length)
        })
      })
      res.send(status)
    } catch (error) {
      console.log(error)
      next(error)
    }
  }

  async onGetExecute (req, res, next) {
    try {
      const status = {}
      await this.loadDataFromSpreadSheet()
      const keys = _.keys(this.data)
      await pAll(_.map(keys, resource => {
        return async () => {
          const importMap = await this.getImportMap(this.config.createOnly, [resource])
          const map = importMap[resource]
          if (!_.isEmpty(map.remove)) {
            await pAll(_.map(map.remove, item => {
              return () => this.api(resource).remove(item._id)
            }), {concurrency: 1})
          }
          if (!_.isEmpty(map.create)) {
            await pAll(_.map(map.create, item => {
              return () => this.api(resource).create(item)
            }), {concurrency: 1})
          }
          if (!_.isEmpty(map.update)) {
            await pAll(_.map(map.update, item => {
              return () => this.api(resource).update(item._id, item)
            }), {concurrency: 1})
          }
          _.each(map, (list, key) => {
            _.set(status, `${resource}.${key}`, list.length)
          })
        }
      }), {concurrency: 1})

      res.send(status)
    } catch (error) {
      next(error)
    }
  }
  async onGetStatusXlsx (req, res, next) {
    try {
      await this.loadDataFromXlsx(req.file)
      const importMap = await this.getImportMap(this.config.createOnly)
      const status = {}
      _.each(importMap, (map, resource) => {
        _.each(map, (list, key) => {
          _.set(status, `${resource}.${key}`, list.length)
        })
      })
      res.send(status)
    } catch (error) {
      console.log(error)
      next(error)
    }
  }

  async onGetExecuteXlsx (req, res, next) {
    try {
      const status = {}
      await this.loadDataFromXlsx(req.file)
      const keys = _.keys(this.data)
      await pAll(_.map(keys, resource => {
        return async () => {
          const importMap = await this.getImportMap(this.config.createOnly, [resource])
          const map = importMap[resource]
          if (!_.isEmpty(map.remove)) {
            await pAll(_.map(map.remove, item => {
              return () => this.api(resource).remove(item._id)
            }), {concurrency: 1})
          }
          if (!_.isEmpty(map.create)) {
            await pAll(_.map(map.create, item => {
              return () => this.api(resource).create(item)
            }), {concurrency: 1})
          }
          if (!_.isEmpty(map.update)) {
            await pAll(_.map(map.update, item => {
              return () => this.api(resource).update(item._id, item)
            }), {concurrency: 1})
          }
          _.each(map, (list, key) => {
            _.set(status, `${resource}.${key}`, list.length)
          })
        }
      }), {concurrency: 1})
      res.send(status)
    } catch (error) {
      next(error)
    }
  }

  async getImportMap (createOnly, resourceFilter) {
    let importMap = {}
    let filteredData = this.data
    if (resourceFilter) {
      filteredData = _.pick(filteredData, resourceFilter)
    }
    await pAll(_.map(filteredData, (importList, key) => {
      return async () => {
        let map = await this.api(key).getImportMap(_.cloneDeep(importList))
        if (createOnly) {
          map = _.pick(map, 'create')
        }
        importMap[key] = map
      }
    }), {concurrency: 1})

    return importMap
  }

  async loadDataFromSpreadSheet (resource) {
    let gsheetList = await this.getGsheetList(resource)
    await this.downloadDataFromGsheetList(gsheetList)
    await this.loadDataFromCachedJson(gsheetList)
  }

  async loadDataFromXlsx (file) {
    let gsheetList = await this.getGsheetList()
    await this.downloadDataFromXlsx(gsheetList, file)
    await this.loadDataFromCachedJson(gsheetList)
  }

  async getGsheetList (resource) {
    logger.info('')
    logger.info('### Preparing data from gsheet ###')
    let endProcess = h.startProcess('Get populating resources list ... ... ')
    let gsheetList = this.config.resources
    if (resource) {
      gsheetList = [resource]
    }
    gsheetList = _.compact(_.map(gsheetList, key => {
      return {
        id: key
      }
    }))
    endProcess('done')
    return gsheetList
  }

  async downloadDataFromGsheetList (gsheetList) {
    const jwtClient = new JWT({
      email: this.config.oauth.email,
      key: fs.readFileSync(this.config.oauth.keyFile, 'utf-8'),
      scopes: [
        'https://www.googleapis.com/auth/drive'
      ],
      subject: null
    })
    await jwtClient.authorize()
    await pAll(_.map(gsheetList, sheet => {
      return async () => {
        const endProcess = h.startProcess(`Download data from gsheet (${sheet.id}) ... ... `)
        const jsonFile = path.join(this.cachedFolder, 'cached', `${sheet.id}-active.json`)
        if (!fs.existsSync(path.dirname(jsonFile))) {
          fs.mkdirpSync(path.dirname(jsonFile))
        }
        if (fs.existsSync(jsonFile)) {
          const jsonLastModified = fs.statSync(jsonFile).mtime
          const gsheetLastModified  = await this.getGsheetLastModifiedDate(this.config.gsheetId, jwtClient)
          if (jsonLastModified && gsheetLastModified < jsonLastModified) {
            return endProcess('cached')
          } else {
            logger.warn(`${sheet.id} on google drive is updated`)
          }
        }
        const doc = new GoogleSpreadsheet(this.config.gsheetId)
        await doc.useServiceAccountAuth({
          client_email: this.config.oauth.email,
          private_key: fs.readFileSync(this.config.oauth.keyFile, 'utf-8')
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

  async downloadDataFromXlsx (gsheetList, file) {
    const opts = {
      type: 'buffer',
      cellFormula: false,
      cellHTML: false,
      cellText: false,
      cellStyles: false
    }
    const wb = xlsx.readFile(file.path, opts)

    await pAll(_.map(gsheetList, sheet => {
      return async () => {
        const endProcess = h.startProcess(`Download data from gsheet (${sheet.id}) ... ... `)
        let jsonFile = path.join(this.cachedFolder, 'cached', `${sheet.id}-active.json`)
        if (!fs.existsSync(path.dirname(jsonFile))) {
          fs.mkdirpSync(path.dirname(jsonFile))
        }
        const ws = wb.Sheets[sheet.id]
        if (!ws) {
          return
        }
        const rows = {}
        _.each(_.reject(_.keys(ws), item => _.startsWith(item, '!')), key => {
          const address = xlsx.utils.decode_cell(key)
          const x = address.c
          const y = address.r
          const value = _.get(ws, `${key}.v`)
          if (value !== null) {
            _.setWith(rows, `${y + 1}.${x + 1}`, value, Object)
          }
        })
        fs.writeJsonSync(jsonFile, rows)
        return endProcess('done')
      }
    }), {concurrency: 1})
  }

  async getGsheetLastModifiedDate (gsheetId, jwtClient) {
    const options = {
      headers: {
        authorization: `Bearer ${jwtClient.credentials.access_token}`
      }
    }
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${gsheetId}?fields=modifiedTime`, options)
    const data = await response.json()
    return new Date(data.modifiedTime)
  }

  async loadDataFromCachedJson (gsheetList) {
    return await pAll(_.map(gsheetList, sheet => {
      return async () => {
        let endProcess = h.startProcess(`Get Data from cached json ${sheet.id} ... ... `)
        let jsonPath = path.join(this.cachedFolder, 'cached', `${sheet.id}-active.json`)
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
              _.setWith(newRows, `${x}.${y}`, value, Object)
            })
          })
          rows = newRows
        }
        const header = rows['1']
        delete rows['1']
        let list = []
        _.each(rows, row => {
          let obj = {}
          let gsheetObj = {}
          _.each(row, (value, key) => _.set(gsheetObj, _.trim(header[key]), value))
          if (_.isEmpty(_.pick(gsheetObj, uniqueKeys))) {
            gsheetObj = _.omit(gsheetObj, uniqueKeys)
            return
          }
          if (uniqueKeys.length === 1) {
            const uniqueKey = _.first(uniqueKeys)
            const hasSubKeys = _.get(gsheetObj, `[${uniqueKey}].split`, false)
            if (hasSubKeys && _.isFunction(hasSubKeys)) {
              let subKeys = _.tail(gsheetObj[uniqueKey].split('.'))
              if (!_.isEmpty(subKeys)) {
                const otherValues = _.omit(gsheetObj, uniqueKey)
                gsheetObj = {
                  [uniqueKey]: gsheetObj[uniqueKey]
                }
                _.set(gsheetObj, `${subKeys.join('.')}`, otherValues)
              }
            }
          }
          _.each(schema, item => {
            if (_.includes(['file', 'image'], item.input)) {
              return
            }
            if (item.locales) {
              _.each(item.locales, (locale) => {
                let v = _.get(gsheetObj, `${item.field}.${locale}`)
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
            return {
              [uniqueKey]: key,
              ...newItem
            }
          })
        }
        this.data[sheet.id] = list
        endProcess('done')
      }
    }))
  }

  express () {
    return this.app
  }
}

exports = module.exports = ImportClass

