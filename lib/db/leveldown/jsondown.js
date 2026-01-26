const _ = require('lodash')
const fs = require('fs-extra')
const { AbstractLevel, AbstractIterator } = require('abstract-level')
const path = require('node:path')

/**
 * An iterator for the SingleJsonFileDb.
 * It iterates over the keys of the in-memory Map, respecting range options.
 * This version uses the modern async _next() method.
 */
class SingleJsonFileIterator extends AbstractIterator {
  constructor(db, options) {
    super(db, options)
    this.options = options || {}
    // Get a sorted list of keys from the in-memory map
    this._keys = [...this.db._store.keys()].sort()
    this._index = 0
    // Handle range options (gte, lte, gt, lt, reverse, limit)
    const { gte, lte, gt, lt, reverse, limit } = this.options
    if (reverse) {
      this._keys.reverse()
    }
    // Filter keys based on the range
    this._keys = this._keys.filter((key) => {
      if (gte !== undefined && key < gte) return false
      if (lte !== undefined && key > lte) return false
      if (gt !== undefined && key <= gt) return false
      if (lt !== undefined && key < lt) return false
      return true
    })
    if (limit !== undefined && limit > -1) {
      this._keys = this._keys.slice(0, limit)
    }
  }
  // Modern async _next(), returns [key, value] or undefined.
  async _next() {
    // Check if we are done iterating
    if (this._index >= this._keys.length) {
      return // Returning undefined signals the end of iteration
    }
    const key = this._keys[this._index]
    const value = this.db._store.get(key) // Return normalized value for abstract-level to decode
    this._index++
    return [key, value]
  }
}
/**
 * A custom database that uses a single JSON file for persistence,
 * while keeping the entire dataset in memory for fast reads.
 * This version uses the modern async/await private methods.
 */
class JsonDOWN extends AbstractLevel {
  /**
   * Ensure all pending writes are flushed to disk before closing.
   */
  async close() {
    this._closing = true
    // Wait for any pending debounced persist to finish
    if (this._persistScheduled && this._persistPromise) {
      try {
        await this._persistPromise
      } catch (err) {
        // Log but do not throw, to avoid blocking close
        console.error(`[jsondown] [${new Date().toISOString()}] _close: ERROR in pending persist`, err)
      }
    }
    // Final flush to disk to ensure all data is persisted
    try {
      await this._persist()
    } catch (err) {
      console.error(`[jsondown] [${new Date().toISOString()}] _close: ERROR in final persist`, err)
    }
  }
  constructor(location, options = {}) {
    // Manifest must declare supported encodings
    const manifest = {
      encodings: { utf8: true, buffer: true, view: true },
      // Add more features if needed (e.g., has, getMany, etc.)
    }
    super(manifest, options)
    this.location = location
    this._store = new Map()

    // Add hooks support for sync/replication
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
    // Track closing state
    this._closing = false
    // Write queue for serializing all write operations
    this._writeQueue = []
    this._writeInProgress = false
    // Debounced persist state
    this._persistScheduled = false
    this._persistDelay = 50 // ms, can be tuned
    this._persistPromise = null
  }
  /**
   * Writes the entire in-memory map to the JSON file.
   */
  async _persist() {
    // Convert Map to an object {key: value} for JSON serialization
    const data = {}
    for (const [key, value] of this._store.entries()) {
      // Add $ prefix to all keys when persisting
      const prefixedKey = `$${key}`
      data[prefixedKey] = value
    }
    const jsonData = JSON.stringify(data, null, 2)
    try {
      await fs.writeFile(this.location, jsonData)
    } catch (err) {
      console.error(`[jsondown] [${new Date().toISOString()}] _persist: ERROR writing file to ${this.location}`, err)
      throw err
    }
    if (this._closing) {
      return
    }
    try {
      const data = {}
      for (const [key, value] of this._store.entries()) {
        const prefixedKey = `$${key}`
        data[prefixedKey] = value
      }
      const jsonData = JSON.stringify(data, null, 2)
      await fs.writeFile(this.location, jsonData)
    } catch (err) {
      console.error(
        `[jsondown] [${new Date().toISOString()}] _persist: ERROR writing file (2nd write) to ${this.location}`,
        err,
      )
      throw err
    }
  }

