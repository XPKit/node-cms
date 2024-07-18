const util = require('util')
const fs = require('fs')
const MemDOWN = require('./memdown')

function noop () {}

function JsonDOWN (location) {
  if (!(this instanceof JsonDOWN)) {
    return new JsonDOWN(location)
  }
  MemDOWN.call(this, location)
  this._isLoadingFromFile = false
  this._isWriting = false
  this._queuedWrites = []
}

util.inherits(JsonDOWN, MemDOWN)

JsonDOWN.prototype._jsonToBatchOps = function (data) {
  return Object.keys(data).map((key) => {
    let value = data[key]
    if (/^\$/.test(key)) {
      key = key.slice(1)
    } else {
      try {
        key = Buffer.from(JSON.parse(key))
      } catch (e) {
        throw new Error(`Error parsing key ${JSON.stringify(key)} as a buffer`)
      }
    }
    if (typeof (value) !== 'string') {
      try {
        value = Buffer.from(value)
      } catch (e) {
        throw new Error(`Error parsing value ${JSON.stringify(value)
        } as a buffer`)
      }
    }
    return { type: 'put', key, value }
  })
}

JsonDOWN.prototype._open = function (options, cb) {
  const bakLocation = `${this.location}.bak`
  if (!fs.existsSync(this.location) && fs.existsSync(bakLocation)) {
    fs.renameSync(bakLocation, this.location)
  }
  fs.readFile(this.location, 'utf-8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return cb(null, this)
      }
      return cb(err)
    }
    try {
      data = JSON.parse(data)
    } catch (e) {
      return cb(new Error(`Error parsing JSON in ${this.location
      }: ${e.message}`))
    }
    this._isLoadingFromFile = true
    try {
      try {
        this._batch(this._jsonToBatchOps(data), {}, noop)
      } finally {
        this._isLoadingFromFile = false
      }
    } catch (e) {
      return cb(e)
    }
    cb(null, this)
  })
}

JsonDOWN.prototype._writeToDisk = function (cb) {
  if (this._isWriting) {
    return this._queuedWrites.push(cb)
  }
  this._isWriting = true
  const bakLocation = `${this.location}.bak`
  fs.writeFile(bakLocation, JSON.stringify(this._store, null, 2), {
    encoding: 'utf-8'
  }, (err) => {
    if (!err) {
      if (fs.existsSync(this.location) && fs.existsSync(bakLocation)) {
        try {
          const text = fs.readFileSync(bakLocation, 'utf-8')
          const json = JSON.parse(text)
          if (json) {
            fs.unlinkSync(this.location)
            fs.renameSync(bakLocation, this.location)
          }
        } catch (error) {
          console.warn(error)
        }
      }
    }
    const queuedWrites = this._queuedWrites.splice(0)
    this._isWriting = false
    if (queuedWrites.length) {
      this._writeToDisk((err) => {
        queuedWrites.forEach((cb) => {
          cb(err)
        })
      })
    }
    cb(err)
  })
}

JsonDOWN.prototype._put = function (key, value, options, cb) {
  MemDOWN.prototype._put.call(this, key, value, options, noop)
  if (!this._isLoadingFromFile) {
    this._writeToDisk(cb)
  }
}

JsonDOWN.prototype._del = function (key, options, cb) {
  MemDOWN.prototype._del.call(this, key, options, noop)
  this._writeToDisk(cb)
}

module.exports = JsonDOWN
