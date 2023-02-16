const util = require('util')
const bops = require('bops')
const path = require('path')
const logger = new (require(path.join(__dirname, 'logger')))()
const AbstractLevelDOWN = require('abstract-leveldown').AbstractLevelDOWN
const AbstractIterator = require('abstract-leveldown').AbstractIterator
const XpkitCollection = require('./xpkitCollection')

// const Q = require('q')
const pAll = require('p-all')
const _ = require('lodash')

function XpkitIterator (db, cursor) {
  AbstractIterator.call(this, db)
  this.cursor = cursor
}

util.inherits(XpkitIterator, AbstractIterator)

XpkitIterator.prototype._next = async function (callback) {
  try {
    // logger.warn(`ITERATOR - _NEXT --------------------- `, this.cursor)
    if (!this.cursor.hasNext()) {
      return callback(null)
    }
    let value = await this.cursor.next()
    if (!value) {
      return callback(null)
    }
    return callback(null, value._id, JSON.stringify(value))
  } catch (error) {
    logger.error(`Error on next ---`, error)
    callback(new Error(`XpkitIterator next error, ${error.message}`))
  }
}

function XpkitDown (location) {
  if (!(this instanceof XpkitDown)) { return new XpkitDown(location) }
  AbstractLevelDOWN.call(this, '')
  // logger.warn(`location: `, location)

  const segments = location.split('/')
  const params = segments.pop()
  this.collectionName = segments.pop()
  this.dbName = segments.pop()
  this.host = `https://${segments.join('/')}`    
}

util.inherits(XpkitDown, AbstractLevelDOWN)

XpkitDown.prototype._open = async function (options, callback) {
  try {
    this.collection = new XpkitCollection(this.collectionName, _.get(options, 'options.cms.xptoolkit', false))
  } catch (error) {
    return callback(new Error(`Error occured in connecting (${this.host}) dbName (${this.dbName}), ${error.message}`))
  }
  callback(null, this)
}

XpkitDown.prototype._put = async function (key, value, options, callback) {
  try {
    value = JSON.parse(value)
    let result
    let record = await this.collection.findOne({_id: key})
    if (record) {
      _.set(value, 'name', _.get(value, 'name', _.get(record, 'name')))
      result = await this.collection.updateOne({_id: key}, value)
    } else {
      result = await this.collection.insertOne(value)
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

XpkitDown.prototype._get = async function (key, options, callback) {
  try {
    // logger.warn(`XpkitDown - GET`, key, options)
    let record = await this.collection.findOne({_id: key})
    if (!record) {
      callback(new Error('NotFound'))
    } else {
      callback(null, JSON.stringify(record))
    }
  } catch (error) {
    callback(error)
  }
}

XpkitDown.prototype._del = async function (key, options, callback) {
  try {
    let record = await this.collection.findOne({_id: key})
    if (!record) {
      callback(new Error('NotFound'))
    } else {
      record = await this.collection.deleteOne({_id: key}, record)
      callback(null, JSON.stringify(record))
    }
  } catch (error) {
    callback(error)
  }
}

XpkitDown.prototype._batch = async function (array, options, callback) {
  try {
    await pAll(_.map(array, item => {
      return async () => {
        if (item.type === 'put' && !_.startsWith(item.key, 'ÿ')) {
          const value = JSON.parse(item.value)
          let record = await this.collection.findOne({_id: item.key})
          if (record) {
            return await this.collection.updateOne({_id: item.key}, {$set: value})
          } else {
            return await this.collection.insertOne(value)
          }
        }
      }
    }), {concurrency: 1})
    callback(null)
  } catch (error) {
    callback(new Error(`batch error, ${error.message}`))
  }
}

XpkitDown.prototype._iterator = function (options) {
  try {
    let cursor = this.collection.getCursor(options)
    return new XpkitIterator(this, cursor)
  } catch (error) {
    throw error
  }
}

XpkitDown.prototype._isBuffer = function (obj) {
  return bops.is(obj)
}

module.exports = XpkitDown