  /**
   * Debounced persist: schedule a flush to disk after a short delay.
   * Returns a promise that resolves when the flush is complete.
   */
  _schedulePersist() {
    if (this._persistScheduled) {
      // Already scheduled, return the pending promise
      return this._persistPromise
    }
    this._persistScheduled = true
    this._persistPromise = new Promise((resolve, reject) => {
      setTimeout(async () => {
        this._persistScheduled = false
        try {
          await this._persist()
          resolve()
        } catch (err) {
          reject(err)
        }
      }, this._persistDelay)
    })
    return this._persistPromise
  }
  async _open(_options) {
    try {
      // Ensure the directory for the file exists
      await fs.ensureDir(path.dirname(this.location))
      // Try to read the existing database file
      const content = await fs.readFile(this.location, { encoding: 'utf8' })
      let data
      try {
        data = JSON.parse(content)
        // Handle legacy array format and convert to object format
        if (_.isArray(data)) {
          const objectData = {}
          for (const [key, value] of data) {
            objectData[key] = value
          }
          data = objectData
        }
        // Ensure we have an object
        if (!_.isObject(data) || _.isArray(data) || data === null) {
          data = {}
        }
      } catch (error) {
        console.error('Parsing error:', error)
        data = {}
      }
      // Convert object to Map entries for storage
      const entries = []
      for (const [prefixedKey, value] of Object.entries(data)) {
        // Remove $ prefix from keys when loading
        const key = prefixedKey.startsWith('$') ? prefixedKey.substring(1) : prefixedKey
        if (_.isString(value)) {
          // Handle index and clock keys - they should not be double-encoded
          if (key.startsWith('ÿ index') || key.startsWith('ÿ clock')) {
            // For index and clock keys, clean up any double encoding and store as proper JSON strings
            let cleanValue = value
            // Remove extra quotes if they exist
            if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
              try {
                cleanValue = JSON.parse(cleanValue)
                // If it's still a quoted string after parsing, parse again
                if (_.isString(cleanValue) && cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
                  cleanValue = JSON.parse(cleanValue)
                }
              } catch {
                // If parsing fails, just use the original value without quotes
                cleanValue = cleanValue.slice(1, -1)
              }
            }
            // Store as proper JSON string (single encoding only)
            entries.push([key, JSON.stringify(cleanValue)])
          } else {
            // For record keys, handle normally
            try {
              // Try parsing to see what we have
              JSON.parse(value)
              // abstract-level will call JSON.parse() on what we return
              // So we need to return a JSON string that will parse to the correct final value
              entries.push([key, value])
            } catch {
              // Not valid JSON, treat as raw string value
              // We want final result to be this string, so store it JSON-encoded
              entries.push([key, JSON.stringify(value)])
            }
          }
        } else {
          // For non-string values (objects, arrays, etc.), JSON encode them
          // This handles cases where the file has already-parsed objects
          entries.push([key, JSON.stringify(value)])
        }
      }
      this._store = new Map(entries)
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err
      }
      this._store = new Map()
    }
  }
  async _put(key, value, _options) {
    return this._enqueueWrite(async () => {
      if (this._closing) {
        throw new Error('Database is closing, no new writes allowed')
      }
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
      // Handle index and clock values specially - store them as JSON strings for abstract-level compatibility
      if (key.startsWith('ÿ index') || key.startsWith('ÿ clock')) {
        let finalValue = value
        if (!_.isString(value)) {
          finalValue = JSON.stringify(value)
        } else {
          try {
            JSON.parse(value)
            finalValue = value
          } catch {
            finalValue = JSON.stringify(value)
          }
        }
        this._store.set(key, finalValue)
      } else {
        this._store.set(key, value)
      }
      for (const op of batch.operations) {
        if (op.type === 'put') {
          if (op.key.startsWith('ÿ index') || op.key.startsWith('ÿ clock')) {
            let finalValue = op.value
            if (!_.isString(op.value)) {
              finalValue = JSON.stringify(op.value)
            } else {
              try {
                JSON.parse(op.value)
                finalValue = op.value
              } catch {
                finalValue = JSON.stringify(op.value)
              }
            }
            this._store.set(op.key, finalValue)
          } else {
            this._store.set(op.key, op.value)
          }
        } else if (op.type === 'del') {
          this._store.delete(op.key)
        }
      }
      // Schedule a debounced persist, but do not await it
      this._schedulePersist()
    })
  }
  async _get(key, _options) {
    if (!this._store.has(key)) {
      const notFoundError = new Error(`Key not found in database [${key}]`)
      notFoundError.code = 404
      throw notFoundError
    }
    const value = this._store.get(key)
    return value
  }
  async _del(key, _options) {
    return this._enqueueWrite(async () => {
      if (this._closing) {
        throw new Error('Database is closing, no new writes allowed')
      }
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
      this._store.delete(key)
      for (const op of batch.operations) {
        if (op.type === 'put') {
          this._store.set(op.key, op.value)
        } else if (op.type === 'del') {
          this._store.delete(op.key)
        }
      }
      // Schedule a debounced persist, but do not await it
      this._schedulePersist()
    })
  }
  async _batch(operations, _options) {
    return this._enqueueWrite(async () => {
      if (this._closing) {
        throw new Error('Database is closing, no new writes allowed')
      }
      const batch = {
        operations: [...operations],
        add: (op) => {
          batch.operations.push(op)
        },
      }
      if (this._prewriteHooks && this._prewriteHooks.length > 0) {
        for (const op of operations) {
          for (const hook of this._prewriteHooks) {
            hook(op, batch)
          }
        }
      }
      for (const op of batch.operations) {
        if (op.type === 'put') {
          if (op.key.startsWith('ÿ index') || op.key.startsWith('ÿ clock')) {
            let finalValue = op.value
            if (!_.isString(op.value)) {
              finalValue = JSON.stringify(op.value)
            } else {
              try {
                JSON.parse(op.value)
                finalValue = op.value
              } catch {
                finalValue = JSON.stringify(op.value)
              }
            }
            this._store.set(op.key, finalValue)
          } else {
            const stringValue = _.isString(op.value) ? op.value : JSON.stringify(op.value)
            this._store.set(op.key, stringValue)
          }
        } else if (op.type === 'del') {
          this._store.delete(op.key)
        }
      }
      // Schedule a debounced persist, but do not await it
      this._schedulePersist()
    })
  }
  /**
   * Enqueue a write operation to ensure all writes are serialized.
   * @param {Function} fn - The async function to execute.
   */
  async _enqueueWrite(fn) {
    return new Promise((resolve, reject) => {
      this._writeQueue.push({ fn, resolve, reject })
      this._processWriteQueue()
    })
  }

  async _processWriteQueue() {
    if (this._writeInProgress) return
    const next = this._writeQueue.shift()
    if (!next) return
    this._writeInProgress = true
    try {
      const result = await next.fn()
      next.resolve(result)
    } catch (err) {
      next.reject(err)
    } finally {
      this._writeInProgress = false
      setImmediate(() => this._processWriteQueue())
    }
  }
  _iterator(options) {
    return new SingleJsonFileIterator(this, options)
  }
}

module.exports = JsonDOWN
