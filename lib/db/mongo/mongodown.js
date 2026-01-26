const { AbstractLevel, AbstractIterator } = require('abstract-level')
const { MongoClient, ServerApiVersion } = require('mongodb')
const pAll = require('p-all')
const _ = require('lodash')

/**
 * An iterator for the MongoDB database.
 * It iterates over the MongoDB cursor, respecting range options.
 * This version uses the modern async _next() method.
 */
class MongoIterator extends AbstractIterator {
  constructor(db, options) {
    super(db, options)
    this.options = options || {}
    this.cursor = null
    this._initCursor()
  }

  _initCursor() {
    const query = this.options.query || {}
    const sanitizedQuery = sanitizeQuery(query)
    this.cursor = this.db.collection.find(sanitizedQuery).sort({ _createdAt: 1 }).allowDiskUse(true)
    const { reverse, limit } = this.options
    if (limit !== undefined && limit > -1) {
      this.cursor = this.cursor.limit(limit)
    }
    if (reverse) {
      this.cursor = this.cursor.sort({ _createdAt: -1 })
    }
  }
  async _next() {
    try {
      if (!(await this.cursor.hasNext())) {
        return
      }
      const doc = await this.cursor.next()
      return [doc._id, JSON.stringify(doc)]
    } catch (error) {
      throw new Error(`MongoIterator next error: ${error.message}`)
    }
  }
}

function sanitizeQuery(query) {
  const blacklistedOperators = ['$where', '$function']
  if (!_.isObject(query) || query === null || _.isArray(query)) {
    return query
  }
  for (const key in query) {
    if (blacklistedOperators.includes(key)) {
      delete query[key]
      continue
    }
    const value = query[key]
    if ((key.startsWith('$') && _.isString(value)) || _.isFunction(value)) {
      delete query[key]
      continue
    }
    if (_.isObject(value)) {
      sanitizeQuery(value)
    }
  }
  return query
}

/**
 * A custom database that uses MongoDB for persistence.
 * This version uses the modern async/await private methods and follows
 * the same patterns as JsonDOWN.
 */
class MongoDOWN extends AbstractLevel {
  constructor(location, options = {}) {
    // Manifest must declare supported encodings
    const manifest = {
      encodings: { utf8: true, buffer: true, view: true },
      has: true,
      getMany: true,
      implicitSnapshots: false,
      explicitSnapshots: false,
    }
    super(manifest, options)
    const segments = location.split('/')
    const indexMap = segments.pop()
    const collectionName = segments.pop()
    const dbName = segments.pop()
    const host = segments.join('/')
    this.host = `${process.env.MONGODB_PROTOCOL || 'mongodb'}://${host}`
    this.dbName = dbName
    this.collectionName = collectionName
    this.collection = null
    this.db = null
    try {
      this.indexMap = JSON.parse(indexMap)
    } catch (error) {
      console.error(`unable to json parse indexMap string ${indexMap}, ${error.message}`)
      this.indexMap = {}
    }
    // Add hooks support for sync/replication (similar to jsondown)
    this.hooks = {
      prewrite: {
        noop: true, // Start as true, set to false when hooks are added
        add: (hook) => {
          this._prewriteHooks = this._prewriteHooks || []
          this._prewriteHooks.push(hook)
          this.hooks.prewrite.noop = false
        },
        delete: (hook) => {
          if (this._prewriteHooks) {
            const index = this._prewriteHooks.indexOf(hook)
            if (index !== -1) {
              this._prewriteHooks.splice(index, 1)
            }
          }
          this.hooks.prewrite.noop = !this._prewriteHooks || this._prewriteHooks.length === 0
        },
        run: (op, batch) => {
          if (this._prewriteHooks) {
            for (const hook of this._prewriteHooks) {
              hook(op, batch)
            }
          }
        },
      },
      postopen: {
        noop: true,
        add: () => {
          /* noop */
        },
        delete: () => {
          /* noop */
        },
        run: () => {
          /* noop */
        },
      },
      newsub: {
        noop: true,
        add: () => {
          /* noop */
        },
        delete: () => {
          /* noop */
        },
        run: () => {
          /* noop */
        },
      },
    }
    this._prewriteHooks = []
  }

