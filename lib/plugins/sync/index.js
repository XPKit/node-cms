/*
 * CMS Admin API exposed as plugin
 */

/*
 * Module dependencies
 */

const express = require('express')
const autoBind = require('auto-bind')
const _ = require('lodash')
const request = require('request-promise')
const pAll = require('p-all')
const log4js = require('log4js')
const stream = require('stream')
const bodyParser = require('body-parser')
const got = require('got')

const logger = log4js.getLogger()
logger.level = log4js.levels.DEBUG
/*
 * Default options
 */

/*
 * Set constructor
 */

/*
 * Constructor
 *
 * @param {Object} options, optional
 *   @param {Route} route, route to inject itself, eg. '/admin'
 */

class SyncClass {
  constructor (config, cms) {
    autoBind(this)

    this.config = config
    this.cms = cms
    this.api = this.cms.api()
    this.syncReport = {}

    this.init()
  }
  async init () {
    this.app = express()
    this.app.use(bodyParser.urlencoded({extended: true}))
    this.app.use(bodyParser.json({limit: '50mb'}))

    this.app.use('/:env(local|remote)/:resource([\\w-_]+)', this.checkEnvironmentToken, this.checkResource)
    this.app.get('/:env(local|remote)/:resource([\\w-_]+)/status', this.onGetSyncEnvironmentResourceStatus)
    this.app.get('/:env(local|remote)/:resource([\\w-_]+)', this.onGetSyncEnvironmentResource)

    this.app.post('/:resource([\\w-_]+)/from/:from(local|remote)/to/:to(local|remote)', this.checkResource, this.onPostSyncResourceFromTo)
    this.app.get('/:resource([\\w-_]+)/from/:from(local|remote)/to/:to(local|remote)', this.checkToken, this.checkResource, this.onPostSyncResourceFromTo)

    this.app.use('/:resource([\\w-_]+)', this.checkToken, this.checkResource)
    this.app.get('/:resource([\\w-_]+)', this.onGetSyncResource)
    this.app.get('/:resource([\\w-_]+)/status', this.onGetSyncResourceStatus)
    this.app.put('/:resource([\\w-_]+)', this.onPutSyncResource)
    this.app.get('/:resource([\\w-_]+)/:id([\\w-_]+)/attachments/:aid([\\w-_]+)', this.onGetSyncResourceAttachment)
    this.app.use(this.onError)

    this.initResources()
    this.initHookAfter()
  }

  onError (error, req, res, next) {
    if (error) {
      if (this.config.debug) {
        logger.error('Error on:', error)
      }
      if (error && error.code && _.isNumber(error.code)) {
        return res.status(error.code).json({ error: error.message, source: error.source })
      }
      return res.status(500).json({ error: error.message || error, source: error.source })
    }
    next()
  }

  async initHookAfter () {
    const timeoutMap = {}
    try {
      const syncConfig = await this.api('_sync').list()
      _.each(syncConfig.resources, resource => {
        const timeoutTriggerUrl = (url) => {
          if (timeoutMap[url]) {
            clearTimeout(timeoutMap[url])
            timeoutMap[url] = null
          }
          timeoutMap[url] = setTimeout(async () => {
            try {
              timeoutMap[url] = null
              logger.info('timeoutTriggerUrl', url)
              const result = await got.get(url).json()
              logger.info(result)
            } catch (error) {
              logger.error(error)
            }
          }, 1000 * 5)
        }

        if (!_.isEmpty(syncConfig.remote.url)) {
          const url = `${syncConfig.remote.url}/sync/${resource}/from/remote/to/local?token=${syncConfig.remote.token}`
          _.each([
            'create',
            'update',
            'remove',
            'createAttachment',
            'removeAttachment'
          ], action => {
            this.api(resource).after(action, async (context) => {
              timeoutTriggerUrl(url)
              context.next()
            })
          })
        }
      })
    } catch (error) {
      logger.error(error)
    }
  }

  // authenticate (req, res, next) {
  //   console.warn(`plugin sync authenticate`)
  //   basicAuth(async (username, password, callback) => {
  //     const {error, result} = await this.cms.authenticate(username, password, req)
  //     if (error && error.code === 500) {
  //       return res.status(500).send(error)
  //     }
  //     req.user = result
  //     // callback(error, result)
  //   })(req, res, next)
  // }

