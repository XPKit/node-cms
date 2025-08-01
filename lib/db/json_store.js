// let level = require('level'),
import mkdirp from 'mkdirp'
import _ from 'lodash'
import path from 'path'
import jsondown from './leveldown/jsondown.js'
import Sync from './leveldown/sync.js'
import mongodown from './mongo/mongodown.js'
import SyncMongoDb from './mongo/syncMongoDb.js'

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
    const dbType = this.getDbType(options)
    let dbUrl = _.get(options, 'cms.dbEngine.url')
    this._options = options
    this._options.name = this._options.name || name
    if (dbType === 'mongodb') {
      dbUrl = dbUrl || `localhost/node-cms-${Date.now().toString(36)}`
      this._db = new mongodown(`${dbUrl}/${name}/${this.getIndexMap(options)}`, { keyEncoding: 'utf8', valueEncoding: encoding, testing: 1234 })
      this._sync = new SyncMongoDb(this._db, id, this._options)
    } else {
      const jsonFilePath = path.join(dbpath, 'db.json')
      this._db = new jsondown(jsonFilePath, { keyEncoding: 'utf8', valueEncoding: encoding })
      this._sync = new Sync(this._db, id, this._options)
    }
  }

  /**
   * Opens the underlying DB (JsonDOWN, mongodown, etc.)
   * Must be called before any CRUD operation.
   */
  async open() {
    if (_.isFunction(this._db.open)) {
      await this._db.open()
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
    return _.includes(['mongodb', 'xpkit'], dbType) ? dbType : 'default'
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
  async read (query, options) {
    let results = []
    for await (const [key, value] of this._db.iterator(query)) {
      // Ignore internal keys like 'ÿ clock', 'ÿ index', etc.
      if (_.isString(key) && key.startsWith('ÿ')) {
        continue
      }
      let parsedValue = value
      if (_.isString(value)) {
        try {
          parsedValue = JSON.parse(value)
        } catch {
          parsedValue = value
          console.warn(`Failed to parse value for key ${key}:`, parsedValue)
        }
      }
      results.push(parsedValue)
    }
    if (!_.isArray(results)) {
      results = _.isObject(results) ? [results] : []
    }
    return results
  }

  /*
   * Highlevel Async APIs
   */

  /*
   * Find a record in database
   *
   * @param {String} id
   */
  async find (id) {
    // If id is a string, treat as direct key lookup
    if (_.isString(id)) {
      try {
        return await this._db.get(id)
      } catch (error) {
        console.error(`JsonStore.find: record ${id} not found`, error)
        return undefined
      }
    }
    // If id is an object, treat as query
    if (_.isObject(id)) {
      let found = undefined
      try {
        for await (const [key, value] of this._db.iterator({})) {
          let match = true
          for (const prop in id) {
            if (!_.isEqual(_.get(value, prop, null), id[prop])) {
              match = false
              break
            }
          }
          if (match) {
            found = value
            break
          }
        }
      } catch (error) {
        console.error('JsonStore.find error:', error)
      }
      return found
    }
    return undefined
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
  async create (id, obj) {
    console.warn('JsonStore.create: writing record', id)
    try {
      await this._db.put(id, obj, { sync: true })
      console.warn('JsonStore.create: record written', id)
      // Always return the created object
      return obj
    } catch (error) {
      console.error(`Failed to get ${id} from database`, error)
      throw error
    }
  }

  /*
   * Update a record in database
   * Note: yields error if record does not exist
   *
   * @param {String} id
   * @param {Object} object
   */
  async update (id, obj) {
    if (!this.startsWith(id, this._id)) {
      return { error: 'Can\'t modify foreign records' }
    }
    await this._db.get(id)
    await this._db.put(id, obj, { sync: true })
    return obj
  }

  /*
   * Delete a record from database
   *
   * @param {String} id
   */
  async remove (id) {
    if (!this.startsWith(id, this._id)) {
      return { error: 'Can\'t modify foreign records' }
    }
    try {
      await this._db.del(id)
      return true
    } catch (error) {
      return {error}
    }
  }

  async cleanIndex () {
    const indexMap = {}
    _.each(this._db, (record)=> {
      // Build index map
      const keys = _.keys(record)
      _.each(keys, (key) => {
        indexMap[key] = indexMap[key] || []
        indexMap[key].push(record)
      })
    })
    const batch = []
    for (const id in indexMap) {
      const idx = indexMap[id]
      idx.pop()
      _.each(idx, (key) => {
        batch.push({ type: 'del', key })
      })
    }
    try {
      await this._db.batch(batch)
      return batch.length
    } catch (error) {
      console.error('Error cleaning index:', error)
      return 0
    }
  }
}

// Factory function for compatibility
function createJsonStore (dbpath, id, options, name) {
  return new JsonStore(dbpath, id, options, name)
}

export default createJsonStore
