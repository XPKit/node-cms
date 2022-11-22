/*
 * CMS migration API exposed as plugin
 */

/*
 * Module dependencies
 */

const _ = require('lodash')
const express = require('express')
const bodyParser = require('body-parser')
const log4js = require('log4js')
const autoBind = require('auto-bind')
const pAll = require('p-all')
const xl = require('excel4node')
const xlsx = require('xlsx')
const Q = require('q')
const os = require('os')
const path = require('path')
const multer = require('multer')
const upload = multer({ dest: os.tmpdir() })

const logger = log4js.getLogger()

/*
 * Default options
 */

const defaults = {
  mount: '/xlsx'
}

/*
 * Set constructor
 */

/*
 * Constructor
 *
 * @param {Object} options, optional
 *   @param {Route} route, route to inject itself, eg. '/migration'
 */

class XlsxManager {
  constructor (config) {
    autoBind(this)
    this.config = config
  }

  init (cms) {
    const mw = {}
    mw.authorize = require('../rest/middleware/authorize')
    mw.find_resource = require('../rest/middleware/find_resource')

    this.cms = cms
    this.api = this.cms.api()
    this.app = express()
    this.app.use(bodyParser.json())
    this.app.get('/:resource', mw.find_resource(this.cms), this.authorize, this.onGet)
    this.app.post('/:resource/status', mw.find_resource(this.cms), this.authorize, upload.single('xlsx'), this.injectImportMap, this.onPostStatus)
    this.app.post('/:resource/import', mw.find_resource(this.cms), this.authorize, upload.single('xlsx'), this.injectImportMap, this.onPostImport)
    this.app.use(this.onError)
    this.cms._app.use(this.config.mount, this.app)
    this.initResource()
  }

  initResource () {
    this.cms.resource('_xlsx', {
      displayname: {
        enUS: 'Xlsx',
        zhCN: '試算表'
      },
      group: {
        enUS: 'CMS',
        zhCN: '内容管理系统'
      },
      schema: [
        {
          field: 'token',
          input: 'string'
        }
      ],
      type: 'downstream',
      maxCount: 1
    })
  }

  async authorize (req, res, next) {
    try {
      const list = await this.api('_xlsx').list()
      const config = _.first(list)
      const token = _.get(config, 'token')
      if (!token) {
        throw new Error('xlsx config token not defined')
      }
      if (token !== req.query.token) {
        throw new Error('token not match')
      }
      next()
    } catch (error) {
      next(error)
    }
  }

  getFilterQuery (req) {
    if (!req.query.query) {
      return null
    }
    let query = req.query.query
    if (_.isString(query)) {
      try {
        query = JSON.parse(query)
      } catch (error) {
        query = null
      }
    }
    return query
  }

  stringifyKeyObj (keyObj) {
    return _.map(keyObj, (value, key) => {
      return `${key}:${value}`
    }).join(',')
  }

  isValidItem (resource, errors) {
    const options = resource.options
    return item => {
      const requiredErrorList = []
      const invalidFormatErrorList = []
      let isValid = true
      _.each(options.schema, field => {
        const locales = options.locales
        let localeArray = ['']
        if (_.isArray(locales) && (field.localised === undefined || field.localised === true)) {
          localeArray = locales
        }
        _.each(localeArray, locale => {
          let fieldName = field.field
          let label = field.label
          if (!_.isEmpty(locale)) {
            fieldName = `${locale}.${fieldName}`
            label = `${label} (${locale})`
          }
          const value = _.get(item, fieldName)
          if (field.input === 'email') {
            if (!_.isEmpty(value) && !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(value)) {
              invalidFormatErrorList.push(label)
              isValid = false
            }
          }
          let regex = _.get(field, 'options.regex.value')
          if (regex) {
            if (!regex.test(value)) {
              invalidFormatErrorList.push(label)
              isValid = false
            }
          }
          if (field.required) {
            if (_.isEmpty(value)) {
              requiredErrorList.push(label)
              isValid = false
            }
          }
        })
      })
      if (!_.isEmpty(requiredErrorList)) {
        errors.push({type: 'required', message: `${item._rowInfo}: ${requiredErrorList.join(', ')}.`})
      }
      if (!_.isEmpty(invalidFormatErrorList)) {
        errors.push({type: 'invalid', message: `${item._rowInfo}: Please enter a valid ${invalidFormatErrorList.join(', ')}.`})
      }
      return isValid
    }
  }

