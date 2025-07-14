const util = require('util')
const bops = require('bops')
const AbstractLevelDOWN = require('abstract-leveldown').AbstractLevelDOWN
const AbstractIterator = require('abstract-leveldown').AbstractIterator
const { MongoClient, ServerApiVersion } = require('mongodb')
const Q = require('q')
const pAll = require('p-all')
const _ = require('lodash')

// const noop = function () {}
// const setImmediate = global.setImmediate || process.nextTick

function MongoIterator (db, cursor) {
  AbstractIterator.call(this, db)
  this.cursor = cursor
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

util.inherits(MongoIterator, AbstractIterator)

MongoIterator.prototype._next = async function (callback) {
  try {
    if (!await this.cursor.hasNext()) {
      return callback(null)
    }
    let value = await this.cursor.next()
    return callback(null, value._id, JSON.stringify(value))
  } catch (error) {
    callback(new Error(`MongoIterator next error, ${error.message}`))
  }
}

function MongoDOWN (location) {
  if (!(this instanceof MongoDOWN)) {
    return new MongoDOWN(location)
  }
  AbstractLevelDOWN.call(this, '')
  const segments = location.split('/')
  const indexMap = segments.pop()
  const collectionName = segments.pop()
  const dbName = segments.pop()
  const host = segments.join('/')
  this.host = `${process.env.MONGODB_PROTOCOL || 'mongodb'}://${host}`
  this.dbName = dbName
  this.collectionName = collectionName
  this.collection = null
  try {
    this.indexMap = JSON.parse(indexMap)
  } catch (error) {
    console.error(`unable to json parse indexMap string ${indexMap}, ${error.message}`)
  }
}

util.inherits(MongoDOWN, AbstractLevelDOWN)

const gClientPromiseMap = {}
const gClientMap = {}

MongoDOWN.prototype.getClient = async function (host) {
  let client = gClientMap[host]
  if (client) {
    return client
  }
  const deferred = Q.defer()
  gClientPromiseMap[host] = gClientPromiseMap[host] || []
  gClientPromiseMap[host].push(deferred)
  if (gClientPromiseMap[host].length === 1) {
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
    // console.log(111, host, params)
    try {
      const client = await MongoClient.connect(host, params)
      gClientMap[host] = client
      _.each(gClientPromiseMap[host], deferred => {
        deferred.resolve(client)
      })
    } catch (error) {
      console.error('MongoClient.connect error: ', error)
    }
  }
  return deferred.promise
}

MongoDOWN.prototype._open = async function (options, callback) {
  try {
    // callback('open error')
    const client = await this.getClient(this.host)
    this.db = client.db(this.dbName)
  } catch (error) {
    return callback(new Error(`Error occured in connecting (${this.host}) dbName (${this.dbName}), ${error.message}`))
  }
  try {
    this.collection = this.db.collection(this.collectionName)
    if (!_.isEmpty(this.indexMap)) {
      await this.collection.createIndex(this.indexMap, null)
    }
    try {
      await this.collection.createIndex({ '$**': 1 }, null)
    } catch (error) {
      console.error(error)
    }
  } catch (error) {
    return callback(new Error(`Error create mongodb collection (${this.collectionName}), ${error.message}`))
  }
  callback(null, this)
}

MongoDOWN.prototype._put = async function (key, value, options, callback) {
  try {
    // Sanitize the key to prevent injection
    const sanitizedKey = sanitizeQuery(key)
    value = JSON.parse(value)
    // Sanitize the value object to prevent injection
    const sanitizedValue = sanitizeQuery(value)
    let result
    let record = await this.collection.findOne({_id: sanitizedKey})
    if (record) {
      result = await this.collection.updateOne({_id: sanitizedKey}, {$set: sanitizedValue})
    } else {
      result = await this.collection.insertOne(sanitizedValue)
    }
    if (!result) {
      callback(new Error('NotFound'))
    } else {
      callback(null, _.first(result.ops))
    }
  } catch (error) {
    callback(error)
  }
}

MongoDOWN.prototype._get = async function (key, options, callback) {
  try {
    // Sanitize the key to prevent injection
    const sanitizedKey = sanitizeQuery(key)
    let record = await this.collection.findOne({_id: sanitizedKey})
    if (!record) {
      callback(new Error('NotFound'))
    } else {
      callback(null, JSON.stringify(record))
    }
  } catch (error) {
    callback(error)
  }
}

MongoDOWN.prototype._del = async function (key, options, callback) {
  try {
    // Sanitize the key to prevent injection
    const sanitizedKey = sanitizeQuery(key)
    let record = await this.collection.deleteOne({_id: sanitizedKey})
    if (!record) {
      callback(new Error('NotFound'))
    } else {
      callback(null, JSON.stringify(record))
    }
  } catch (error) {
    callback(error)
  }
}

MongoDOWN.prototype._batch = async function (array, options, callback) {
  try {
    await pAll(_.map(array, item => {
      return async () => {
        if (item.type === 'put') {
          if (!_.startsWith(item.key, 'ÿ')) {
            // Sanitize the key to prevent injection
            const sanitizedKey = sanitizeQuery(item.key)
            const value = JSON.parse(item.value)
            // Sanitize the value object to prevent injection
            const sanitizedValue = sanitizeQuery(value)
            let record = await this.collection.findOne({_id: sanitizedKey})
            if (record) {
              return await this.collection.updateOne({_id: sanitizedKey}, {$set: sanitizedValue})
            }
            return await this.collection.insertOne(sanitizedValue)
          }
        }
      }
    }), {concurrency: 1})
    callback(null)
  } catch (error) {
    callback(new Error(`batch error, ${error.message}`))
  }
}

MongoDOWN.prototype._iterator = function (options) {
  // Sanitize the query options to prevent injection
  const sanitizedOptions = { ...options }
  if (sanitizedOptions.query) {
    sanitizedOptions.query = sanitizeQuery(sanitizedOptions.query)
  }
  let cursor = this.collection.find(sanitizedOptions.query).sort({ _createdAt: 1 }).allowDiskUse(true)
  return new MongoIterator(this, cursor)
}

MongoDOWN.prototype._isBuffer = function (obj) {
  return bops.is(obj)
}

module.exports = MongoDOWN
