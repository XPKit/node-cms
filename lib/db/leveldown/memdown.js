const _ = require('lodash')
let bops = require('bops')
let AbstractLevelDOWN = require('abstract-leveldown').AbstractLevelDOWN
let AbstractIterator = require('abstract-leveldown').AbstractIterator
let noop = function () {}
let setImmediate = global.setImmediate || process.nextTick

function toKey (key) {
  return _.isString(key) ? '$' + key : JSON.stringify(key)
}

function sortedIndexOf (arr, item) {
  let low = 0
  let high = arr.length
  let mid
  while (low < high) {
    mid = (low + high) >>> 1
    arr[mid] < item ? low = mid + 1 : high = mid
  }
  return low
}

class MemIterator extends AbstractIterator {
  constructor (db, options) {
    super(db)
    this._reverse = options.reverse
    this._limit = options.limit
    this._count = 0
    this._end = options.end
    this._start = options.start
    this._gt = options.gt
    this._gte = options.gte
    this._lt = options.lt
    this._lte = options.lte
    this._keys = []
    let i
    if (this._start) {
      for (i = 0; i < this.db._keys.length; i++) {
        if (this.db._keys[i] >= this._start) {
          this._pos = i
          if (this.db._keys[i] !== this._start) {
            if (this._reverse) {
              // going backwards and key doesn't match, jump back one
              --this._pos
            }
          } else {
            if (options.exclusiveStart) {
              // key matches but it's a gt or lt
              this._pos += (this._reverse ? -1 : 1)
            }
          }
          break
        }
      }
      if (this._pos == null && !this._reverse) { // no matching keys, non starter
        this._pos = -1
      }
    }
    if (!options.start || this._pos === undefined) {
      this._pos = this._reverse ? this.db._keys.length - 1 : 0
    }
    // copy the keys that we need so that they're not affected by puts/deletes
    if (this._pos >= 0) {
      this._keys = this._reverse ? this.db._keys.slice(0, this._pos + 1) : this.db._keys.slice(this._pos)
      this._pos = this._reverse ? this._keys.length - 1 : 0
    }
  }

  _next (callback) {
    let self = this
    let key = self._keys[self._pos]
    let value
    if (
      (self._pos >= self._keys.length || self._pos < 0) ||
      (!!self._end && (self._reverse ? key < self._end : key > self._end)) ||
      (!!self._limit && self._limit > 0 && self._count++ >= self._limit) ||
      ((this._lt && key >= this._lt) ||
       (this._lte && key > this._lte) ||
       (this._gt && key <= this._gt) ||
       (this._gte && key < this._gte))
    ) {
      return setImmediate(callback)
    }
    value = self.db._store[toKey(key)]

    if (!value) {
      key = undefined
    }
    self._pos += self._reverse ? -1 : 1

    setImmediate(function () { callback(null, key, value) })
  }
}

class MemDOWN extends AbstractLevelDOWN {
  constructor (location) {
    super(_.isString(location) ? location : '')
    this._store = {}
    this._keys = []
  }

  _open (options, callback) {
    let self = this
    setImmediate(function () { callback(null, self) })
  }

  _put (key, value, options, callback) {
    let ix = sortedIndexOf(this._keys, key)
    if (this._keys[ix] !== key) { this._keys.splice(ix, 0, key) }
    key = toKey(key) // safety, to avoid key='__proto__'-type skullduggery
    this._store[key] = value
    setImmediate(callback)
  }

  _get (key, options, callback) {
    let value = this._store[toKey(key)]
    if (value === undefined) {
      // 'NotFound' error, consistent with LevelDOWN API
      return setImmediate(function () { callback(new Error('NotFound')) })
    }
    if (options.asBuffer !== false && !bops.is(value)) { value = bops.from(String(value)) }
    setImmediate(function () {
      callback(null, value)
    })
  }

  _del (key, options, callback) {
    let ix = sortedIndexOf(this._keys, key)
    if (this._keys[ix] === key) { this._keys.splice(ix, 1) }
    delete this._store[toKey(key)]
    setImmediate(callback)
  }

  _batch (array, options, callback) {
    let err
    let i = 0
    let key
    let value

    if (_.isArray(array)) {
      for (; i < array.length; i++) {
        if (array[i]) {
          key = bops.is(array[i].key) ? array[i].key : String(array[i].key)
          err = this._checkKeyValue(key, 'key')
          if (err) return setImmediate(function () { callback(err) })
          if (array[i].type === 'del') {
            this._del(array[i].key, options, noop)
          } else if (array[i].type === 'put') {
            value = bops.is(array[i].value) ? array[i].value : String(array[i].value)
            err = this._checkKeyValue(value, 'value')
            if (err) return setImmediate(function () { callback(err) })
            this._put(key, value, options, noop)
          }
        }
      }
    }
    setImmediate(callback)
  }

  _iterator (options) {
    return new MemIterator(this, options)
  }

  _isBuffer (obj) {
    return bops.is(obj)
  }
}

module.exports = MemDOWN
