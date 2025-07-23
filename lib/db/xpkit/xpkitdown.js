const bops = require('bops')
const logger = new (require('img-sh-logger'))()
const AbstractLevelDOWN = require('abstract-leveldown').AbstractLevelDOWN
const AbstractIterator = require('abstract-leveldown').AbstractIterator
const XpkitCollection = require('./xpkitCollection')

const pAll = require('p-all')
const _ = require('lodash')

/**
 * XpkitIterator class extending AbstractIterator
 */
class XpkitIterator extends AbstractIterator {
  constructor (db, cursor) {
    super(db)
    this.cursor = cursor
  }

  async _next (callback) {
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
      logger.error('Error on next ---', error)
      callback(new Error(`XpkitIterator next error, ${error.message}`))
    }
  }
}

/**
 * XpkitDown class extending AbstractLevelDOWN
 */
class XpkitDown extends AbstractLevelDOWN {
  constructor (location) {
    super('')
    // logger.warn(`location: `, location)

    const segments = location.split('/')
    segments.pop()
    this.collectionName = segments.pop()
    this.dbName = segments.pop()
    this.host = `https://${segments.join('/')}`
  }

  async _open (options, callback) {
    try {
      this.collection = new XpkitCollection(this.collectionName, _.get(options, 'options.cms.xptoolkit', false))
    } catch (error) {
      return callback(new Error(`Error occured in connecting (${this.host}) dbName (${this.dbName}), ${error.message}`))
    }
    callback(null, this)
  }

  async _put (key, value, options, callback) {
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

  async _get (key, options, callback) {
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

  async _del (key, options, callback) {
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

  async _batch (array, options, callback) {
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

  _iterator (options) {
    return new XpkitIterator(this, this.collection.getCursor(options))
  }

  _isBuffer (obj) {
    return bops.is(obj)
  }
}

// Factory function for levelup compatibility
function XpkitDownFactory (location) {
  return new XpkitDown(location)
}

// Copy class methods to factory function for compatibility
Object.setPrototypeOf(XpkitDownFactory, XpkitDown)
Object.assign(XpkitDownFactory, XpkitDown)

module.exports = XpkitDownFactory