  async getClient(host) {
    const client = gClientMap[host]
    if (client) {
      return client
    }
    const params = {}
    if (process.env.MONGODB_CLIENT_CERT_PATH) {
      params.tls = true
      params.authMechanism = 'MONGODB-X509'
      params.serverApi = ServerApiVersion.v1
      params.tlsCertificateKeyFile = process.env.MONGODB_CLIENT_CERT_PATH
      if (process.env.MONGODB_CA_CERT_PATH) {
        params.tlsCAFile = process.env.MONGODB_CA_CERT_PATH
      }
    }
    if (!gClientPromiseMap[host]) {
      gClientPromiseMap[host] = []
    }
    // If a connection is already in progress, wait for it
    if (gClientPromiseMap[host].length > 0) {
      return new Promise((resolve, reject) => {
        gClientPromiseMap[host].push({ resolve, reject })
      })
    }
    // Start a new connection
    gClientPromiseMap[host].push({ resolve: null, reject: null }) // placeholder for the first
    let mongoClient, error
    try {
      mongoClient = await MongoClient.connect(host, params)
      gClientMap[host] = mongoClient
    } catch (err) {
      error = err
      console.error('MongoClient.connect error: ', error)
    }
    _.each(gClientPromiseMap[host], (deferred) => {
      if (error) {
        if (deferred.reject) {
          deferred.reject(error)
        }
      } else if (deferred.resolve) {
        deferred.resolve(mongoClient)
      }
    })
    gClientPromiseMap[host] = []
    if (error) throw error
    return mongoClient
  }

  async _open(_options) {
    try {
      const client = await this.getClient(this.host)
      this.db = client.db(this.dbName)
      this.collection = this.db.collection(this.collectionName)
      if (!_.isEmpty(this.indexMap)) {
        await this.collection.createIndex(this.indexMap, null)
      }
      try {
        await this.collection.createIndex({ '$**': 1 }, null)
      } catch (error) {
        console.error('Error creating wildcard index:', error)
      }
    } catch (error) {
      throw new Error(`Error opening MongoDB connection (${this.host}) dbName (${this.dbName}): ${error.message}`)
    }
  }

