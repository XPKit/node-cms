/*
 * CMS migration API exposed as plugin
 */

/*
 * Module dependencies
 */

const path = require('path')
const _ = require('lodash')
const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs-extra')
const logger = new (require('img-sh-logger'))()
const Q = require('q')
const pAll = require('p-all')
const autoBind = require('auto-bind')

/*
 * Default options
 */

const defaults = {
  mount: '/migration'
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

class MigrationManager {
  constructor (config) {
    autoBind(this)
    this.config = config
  }

  init (cms) {
    this.cms = cms
    this.api = this.cms.api()
    this.folderPath = path.resolve(this.config.migration)
    this.app = express()
    this.app.use(bodyParser.json())
    this.app.get('/', this.preCheck, this.onGet)
    this.app.post('/', this.preCheck, this.onPost)
    // this.app.get('/post', this.preCheck, this.onPost)
    this.app.use(this.onError)
    this.cms._app.use(this.config.mount, this.app)
  }

  async preCheck (req, res, next) {
    try {
      const dbType = _.get(this.config, 'dbEngine.type')
      if (dbType !== 'mongodb') {
        throw new Error('dbEngine.type should be equal to mongodb')
      }
      if (!fs.existsSync(this.folderPath)) {
        throw new Error(`migration folder ${this.folderPath} not exists`)
      }
      let list = await Q.ninvoke(fs, 'readdir', this.folderPath)
      list = _.intersection(list, this.cms._resourceNames)
      list = _.difference(list, ['_groups', '_users'])
      let map = {}
      await pAll(_.map(list, item => {
        return async () => {
          const jsonPath = path.join(this.folderPath, item, 'json', 'db.json')
          try {
            let obj = await Q.ninvoke(fs, 'readJson', jsonPath)
            obj = _.pickBy(obj, (item, key) => /^\$\w+$/.test(key))
            map[item] = obj
          } catch (error) {
            logger.warn(error.message)
          }
        }
      }), {concurrency: 1})
      req.migrationMap = map
      next()
    } catch (error) {
      next(error)
    }
  }

  async onPost (req, res, next) {
    try {
      let returnMap = {}
      await pAll(_.map(req.migrationMap, (map, key) => {
        return async () => {
          try {
            const resource = this.cms.resource(key)
            let batchList = []
            _.each(map, item => {
              let obj = JSON.parse(item)
              batchList.push({
                type: 'put',
                key: obj._id,
                value: obj,
                valueEncoding: 'json'
              })
            })

            returnMap[key] = {
              numOfMigration: _.values(map).length
            }

            await Q.ninvoke(resource.json._db, 'batch', batchList)
          } catch (error) {
            logger.warn(error.message)
          }
        }
      }), {concurrency: 1})
      res.send(returnMap)
    } catch (error) {
      next(error)
    }
  }

  async onGet (req, res, next) {
    try {
      let returnMap = {}
      await pAll(_.map(req.migrationMap, (obj, key) => {
        return async () => {
          try {
            returnMap[key] = {
              numOfMigration: _.values(obj).length
            }
          } catch (error) {
            logger.warn(error.message)
          }
        }
      }), {concurrency: 1})
      res.send(returnMap)
    } catch (error) {
      next(error)
    }
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



exports = module.exports = function (options) {
  const opts = _.extend({}, defaults, options)
  const manager = new MigrationManager(opts)
  return function () {
    return manager.init(this)
  }
}