  async injectImportMap (req, res, next) {
    try {
      if (!req.file) {
        throw new Error('missing xlsx file')
      }
      const opts = {
        type: 'buffer',
        cellFormula: false,
        cellHTML: false,
        cellText: false,
        cellStyles: false
      }

      const wb = xlsx.readFile(req.file.path, opts)
      const keys = _.keys(wb.Sheets)
      let activeSheetKey = req.params.resource
      if (!_.includes(keys, activeSheetKey)) {
        activeSheetKey = _.first(keys)
      }
      const sheet = wb.Sheets[activeSheetKey]

      const key = sheet['!ref']
      const matches = key.match(/^(\D+)(\d+):(\D+)(\d+)$/)
      if (!matches) {
        throw new Error('!ref is not valid')
      }
      let dataArray = []
      _.each(_.reject(_.keys(sheet), item => _.startsWith(item, '!')), key => {
        const address = xlsx.utils.decode_cell(key)
        const x = address.c
        const y = address.r
        const value = _.get(sheet, `${key}.v`)
        _.set(dataArray, `[${y}][${x}]`, value)
      })
      dataArray.shift() // shift first label row
      const options = req.resource.options
      const headers = dataArray.shift()
      const uniqueKeys = req.resource.getUniqueKeys()
      let importList = _.map(dataArray, (item, idx) => {
        const obj = _.zipObject(headers, item)
        obj._rowInfo = `Row #${xlsx.utils.encode_row(idx + 2)}`
        return obj
      })
      importList = _.compact(_.map(importList, item => {
        let obj = {}
        _.each(item, (value, key) => {
          const schemaField = _.find(options.schema, field => _.endsWith(key, field.field))
          if (!schemaField) {
            return
          }
          if (!_.isUndefined(value)) {
            switch (schemaField.input) {
              case 'number':
              case 'integer':
                value = _.toNumber(value)
                break
              case 'string':
              case 'text':
              case 'password':
              case 'email':
                value = _.toString(value)
                break
            }

            if (req.query.checkRequired === 'true' && schemaField.required) {
              const keyObj = _.pick(obj, uniqueKeys)
              switch (schemaField.input) {
                case 'number':
                case 'integer':
                  if (_.isUndefined(value) || _.isNull(value)) {
                    throw new Error(`record (${JSON.stringify(keyObj)}) do not have required field (${key})`)
                  }
                  break
                default:
                  if (_.isEmpty(value)) {
                    const keyObj = _.pick(obj, uniqueKeys)
                    throw new Error(`record (${JSON.stringify(keyObj)}) do not have required field (${key})`)
                  }
                  break
              }
            }
            _.set(obj, key, value)
          } else {
            if (req.query.checkRequired === 'true' && schemaField.required) {
              const keyObj = _.pick(obj, uniqueKeys)
              throw new Error(`record (${JSON.stringify(keyObj)}) do not have required field (${key})`)
            }
          }
        })
        const keyObj = _.pick(obj, uniqueKeys)
        if (!_.isEmpty(keyObj)) {
          obj._rowInfo = item._rowInfo
          return obj
        }
      }))
      const errors = []
      const importListMap = _.groupBy(importList, item => JSON.stringify(_.pick(item, uniqueKeys)))
      _.each(importListMap, (list, key) => {
        if (list.length > 1) {
          const keyObj = JSON.parse(key)
          errors.push({type: 'duplicate', message: `${this.stringifyKeyObj(keyObj)} - ${_.map(list, '_rowInfo').join(', ')}`})
          importList = _.difference(importList, list)
        }
      })

      importList = _.filter(importList, this.isValidItem(req.resource, errors))
      const query = this.getFilterQuery(req)
      if (!_.isEmpty(query)) {
        importList = _.filter(importList, query)
      }

      _.each(importList, item => {
        delete item._rowInfo
      })

      const importMap = await req.resource.getImportMap(importList, query, req.query.checkRequired === 'true')
      delete importMap.remove
      if (!_.isEmpty(errors)) {
        importMap.errors = errors
      }
      req.importMap = importMap

      next()
    } catch (error) {
      next(error)
    }
  }

