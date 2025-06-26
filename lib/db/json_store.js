

// let level = require('level'),
const mkdirp = require('mkdirp')
const levelup = require('levelup')
const through = require('through')
const jsondown = require('./leveldown/jsondown')
const Sync = require('./leveldown/sync')
const mongodown = require('./mongo/mongodown')
const SyncMongoDb = require('./mongo/syncMongoDb')
const xpkitdown = require('./xpkit/xpkitdown')
const SyncXPKIT = require('./xpkit/syncXPKIT')
const _ = require('lodash')

// const path = require('path')
// const logger = new (require('img-sh-logger'))()

/*
 * const
 */

const encoding = 'json'

/*
 * Constructor
 *
 * @param {String} dbpath, e.g './data/articles'
 * @param {String} id, e.g 'SERVER-1'
 * @param {String} type, from ['normal', 'upstream', 'downstream']
 * @return {JsonStore} JsonStore
 */

class JsonStore {
  constructor (dbpath, id, options, name) {
    mkdirp.sync(dbpath)
    this._id = id
    let dbUrl = _.get(options, 'cms.dbEngine.url')
    const dbType = this.getDbType(options)
    if (dbType === 'mongodb') {
      dbUrl = dbUrl || `localhost/node-cms-${Date.now().toString(36)}`
      this._db = levelup(`${dbUrl}/${name}/${this.getIndexMap(options)}`, { db: mongodown, testing: 1234 })
    } else if (dbType === 'xpkit') {
      this._db = levelup(`${dbUrl}/${name}/${this.getIndexMap(options)}`, { db: xpkitdown, testing: 1234, options })
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

  getIndexMap (options) {
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

  getDbType (options) {
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

  async sync (socket, slave, remoteId) {
    if (this._sync) {
      try {
        await this._sync.sync(socket, slave, remoteId)
      } catch (error) {
        return error
      }
    }
    return null
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
  read(id) {
    return this._db.createReadStream({
      start:  id || start,
      end:    id || end,
      keys:   false,
      valueEncoding: encoding,
      reverse: true
    });
  }
  */
  read (query, options) {
    return this._db.createReadStream({
      start: '\x00',
      end: '\xFF',
      keys: false,
      valueEncoding: encoding,
      query,
      urlParams: options
    })
  }

  /*
   * Highlevel Async APIs
   */

  /*
   * Find a record in database
   *
   * @param {String} id
   */

  find (id) {
    return new Promise((resolve, reject) => {
      this._db.get(id, (error, result) => {
        return error ? reject({error}) : resolve(JSON.parse(result))
      })
    })
  }

  startsWith (str, prefix) {
    return str.indexOf(prefix) === 8
  }

  /*
   * Create a record in database
   * Note: yields error if record exists
   *
   * @param {String} id
   * @param {Object} object
   */

  create (id, obj) {
    const self = this
    // logger.warn(`json_store - CREATE --------------------`, obj)
    return new Promise((resolve, reject) => {
      this._db.get(id, (error) => {
        if (error && error.notFound) {
          self._db.put(id, JSON.stringify(obj), { sync: true }, (error) => {
            error ? reject({error}) : resolve(obj)
          })
        } else {
          reject({ error: 'key exists' })
        }
      })
    })
  }

  /*
   * Update a record in database
   * Note: yields error if record does not exist
   *
   * @param {String} id
   * @param {Object} object
   */

  update (id, obj) {
    const self = this
    if (!this.startsWith(id, this._id)) {
      return { error: 'Can\'t modify foreign records' }
    }
    return new Promise((resolve, reject) => {
      this._db.get(id, (error) => {
        if (error) {
          reject({ error })
        } else {
          self._db.put(id, JSON.stringify(obj), { sync: true }, (error) => {
            if (error) {
              reject(error)
            } else {
              resolve(obj)
            }
          })
        }
      })
    })
  }

  /*
   * Delete a record from database
   *
   * @param {String} id
   */

  remove (id) {
    if (!this.startsWith(id, this._id)) {
      return { error: 'Can\'t modify foreign records' }
    }
    this._db.del(id, (error) => {
      if (error) {
        return { error }
      }
      return true
    })
  }

  cleanIndex (cb) {
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
}

// Factory function for compatibility
function createJsonStore (dbpath, id, options, name) {
  return new JsonStore(dbpath, id, options, name)
}

exports = module.exports = createJsonStore
