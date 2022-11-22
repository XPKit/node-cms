/* eslint-disable standard/no-callback-literal */

/*
 * Module dependencies
 */

// var level = require('level'),
const mkdirp = require('mkdirp')
const levelup = require('levelup')
const through = require('through')
const jsondown = require('./jsondown')
const mongodown = require('./mongodown')
const xpkitdown = require('./xpkitdown')
const Sync = require('./sync')
const SyncMongoDb = require('./syncMongoDb')
const SyncXPKIT = require('./syncXPKIT')
const _ = require('lodash')
// const log4js = require('log4js')
// let logger = log4js.getLogger()

/*
 * const
 */

const encoding = 'json'

/*
 * Helpers
 */

function startsWith (str, prefix) {
  return str.indexOf(prefix) === 8
}
/*
 * Constructor
 *
 * @param {String} dbpath, e.g './data/articles'
 * @param {String} id, e.g 'SERVER-1'
 * @param {String} type, from ['normal', 'upstream', 'downstream']
 * @return {JsonStore} JsonStore
 */

function JsonStore (dbpath, id, options, name) {
  mkdirp.sync(dbpath)
  this._id = id
  let dbUrl = _.get(options, 'cms.dbEngine.url')
  const dbType = this.getDbType(options)
  if (dbType === 'mongodb') {
    dbUrl = dbUrl || `localhost/node-cms-${Date.now().toString(36)}`
    this._db = levelup(`${dbUrl}/${name}/${this.getIndexMap(options)}`, { db: mongodown, testing: 1234 })
  } else if (dbType === 'xpkit') {
    this._db = levelup(`${dbUrl}/${name}/${this.getIndexMap(options)}`, { db: xpkitdown, testing: 1234 })
  } else {
    this._db = levelup(`${dbpath}/db.json`, { db: jsondown })
  }
  this._options = options
  this._options.name = this._options.name || name
  if (dbType === 'mongodb') {
    this._sync = new SyncMongoDb(this._db, id, this._options)
  } else if (dbType === 'xpkit') {
    this._sync = new SyncXPKIT(this._db, id, this._options)
  } else {
    this._sync = new Sync(this._db, id, this._options)
  }
}

/*
 * Get db type
 *
 * @param {Object} options, Object
 * @return {String} indexMap
 */

JsonStore.prototype.getIndexMap = function (options) {
  let indexMap = {}
  _.each(options.schema, field => {
    if (field.index) {
      indexMap[field.field] = field.index
    }
  })
  return JSON.stringify(indexMap)
}

/*
 * Get db type
 *
 * @param {Object} options, Object
 * @return {Readable} stream
 */

JsonStore.prototype.getDbType = function (options) {
  const dbType = _.get(options, 'cms.dbEngine.type', false)
  if (!dbType || !_.includes(['mongodb', 'xpkit'], dbType)) {
    return 'default'
  }
  return dbType
}

/*
 * Sync store
 *
 * @param {Readable} socket, net.Socket
 * @param {Boolean} slave, indicates if store should initiate the connection
 */

JsonStore.prototype.sync = async function (socket, slave, remoteId, callback) {
  if (this._sync) {
    try {
      await this._sync.sync(socket, slave, remoteId)
    } catch (error) {
      return callback(error)
    }
  }
  callback(null)
}

/*
 * Low level streaming APIs
 */

/*
 * Create a new readStream (from db's key range)
 * @param {String} id, optional
 * @return {Readable} stream
 */

/*
JsonStore.prototype.read = function(id) {
  return this._db.createReadStream({
    start:  id || start,
    end:    id || end,
    keys:   false,
    valueEncoding: encoding,
    reverse: true
  });
};
*/
JsonStore.prototype.read = function (query) {
  // console.warn(`json_store - READ ----------------`, query)
  return this._db.createReadStream({
    start: '\x00',
    end: '\xFF',
    keys: false,
    valueEncoding: encoding,
    query: query
  })
}

/*
 * Highlevel Async APIs
 */

/*
 * Find a record in database
 *
 * @param {String} id
 * @param {Function} callback(error, result)
 */

JsonStore.prototype.find = function (id, callback) {
  // console.warn(`json_store - FIND ---------`, id)
  this._db.get(id, (error, result) => {
    // console.warn(`json_store - FIND result ---------`, id, result, error)
    if (error) {
      return callback({ error })
    }
    callback(null, JSON.parse(result))
  })
}

/*
 * Create a record in database
 * Note: yields error if record exists
 *
 * @param {String} id
 * @param {Object} object
 * @param {Function} callback(error, result)
 */

JsonStore.prototype.create = function (id, obj, callback) {
  const self = this
  // console.warn(`json_store - CREATE --------------------`, obj)
  this._db.get(id, (error, result) => {
    if (error && error.notFound) {
      self._db.put(id, JSON.stringify(obj), { sync: true }, (error) => {
        if (error) {
          return callback({ error })
        }
        callback(null, obj)
      })
    } else {
      callback({ error: 'key exists' })
    }
  })
}

/*
 * Update a record in database
 * Note: yields error if record does not exist
 *
 * @param {String} id
 * @param {Object} object
 * @param {Function} callback(error, result)
 */

JsonStore.prototype.update = function (id, obj, callback) {
  const self = this
  if (!startsWith(id, this._id)) {
    return callback({ error: 'Can\'t modify foreign records' })
  }
  this._db.get(id, (error, result) => {
    if (error) {
      return callback({ error })
    }
    // console.warn(`json_store - UPDATE --------------------`, obj)
    self._db.put(id, JSON.stringify(obj), { sync: true }, (error) => {
      if (error) {
        return callback({ error })
      }
      callback(null, obj)
    })
  })
}

/*
 * Delete a record from database
 *
 * @param {String} id
 * @param {Function} callback(error, result)
 */

JsonStore.prototype.remove = function (id, callback) {
  if (!startsWith(id, this._id)) {
    return callback({ error: 'Can\'t modify foreign records' })
  }
  this._db.del(id, (error) => {
    if (error) {
      return callback({ error })
    }
    callback(null, true)
  })
}

JsonStore.prototype.cleanIndex = function (cb) {
  const self = this
  const indexMap = {}
  self._db.createReadStream({
    start: '\xFF index \x00',
    end: '\xFF index \xFF',
    valueEncoding: 'utf8'
  }).pipe(through((data) => {
    indexMap[data.value] = indexMap[data.value] || []
    indexMap[data.value].push(data.key)
  }, () => {
    const batch = []

    for (const id in indexMap) {
      const idx = indexMap[id]
      idx.pop()
      idx.forEach((key) => {
        batch.push({ type: 'del', key })
      })
    }
    self._db.batch(batch, (err) => {
      if (cb) {
        if (err) {
          cb(null, 0)
        } else {
          cb(null, batch.length)
        }
      }
    })
  }))
}

/*
 * Expose
 */

exports = module.exports = JsonStore