  onPostStatus (req, res, next) {
    try {
      const status = _.mapValues(req.importMap, (value, key) => key === 'errors' ? value : _.size(value))
      res.send(status)
    } catch (error) {
      next(error)
    }
  }

  async onPostImport (req, res, next) {
    try {
      const map = req.importMap

      if (!_.isEmpty(map.create)) {
        map.create = await pAll(_.map(map.create, item => {
          return () => req.resource.create(item)
        }), {concurrency: 1})
      }
      if (!_.isEmpty(map.update)) {
        map.update = await pAll(_.map(map.update, item => {
          return () => req.resource.update(item._id, item)
        }), {concurrency: 1})
      }

      if (req.query.detail === 'true') {
        res.send(req.importMap)
      } else {
        const status = _.mapValues(req.importMap, (value, key) => key === 'errors' ? value : _.size(value))
        res.send(status)
      }
    } catch (error) {
      next(error)
    }
  }

  async onGet (req, res, next) {
    try {
      const options = req.resource.options
      const uniqueKeys = req.resource.getUniqueKeys()
      let items = await req.resource.list()
      let newItems = []
      let keyList = []
      const locales = options.locales
      await pAll(_.map(options.schema, field => {
        return async () => {
          if (_.includes(['file', 'image'], field.input)) {
            return
          }
          const asterisk = field.required ? '* ' : ''
          if (_.isArray(locales) && (field.localised === undefined || field.localised === true)) {
            _.each(locales, locale => {
              keyList.push({
                label: `${asterisk}${field.label} (${locale})`,
                key: `${locale}.${field.field}`,
                field: field,
                locale: locale
              })
            })
          } else {
            keyList.push({
              label: `${asterisk}${field.label}`,
              key: field.field,
              field: field
            })
          }

          switch (field.input) {
            case 'select': {
              if (!_.isString(field.source)) {
                this.assignObjectsValue(items, newItems, options.locales, field)
                return
              }
              const relations = await this.api(field.source).list()
              const relationUniqueKeys = this.api(field.source).getUniqueKeys()
              const relationUniqueKey = _.first(relationUniqueKeys)
              _.each(items, (item, idx) => {
                const locales = options.locales
                let localeArray = ['']
                if (_.isArray(locales) && (field.localised === undefined || field.localised === true)) {
                  localeArray = locales
                }
                _.each(localeArray, locale => {
                  let fieldName = field.field
                  if (!_.isEmpty(locale)) {
                    fieldName = `${locale}.${fieldName}`
                  }
                  let value = _.get(item, fieldName)
                  const relatedItem = _.find(relations, {_id: value})
                  value = relatedItem && relatedItem[relationUniqueKey]
                  _.set(newItems, `${idx}.${fieldName}`, value)
                })
              })
              break
            }
            case 'multiselect': {
              if (!_.isString(field.source)) {
                this.assignObjectsValue(items, newItems, options.locales, field)
                return
              }
              const relations = await this.api(field.source).list()
              const relationUniqueKeys = this.api(field.source).getUniqueKeys()
              const relationUniqueKey = _.first(relationUniqueKeys)
              _.each(items, (item, idx) => {
                const locales = options.locales
                let localeArray = ['']
                if (_.isArray(locales) && (field.localised === undefined || field.localised === true)) {
                  localeArray = locales
                }
                _.each(localeArray, locale => {
                  let fieldName = field.field
                  if (!_.isEmpty(locale)) {
                    fieldName = `${locale}.${fieldName}`
                  }
                  let value = _.get(item, fieldName)
                  value = _.map(value, id => {
                    const relatedItem = _.find(relations, {_id: id})
                    return relatedItem && relatedItem[relationUniqueKey]
                  })
                  _.set(newItems, `${idx}.${fieldName}`, value)
                })
              })
              break
            }
            case 'image':
            case 'file':
              _.each(items, (item, idx) => {
                _.set(newItems, `${idx}._attachments`, _.get(newItems, `${idx}._attachments`, []))
                _.each(_.filter(item._attachments, {_name: field.field}), attach => {
                  const subPath = req.originalUrl.replace(RegExp(`${this.config.mount}.*`), '')
                  const host = req.headers['x-forwarded-host'] || req.headers.host
                  const serverUrl = `${req.protocol}://${host}${subPath}`
                  let url = `${serverUrl}/api/${req.params.resource}/${item._id}/attachments/${attach._id}`
                  attach = _.pick(attach, ['_contentType', '_name', '_md5sum', '_etag', '_filename', '_fields'])
                  attach.url = url
                  _.get(newItems, `${idx}._attachments`).push(attach)
                })
              })
              break
            default:
              this.assignObjectsValue(items, newItems, options.locales, field)
          }
        }
      }), {concurrency: 1})

      items = newItems
      const query = this.getFilterQuery(req)
      if (!_.isEmpty(query)) {
        items = _.filter(items, query)
      }

      const wb = new xl.Workbook()
      const ws = wb.addWorksheet(req.params.resource)

      ws.addDataValidation({
        type: 'textLength',
        error: 'This cell is locked',
        operator: 'equal',
        sqref: `A1:${xlsx.utils.encode_col(keyList.length - 1)}2`,
        formulas: ['']
      })

      _.each(keyList, (keyItem, idx) => {
        if (_.includes(uniqueKeys, keyItem.field.field)) {
          const col = xlsx.utils.encode_col(idx)
          ws.addDataValidation({
            type: 'textLength',
            error: 'This cell is locked',
            operator: 'equal',
            sqref: `${col}3:${col}${xlsx.utils.encode_row(items.length + 1)}`,
            formulas: ['']
          })
        }
      })

      _.each(keyList, (keyItem, idx) => {
        const labelStyle = wb.createStyle({
          font: {
            bold: true
          },
          fill: {
            type: 'pattern',
            patternType: 'solid',
            bgColor: '#FFFFAA',
            fgColor: '#FFFFAA'
          }
        })

        const keyStyle = wb.createStyle({
          fill: {
            type: 'pattern',
            patternType: 'solid',
            bgColor: '#FFAAAA',
            fgColor: '#FFAAAA'
          }
        })
        ws.cell(1, idx + 1)
          .string(keyItem.label)
          .style(labelStyle)

        ws.cell(2, idx + 1)
          .string(keyItem.key)
          .style(keyStyle)

        _.each(items, (item, itemIdx) => {
          let value
          let attach
          switch (keyItem.field.input) {
            case 'object':
              value = _.get(item, keyItem.key)
              if (value) {
                value = JSON.stringify(value)
              }
              break
            case 'multiselect':
            case 'pillbox':
              value = _.get(item, keyItem.key)
              if (_.isArray(value)) {
                value = value.join(',')
              }
              break
            case 'file':
            case 'image':
              attach = _.find(item._attachments, attach => {
                if (attach._name !== keyItem.field.field) {
                  return false
                }
                if (keyItem.locale && keyItem.locale !== attach._fields.locale) {
                  return false
                }
                return true
              })
              if (attach) {
                value = attach.url
              }
              break
            default:
              value = _.get(item, keyItem.key)
          }
          if (!_.isUndefined(value)) {
            const cell = ws.cell(itemIdx + 3, idx + 1)
            switch (typeof value) {
              case 'boolean':
                cell.bool(value)
                break
              case 'number':
                if (_.includes(['date', 'datetime', 'time'], keyItem.field.input)) {
                  cell.date(new Date(value))
                    .style({numberFormat: 'yyyy-mm-dd'})
                } else {
                  cell.number(value)
                }
                break
              default:
                if (_.includes(['wysiwyg'], keyItem.field.input)) {
                  // skip by kong, error with some special element
                  cell.string('wysiwyg is not suppported')
                } else {
                  cell.string(value)
                }
            }
          }
        })
      })

      // add extra page
      const relatedResources = _.uniq(_.compact(_.map(options.schema, field => _.isString(field.source) && field.source)))
      await pAll(_.map(relatedResources, resource => {
        return async () => {
          const options = this.api(resource).options
          const locales = options.locales
          const relativeKeyList = this.api(resource).getUniqueKeys()
          const ws = wb.addWorksheet(resource)
          const detailField = _.find(options.schema, item => !_.includes(relativeKeyList, item.field))
          if (detailField) {
            if (_.isArray(locales) && (detailField.localised === undefined || detailField.localised === true)) {
              _.each(locales, locale => {
                relativeKeyList.push(`${locale}.${detailField.field}`)
              })
            } else {
              relativeKeyList.push(detailField.field)
            }
          }
          await pAll(_.map(relativeKeyList, (key, idx) => {
            return async () => {
              ws.cell(1, idx + 1)
                .string(key)
              const items = await this.api(resource).list()
              _.each(items, (item, itemIdx) => {
                const value = _.get(item, key)
                if (!_.isUndefined(value)) {
                  const cell = ws.cell(itemIdx + 2, idx + 1)
                  switch (typeof value) {
                    case 'boolean':
                      cell.bool(value)
                      break
                    case 'number':
                      cell.number(value)
                      break
                    default:
                      cell.string(value)
                  }
                }
              })
            }
          }), {concurrency: 1})
        }
      }), {concurrency: 1})

      const filePath = path.join(os.tmpdir(), `${Date.now()}.xlsx`)
      await Q.ninvoke(wb, 'write', filePath)
      res.setHeader('Content-disposition', `attachment; filename=${req.params.resource}.xlsx`)
      res.setHeader('Content-Type', 'application/octet-stream')
      res.sendFile(filePath)
    } catch (error) {
      next(error)
    }
  }

  assignObjectsValue (items, newItems, locales, field) {
    _.each(items, (item, idx) => {
      if (_.isArray(locales) && (field.localised === undefined || field.localised === true)) {
        _.each(locales, locale => {
          let value = _.get(item, `${locale}.${field.field}`)
          if (!_.isUndefined(value) && !_.isNull(value)) {
            _.set(newItems, `${idx}.${locale}.${field.field}`, value)
          }
        })
      } else {
        let value = _.get(item, field.field)
        if (!_.isUndefined(value) && !_.isNull(value)) {
          _.set(newItems, `${idx}.${field.field}`, value)
        }
      }
    })
  }

  onError (error, req, res, next) {
    if (error) {
      if (this.config.debug) {
        logger.error('Error on:', error)
      }
      if (error && error.code && _.isNumber(error.code)) {
        return res.status(error.code).json({ error: error.message })
      }
      return res.status(500).json({ error: error.message || error })
    }
    next()
  }
}

/*
 * Expose
 */

exports = module.exports = function (options) {
  const opts = _.extend({}, defaults, options)
  const manager = new XlsxManager(opts)
  return function () {
    return manager.init(this)
  }
}
