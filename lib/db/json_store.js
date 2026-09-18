// let level = require('level'),
const mkdirp = require('mkdirp')
const _ = require('lodash')
const path = require('path')
const h = require('../helpers')
const jsondown = require('./leveldown/jsondown')
const Sync = require('./leveldown/sync')
const mongodown = require('./mongo/mongodown')
const SyncMongoDb = require('./mongo/syncMongoDb')
const PgDOWN = require('./postgres/pgdown')
const SyncPostgres = require('./postgres/syncPostgres')

const encoding = 'json'
// uuid.js builds a record id as `Date.now().toString(36)` - eight characters - followed by the
// eight-character machine id and a random tail, so a server's own mark sits here and nowhere else.
const MID_OFFSET = 8

/*
 * Paging options arrive as strings over REST, and anything unusable counts as absent.
 *
 * @param {*} value
 * @return {Number} a non-negative integer
 */
function toCount (value) {
  const parsed = _.toInteger(value)
  return parsed > 0 ? parsed : 0
}
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
    this._dbType = dbType
    let dbUrl = _.get(options, 'cms.dbEngine.url')
    this._options = options
    this._options.name = this._options.name || name
    if (dbType === 'mongodb') {
      dbUrl = dbUrl || `localhost/node-cms-${Date.now().toString(36)}`
      this._db = new mongodown(`${dbUrl}/${name}/${this.getIndexMap(options)}`, { keyEncoding: 'utf8', valueEncoding: encoding, testing: 1234 })
      this._sync = new SyncMongoDb(this._db, id, this._options)
    } else if (dbType === 'postgres') {
      dbUrl = dbUrl || `localhost:5432/node-cms-${Date.now().toString(36)}`
      this._db = new PgDOWN(
        `${dbUrl}/${name}/${this.getIndexMap(options)}`,
        { keyEncoding: 'utf8', valueEncoding: encoding }
      )
      this._sync = new SyncPostgres(this._db, id, this._options)
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
  async close() {
    if (_.isFunction(this._db.close)) {
      // logger.verbose(`Closing JsonStore database for resource: ${this._options.name}`)
      this._db._closing = true
      await this._db.close()
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
    return _.includes(['mongodb', 'postgres'], dbType) ? dbType : 'default'
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
  async read (query, _options) {
    let results = []
    // Whoever narrows the result set pages it. The filterResults hook pages exactly the reads it
    // filters, which is every read carrying a query, so the store must not page those a second time.
    // A read with no query reaches nothing afterwards, so its offset has to be applied here or every
    // page comes back as the first one.
    const pagedAfterwards = !!query && _.isObject(query) && !_.isEmpty(query)
    // The default store's iterator only understands key ranges, so a MongoDB-style query is ignored
    // here and the hook filters afterwards. Cutting the read short would leave it filtering an
    // arbitrary slice of the collection, so the limit waits until nothing is left to filter. The
    // mongodb and postgres stores build the query into their own read and have already filtered.
    const filteredAfterwards = pagedAfterwards && this._dbType === 'default'
    const limit = filteredAfterwards ? 0 : toCount(_.get(_options, 'limit', 0))
    let skip = (pagedAfterwards || limit === 0) ? 0 : toCount(_.get(_options, 'page', 0)) * limit
    for await (const [key, value] of this._db.iterator(query)) {
      // Ignore internal keys like 'ÿ clock', 'ÿ index', etc.
      if (_.isString(key) && key.startsWith('ÿ')) {
        continue
      }
      if (skip > 0) {
        skip--
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
      if (limit !== 0 && results.length >= limit) {
        break
      }
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
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        // console.error(`JsonStore.find: record ${id} not found`, error.message)
        return undefined
      }
    }
    // If id is an object, treat as query
    if (!_.isObject(id)) {
      return undefined
    }
    let found = undefined
    for await (const [_key, value] of this._db.iterator({})) {
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
    return found
  }

  /*
   * Whether a record id belongs to this server, by carrying its machine id at MID_OFFSET.
   *
   * This asked `id.indexOf(mid) === 8`, under the name startsWith, which is not the same question:
   * indexOf answers with the *first* occurrence. With the machine id 42424242, a timestamp whose
   * base36 form ends in '42' puts a match at offset 6 - 'mu6vn642' + '42424242' - and the server
   * disowned a record it had just written. One id in 1296, which is the flake behind #105.
   *
   * Callers check this *before* doing anything destructive: the guards in update and remove are
   * the last line, not the first.
   *
   * @param {String} id
   * @return {Boolean} whether this server may write to it
   */
  owns (id) {
    return _.isString(id) && id.startsWith(this._id, MID_OFFSET)
  }

  /*
   * Create a record in database
   * Note: yields error if record exists
   *
   * @param {String} id
   * @param {Object} object
   */
  async create (id, obj) {
    // console.warn('JsonStore.create: writing record', id)
    try {
      await this._db.put(id, obj, { sync: true })
      // console.warn('JsonStore.create: record written', id)
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
    if (!this.owns(id)) {
      throw h.foreignRecordError(_.get(this._options, 'name'), id)
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
    // Thrown rather than returned, and the same goes for update above. Returning the refusal made
    // it a *result*: resource.js handed it back untouched and the REST layer answered 200 with an
    // error object as the body, so a delete the store had refused looked like one it had done
    // (#105). Every caller already handles a throw - the driver catches it into a proper error,
    // and the route maps `code` onto the status.
    if (!this.owns(id)) {
      throw h.foreignRecordError(_.get(this._options, 'name'), id)
    }
    await this._db.del(id)
    return true
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

exports = module.exports = createJsonStore