  async _put(key, value, _options) {
    // Call prewrite hooks
    const batch = {
      operations: [],
      add: (op) => {
        batch.operations.push(op)
      },
    }
    const putOp = { type: 'put', key, value }
    if (this._prewriteHooks && this._prewriteHooks.length > 0) {
      for (const hook of this._prewriteHooks) {
        hook(putOp, batch)
      }
    }
    // Apply the original put operation
    try {
      const sanitizedKey = sanitizeQuery(key)
      let parsedValue
      // Parse the value if it's a JSON string
      if (_.isString(value)) {
        try {
          parsedValue = JSON.parse(value)
        } catch {
          parsedValue = value
        }
      } else {
        parsedValue = value
      }
      const sanitizedValue = sanitizeQuery(parsedValue)
      // Skip index and clock operations for MongoDB (they're not needed)
      if (!key.startsWith('ÿ')) {
        const existingRecord = await this.collection.findOne({ _id: sanitizedKey })
        if (existingRecord) {
          await this.collection.updateOne({ _id: sanitizedKey }, { $set: sanitizedValue })
        } else {
          await this.collection.insertOne(sanitizedValue)
        }
      }
      // Apply any additional operations added by hooks
      for (const op of batch.operations) {
        if (op.type === 'put' && !op.key.startsWith('ÿ')) {
          const hookSanitizedKey = sanitizeQuery(op.key)
          let hookParsedValue
          if (_.isString(op.value)) {
            try {
              hookParsedValue = JSON.parse(op.value)
            } catch {
              hookParsedValue = op.value
            }
          } else {
            hookParsedValue = op.value
          }
          const hookSanitizedValue = sanitizeQuery(hookParsedValue)
          const hookExistingRecord = await this.collection.findOne({ _id: hookSanitizedKey })
          if (hookExistingRecord) {
            await this.collection.updateOne({ _id: hookSanitizedKey }, { $set: hookSanitizedValue })
          } else {
            await this.collection.insertOne(hookSanitizedValue)
          }
        } else if (op.type === 'del' && !op.key.startsWith('ÿ')) {
          const hookSanitizedKey = sanitizeQuery(op.key)
          await this.collection.deleteOne({ _id: hookSanitizedKey })
        }
      }
    } catch (error) {
      throw new Error(`MongoDB put error: ${error.message}`)
    }
  }
  async _get(key, _options) {
    if (key.startsWith('ÿ')) {
      // Index and clock operations are not stored in MongoDB
      const notFoundError = new Error(`Key not found in database [${key}]`)
      notFoundError.code = 'LEVEL_NOT_FOUND'
      throw notFoundError
    }
    try {
      const sanitizedKey = sanitizeQuery(key)
      const record = await this.collection.findOne({ _id: sanitizedKey })
      if (!record) {
        const notFoundError = new Error(`Key not found in database [${key}]`)
        notFoundError.code = 'LEVEL_NOT_FOUND'
        throw notFoundError
      }
      return JSON.stringify(record)
    } catch (error) {
      if (error.code === 'LEVEL_NOT_FOUND') {
        throw error
      }
      throw new Error(`MongoDB get error: ${error.message}`)
    }
  }
  async _del(key, _options) {
    // Call prewrite hooks
    const batch = {
      operations: [],
      add: (op) => {
        batch.operations.push(op)
      },
    }
    const delOp = { type: 'del', key }
    if (this._prewriteHooks && this._prewriteHooks.length > 0) {
      for (const hook of this._prewriteHooks) {
        hook(delOp, batch)
      }
    }
    // Apply the original delete operation
    try {
      if (!key.startsWith('ÿ')) {
        const sanitizedKey = sanitizeQuery(key)
        await this.collection.deleteOne({ _id: sanitizedKey })
      }
      // Apply any additional operations added by hooks
      for (const op of batch.operations) {
        if (op.type === 'put' && !op.key.startsWith('ÿ')) {
          const hookSanitizedKey = sanitizeQuery(op.key)
          let hookParsedValue
          if (_.isString(op.value)) {
            try {
              hookParsedValue = JSON.parse(op.value)
            } catch {
              hookParsedValue = op.value
            }
          } else {
            hookParsedValue = op.value
          }
          const hookSanitizedValue = sanitizeQuery(hookParsedValue)
          const hookExistingRecord = await this.collection.findOne({ _id: hookSanitizedKey })
          if (hookExistingRecord) {
            await this.collection.updateOne({ _id: hookSanitizedKey }, { $set: hookSanitizedValue })
          } else {
            await this.collection.insertOne(hookSanitizedValue)
          }
        } else if (op.type === 'del' && !op.key.startsWith('ÿ')) {
          const hookSanitizedKey = sanitizeQuery(op.key)
          await this.collection.deleteOne({ _id: hookSanitizedKey })
        }
      }
    } catch (error) {
      throw new Error(`MongoDB delete error: ${error.message}`)
    }
  }
  async _batch(operations, _options) {
    // Create a batch object that the hooks can modify
    const batch = {
      operations: [...operations], // Copy the operations
      add: (op) => {
        batch.operations.push(op)
      },
    }
    // Call prewrite hooks for each operation
    if (this._prewriteHooks && this._prewriteHooks.length > 0) {
      for (const op of operations) {
        for (const hook of this._prewriteHooks) {
          hook(op, batch)
        }
      }
    }
    // Process all operations (original + those added by hooks)
    try {
      await pAll(
        _.map(batch.operations, (item) => {
          return async () => {
            if (item.type === 'put' && !item.key.startsWith('ÿ')) {
              const sanitizedKey = sanitizeQuery(item.key)
              let parsedValue
              if (_.isString(item.value)) {
                try {
                  parsedValue = JSON.parse(item.value)
                } catch {
                  parsedValue = item.value
                }
              } else {
                parsedValue = item.value
              }
              const sanitizedValue = sanitizeQuery(parsedValue)
              const existingRecord = await this.collection.findOne({ _id: sanitizedKey })
              if (existingRecord) {
                await this.collection.updateOne({ _id: sanitizedKey }, { $set: sanitizedValue })
              } else {
                await this.collection.insertOne(sanitizedValue)
              }
            } else if (item.type === 'del' && !item.key.startsWith('ÿ')) {
              const sanitizedKey = sanitizeQuery(item.key)
              await this.collection.deleteOne({ _id: sanitizedKey })
            }
          }
        }),
        { concurrency: 1 },
      )
    } catch (error) {
      throw new Error(`MongoDB batch error: ${error.message}`)
    }
  }
  _iterator(options) {
    return new MongoIterator(this, options)
  }
}

const gClientPromiseMap = {}
const gClientMap = {}

module.exports = MongoDOWN