  initResources () {
    this.cms.resource('_sync', {
      displayname: {
        enUS: 'Sync',
        zhCN: '同步'
      },
      group: {
        enUS: 'CMS',
        zhCN: '内容管理系统'
      },
      schema: [
        {
          field: 'allows',
          input: 'multiselect',
          source: [
            'read',
            'write'
          ]
        },
        {
          field: 'local.token',
          input: 'string'
        },
        {
          field: 'local.url',
          input: 'string'
        },
        {
          field: 'remote.token',
          input: 'string'
        },
        {
          field: 'remote.url',
          input: 'string'
        },
        {
          field: 'resources',
          input: 'multiselect',
          source: this.config.resources,
          label: 'Auto Sync Resources'
        }
      ],
      type: 'downstream',
      maxCount: 1
    })
  }

  async checkToken (req, res, next) {
    try {
      const syncConfig = await this.api('_sync').find({})
      req.syncInfo = _.get(syncConfig, 'local')
      if (_.isEmpty(_.get(req, 'syncInfo.token'))) {
        throw new Error(`_sync config local.token is not defined`)
      }
      req.syncInfo.allows = syncConfig.allows

      let token = req.query.token || req.body.token
      if (token !== req.syncInfo.token) {
        throw new Error(`token is not match`)
      }
      next()
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

  async getSyncResourceItems (req, resource) {
    if (_.isEmpty(_.get(req, 'syncInfo.url'))) {
      throw new Error(`_sync config local.url is not defined`)
    }

    const api = this.api(resource)
    if (!api) {
      throw new Error(`resource ${resource} not exists`)
    }
    let items = await api.list()
    items = _.map(items, item => _.omitBy(item, (value, key) => {
      if (_.includes(['_id', '_attachments'], key)) {
        return false
      }
      if (key === '_attachments') {
        return false
      }
      return _.startsWith(key, '_')
    }))
    let newItems = []
    await pAll(_.map(api.options.schema, field => {
      return async () => {
        switch (field.input) {
          case 'select': {
            if (!_.isString(field.source)) {
              this.assignObjectsValue(items, newItems, api.options.locales, field)
              return
            }
            const relations = await this.api(field.source).list()
            const relationUniqueKeys = this.api(field.source).getUniqueKeys()
            const relationUniqueKey = _.first(relationUniqueKeys)
            _.each(items, (item, idx) => {
              let value = _.get(item, field.field)
              const relatedItem = _.find(relations, {_id: value})
              value = relatedItem && (relatedItem[relationUniqueKey])
              _.set(newItems, `${idx}.${field.field}`, value)
            })
            break
          }
          case 'multiselect': {
            if (!_.isString(field.source)) {
              this.assignObjectsValue(items, newItems, api.options.locales, field)
              return
            }
            const relations = await this.api(field.source).list()
            const relationUniqueKeys = this.api(field.source).getUniqueKeys()
            const relationUniqueKey = _.first(relationUniqueKeys)
            _.each(items, (item, idx) => {
              let value = _.get(item, field.field)
              value = _.map(value, id => {
                const relatedItem = _.find(relations, {_id: id})
                return relatedItem && relatedItem[relationUniqueKey]
              })
              _.set(newItems, `${idx}.${field.field}`, value)
            })
            break
          }
          case 'image':
          case 'file':
            _.each(items, (item, idx) => {
              _.set(newItems, `${idx}._attachments`, _.get(newItems, `${idx}._attachments`, []))
              _.each(_.filter(item._attachments, {_name: field.field}), attach => {
                let url = `${req.syncInfo.url}/sync/${req.params.resource}/${item._id}/attachments/${attach._id}?token=${req.syncInfo.token}`
                attach = _.pick(attach, ['_contentType', '_name', '_md5sum', '_etag', '_filename', '_fields'])
                attach.url = url
                _.get(newItems, `${idx}._attachments`).push(attach)
              })
            })
            break
          default:
            this.assignObjectsValue(items, newItems, api.options.locales, field)
        }
      }
    }), {concurrency: 1})
    items = newItems
    items = _.map(items, item => _.omitBy(item, (value, key) => _.startsWith(key, '_') && key !== '_attachments'))

    if (resource === 'markets') {
      items = _.map(items, item => {
        item = _.omit(item, ['app', 'revision'])
        if (item.modules) {
          delete item.modules.fpsMeter
          delete item.modules.fileExplorer
        }
        return item
      })
    }
    return items
  }

  async checkEnvironmentToken (req, res, next) {
    try {
      const syncConfig = await this.api('_sync').find({})
      const syncInfo = _.get(syncConfig, req.params.env, {})
      if (_.isEmpty(syncInfo.token)) {
        throw new Error(`_sync config ${req.params.env}.token is not defined`)
      }
      if (_.isEmpty(syncInfo.url)) {
        throw new Error(`_sync config ${req.params.env}.url is not defined`)
      }
      req.syncInfo = syncInfo
      next()
    } catch (error) {
      next(error)
    }
  }

  async onPostSyncResourceFromTo (req, res, next) {
    try {
      const syncConfig = await this.api('_sync').find({})

      if (_.isEmpty(_.get(syncConfig, 'remote.token'))) {
        throw new Error(`_sync config remote.token is not defined`)
      }
      if (_.isEmpty(_.get(syncConfig, 'remote.url'))) {
        throw new Error(`_sync config remote.url is not defined`)
      }
      if (_.isEmpty(_.get(syncConfig, 'remote.token'))) {
        throw new Error(`_sync config remote.token is not defined`)
      }
      if (_.isEmpty(_.get(syncConfig, 'remote.url'))) {
        throw new Error(`_sync config remote.url is not defined`)
      }

      let url, items
      const fromConfig = syncConfig[req.params.from]
      url = `${fromConfig.url}/sync/${req.params.resource}?token=${fromConfig.token}`
      try {
        items = await request.get(url, {json: true})
      } catch (error) {
        throw _.get(error, 'response.body.error', error)
      }

      const toConfig = syncConfig[req.params.to]
      url = `${toConfig.url}/sync/${req.params.resource}?token=${toConfig.token}`
      try {
        await request.put(url, {body: items, json: true})
      } catch (error) {
        throw _.get(error, 'response.body.error', error)
      }
      res.send({message: 'done'})
    } catch (error) {
      next(error)
    }
  }

  async onGetSyncEnvironmentResourceStatus (req, res, next) {
    try {
      let result = await request.get(`${req.syncInfo.url}/sync/${req.params.resource}/status?token=${req.syncInfo.token}`, {json: true})
      res.send(result)
    } catch (error) {
      next(error)
    }
  }
  async onGetSyncEnvironmentResource (req, res, next) {
    try {
      let result = await request.get(`${req.syncInfo.url}/sync/${req.params.resource}?token=${req.syncInfo.token}`, {json: true})
      res.send(result)
    } catch (error) {
      next(error)
    }
  }

  async onGetSyncResourceAttachment (req, res, next) {
    try {
      if (!_.includes(req.syncInfo.allows, 'read')) {
        throw new Error(`read data is not allowed`)
      }

      let result = await this.api(req.params.resource).findAttachment(req.params.id, req.params.aid)
      res.type(result._contentType)
      res.write('', 'binary')
      result.stream.pipe(res, { end: true })
    } catch (error) {
      next(error)
    }
  }

  async onGetSyncResource (req, res, next) {
    try {
      if (!_.includes(req.syncInfo.allows, 'read')) {
        throw new Error(`read data is not allowed`)
      }

      const resource = req.params.resource
      const items = await this.getSyncResourceItems(req, resource)
      res.send(items)
    } catch (error) {
      next(error)
    }
  }

  async onGetSyncResourceStatus (req, res, next) {
    try {
      const resource = req.params.resource

      const result = _.get(this.syncReport, resource) || {status: 'done'}

      try {
        const syncConfig = await this.api('_sync').find({})
        result.allows = syncConfig.allows
      } catch (error) {

      }
      res.send(result)
    } catch (error) {
      next(error)
    }
  }

  async checkResource (req, res, next) {
    try {
      const resource = req.params.resource
      if (!_.includes(this.config.resources, resource)) {
        throw new Error(`${resource} is not defined in config.resources`)
      }
      this.api(resource).getUniqueKeys()
      next()
    } catch (error) {
      next(error)
    }
  }

  async onPutSyncResource (req, res, next) {
    try {
      if (!_.includes(req.syncInfo.allows, 'write')) {
        throw new Error(`read data is not allowed`)
      }

      const resource = req.params.resource
      const api = this.api(resource)
      if (!api) {
        throw new Error(`resource ${resource} not exists`)
      }
      if (_.get(this.syncReport, `${resource}.status`) === 'syncing') {
        throw new Error(`resource ${resource} is syncing now`)
      }
      this.startSyncData(req, resource)
      res.send({message: 'done'})
    } catch (error) {
      next(error)
    }
  }

  async getNormalizedRecords (resource, relationMap) {
    let schema = this.api(resource).options.schema
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

  async getRelationMap (resource) {
    let schema = this.api(resource).options.schema
    const relationMap = {}
    const relationResources = _.uniq(_.compact(_.map(schema, item => _.isString(item.source) && item.source)))
    await pAll(_.map(relationResources, resource => {
      return async () => {
        relationMap[resource] = await this.api(resource).list()
      }
    }), {concurrency: 1})
    return relationMap
  }

  async startSyncData (req, resource, options) {
    try {
      let {skipRemoveRecord} = options || {}

      _.set(this.syncReport, resource, {
        resource: resource,
        status: 'syncing',
        startedAt: Date.now(),
        removed: 0,
        updated: 0,
        created: 0,
        progress: []
      })

      const api = this.api(resource)
      const uniqueKeys = this.api(resource).getUniqueKeys()

      let localItems = await api.list()
      let remoteItems = req.body

      const relationMap = await this.getRelationMap(resource)
      const normalizedRecords = await this.getNormalizedRecords(resource, relationMap)

      let removeItems = []
      if (resource !== 'markets') {
        removeItems = _.filter(normalizedRecords, item => !_.find(remoteItems, _.pick(item, uniqueKeys)))
      }
      _.set(this.syncReport, `${resource}.createTotal`, 0)
      _.set(this.syncReport, `${resource}.updateTotal`, remoteItems.length)
      _.set(this.syncReport, `${resource}.removeTotal`, removeItems.length)

      const fromData = remoteItems
      const toData = await this.getSyncResourceItems(req, resource)

      const fromKeys = _.map(fromData, item => _.pick(item, uniqueKeys))
      const toKeys = _.map(toData, item => _.pick(item, uniqueKeys))
      let createKeys = _.filter(fromKeys, query => !_.find(toKeys, query))
      let updateKeys = _.filter(fromKeys, query => _.find(toKeys, query))

      updateKeys = _.filter(updateKeys, key => {
        let fromItem = _.find(fromData, key)
        let toItem = _.find(toData, key)
        fromItem = _.cloneDeep(fromItem)
        toItem = _.cloneDeep(toItem)
        fromItem._attachments = _.map(fromItem._attachments, item => _.omit(item, ['url']))
        toItem._attachments = _.map(toItem._attachments, item => _.omit(item, ['url']))
        return !_.isEqual(fromItem, toItem)
      })

      const createItems = _.filter(remoteItems, item => _.find(createKeys, _.pick(item, uniqueKeys)))
      const updateItems = _.filter(remoteItems, item => _.find(updateKeys, _.pick(item, uniqueKeys)))
      const createAndUpdateItems = _.union(createItems, updateItems)

      // update number of record needed to be update
      _.set(this.syncReport, `${resource}.updateTotal`, updateItems.length)
      _.set(this.syncReport, `${resource}.createTotal`, createItems.length)

      //  convert data
      await pAll(_.map(api.options.schema, field => {
        return async () => {
          if (_.includes(['select', 'multiselect'], field.input) && _.isString(field.source)) {
            const relations = await this.api(field.source).list()

            const relationUniqueKey = this.api(field.source).getUniqueKeys()
            switch (field.input) {
              case 'select':
                _.each(createAndUpdateItems, item => {
                  let value = _.get(item, field.field)
                  const relatedItem = _.find(relations, {[relationUniqueKey]: value})
                  value = relatedItem && relatedItem._id
                  _.set(item, field.field, value)
                })
                break
              case 'multiselect':
                _.each(createAndUpdateItems, item => {
                  let value = _.get(item, field.field)
                  value = _.map(value, key => {
                    const relatedItem = _.find(relations, {[relationUniqueKey]: key})
                    return relatedItem && relatedItem._id
                  })
                  _.set(item, field.field, value)
                })
                break
            }
          }
        }
      }), {concurrency: 1})
      this.syncReport[resource].progress.push('convert data')

      await pAll(_.map(createAndUpdateItems, item => {
        return async () => {
          let localItem = _.find(localItems, _.pick(item, uniqueKeys))
          const remoteAttachments = _.groupBy(item._attachments, '_name')
          delete item._attachments
          if (localItem) {
            let pickItem = _.omit(item, [...uniqueKeys, '_id'])
            let keys = _.keys(pickItem)
            let pickedLocalItem = _.pick(localItem, keys)

            if (resource === 'markets') {
              delete pickedLocalItem.revision
              if (pickedLocalItem.modules) {
                delete pickedLocalItem.modules.fpsMeter
                delete pickedLocalItem.modules.fileExplorer
              }
            }
            localItem = await this.api(resource).update(localItem._id, pickItem)
          } else {
            localItem = await this.api(resource).create(item)
          }

          // handle attachment
          const localAttachments = _.groupBy(localItem._attachments, '_name')

          // remove all
          await pAll(_.map(remoteAttachments, (remoteList, name) => {
            return async () => {
              const localList = localAttachments[name] || []
              if (_.map(localList, '_md5sum').join(',') !== _.map(remoteList, '_md5sum').join(',')) {
                logger.info(`all attachments (${localList.length}) in ${resource} ${localItem._id} removed`)
                await pAll(_.map(localList, attach => {
                  return async () => await this.api(resource).removeAttachment(localItem._id, attach._id)
                }), {concurrency: 1})

                await pAll(_.map(remoteList, attach => {
                  return async () => {
                    let buffer
                    try {
                      buffer = await request.get(attach.url, {encoding: null})
                      var file = new stream.Readable()
                      file.push(buffer)
                      file.push(null)

                      const params = {
                        contentType: attach._contentType,
                        filename: attach._filename,
                        name: attach._name,
                        stream: file,
                        fields: attach._fields
                      }
                      await this.api(resource).createAttachment(localItem._id, params)
                    } catch (error) {
                      logger.error(`fail to download ${attach.url}`)
                    }
                  }
                }), {concurrency: 1})
              }
            }
          }))
          if (_.find(createItems, _.pick(item, uniqueKeys))) {
            this.syncReport[resource].created += 1
          } else {
            this.syncReport[resource].updated += 1
          }
        }
      }), {concurrency: 1})

      this.syncReport[resource].progress.push('create and update')

      if (!skipRemoveRecord) {
        await pAll(_.map(removeItems, item => {
          return async () => {
            await this.api(resource).remove(item._id)
            this.syncReport[resource].removed += 1
          }
        }), {concurrency: 1})
      }

      this.syncReport[resource].progress.push('remove')

      _.set(this.syncReport, `${resource}.status`, 'done')
      _.set(this.syncReport, `${resource}.stopAt`, Date.now())
    } catch (error) {
      _.set(this.syncReport, `${resource}.status`, 'error')
      _.set(this.syncReport, `${resource}.error`, error)
      _.set(this.syncReport, `${resource}.stopAt`, Date.now())
      throw error
    }
    logger.info('startSyncData ... ... done')
  }

  express () {
    return this.app
  }
}

const SyncPlugin = function (options) {
  return function () {
    const plugin = new SyncClass(options.sync, this)
    this._app.use('/sync', plugin.express())
  }
}

/*
 * Expose
 */

exports = (module.exports = SyncPlugin)
