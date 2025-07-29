const _ = require('lodash')
const fs = require('fs-extra')
const { AbstractLevel, AbstractIterator } = require('abstract-level')
const path = require('path')

const NOT_FOUND_ERROR = 'LEVEL_NOT_FOUND'

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
    this._keys = this._keys.filter(key => {
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
  constructor(location, options = {}) {
    // Manifest must declare supported encodings
    const manifest = {
      encodings: { utf8: true, buffer: true, view: true }
      // Add more features if needed (e.g., has, getMany, etc.)
    }
    super(manifest, options)
    this.location = location
    this._store = new Map()

    // Add hooks support for sync/replication
    this.hooks = {
      prewrite: {
        noop: true,  // Start as true, set to false when hooks are added
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
        }
      },
      postopen: {
        noop: true,
        add: () => {},
        delete: () => {},
        run: () => {}
      },
      newsub: {
        noop: true,
        add: () => {},
        delete: () => {},
        run: () => {}
      }
    }
    this._prewriteHooks = []
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
    await fs.writeFile(this.location, jsonData)
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
    // Call prewrite hooks
    const batch = {
      operations: [],
      add: (op) => {
        batch.operations.push(op)
      }
    }
    const putOp = { type: 'put', key, value }
    if (this._prewriteHooks && this._prewriteHooks.length > 0) {
      for (const hook of this._prewriteHooks) {
        hook(putOp, batch)
      }
    }
    // Handle index and clock values specially - store them as JSON strings for abstract-level compatibility
    if (key.startsWith('ÿ index') || key.startsWith('ÿ clock')) {
      // For index and clock keys, store without double encoding (but still as JSON strings)
      // If the value is already a JSON string, use it as-is, otherwise JSON.stringify it
      let finalValue = value
      if (!_.isString(value)) {
        finalValue = JSON.stringify(value)
      } else {
        // Check if it's already a valid JSON string
        try {
          JSON.parse(value)
          finalValue = value // Already a JSON string
        } catch {
          // It's a plain string, so JSON.stringify it
          finalValue = JSON.stringify(value)
        }
      }
      this._store.set(key, finalValue)
    } else {
      // For regular records, store as-is (already JSON encoded by abstract-level)
      this._store.set(key, value)
    }
    // Apply any additional operations added by hooks
    for (const op of batch.operations) {
      if (op.type === 'put') {
        // Handle index and clock values in hook operations too
        if (op.key.startsWith('ÿ index') || op.key.startsWith('ÿ clock')) {
          // For index and clock keys, avoid double encoding
          let finalValue = op.value
          if (!_.isString(op.value)) {
            finalValue = JSON.stringify(op.value)
          } else {
            // Check if it's already a valid JSON string
            try {
              JSON.parse(op.value)
              finalValue = op.value // Already a JSON string
            } catch {
              // It's a plain string, so JSON.stringify it
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
    await this._persist() // Save after every put
  }
  async _get(key, _options) {
    if (!this._store.has(key)) {
      const notFoundError = new Error(`Key not found in database [${key}]`)
      notFoundError.code = NOT_FOUND_ERROR
      throw notFoundError
    }
    return this._store.get(key)
  }
  async _del(key, _options) {
    // Call prewrite hooks
    const batch = {
      operations: [],
      add: (op) => {
        batch.operations.push(op)
      }
    }
    const delOp = { type: 'del', key }
    if (this._prewriteHooks && this._prewriteHooks.length > 0) {
      for (const hook of this._prewriteHooks) {
        hook(delOp, batch)
      }
    }
    // Apply the original delete operation
    this._store.delete(key)
    // Apply any additional operations added by hooks
    for (const op of batch.operations) {
      if (op.type === 'put') {
        this._store.set(op.key, op.value)
      } else if (op.type === 'del') {
        this._store.delete(op.key)
      }
    }
    await this._persist() // Save after every delete
  }
  async _batch(operations, _options) {
    // Create a batch object that the hooks can modify
    const batch = {
      operations: [...operations], // Copy the operations
      add: (op) => {
        batch.operations.push(op)
      }
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
    for (const op of batch.operations) {
      if (op.type === 'put') {
        // Handle index and clock values specially
        if (op.key.startsWith('ÿ index') || op.key.startsWith('ÿ clock')) {
          // For index and clock keys, avoid double encoding
          let finalValue = op.value
          if (!_.isString(op.value)) {
            finalValue = JSON.stringify(op.value)
          } else {
            // Check if it's already a valid JSON string
            try {
              JSON.parse(op.value)
              finalValue = op.value // Already a JSON string
            } catch {
              // It's a plain string, so JSON.stringify it
              finalValue = JSON.stringify(op.value)
            }
          }
          this._store.set(op.key, finalValue)
        } else {
          // For regular records, handle normally
          const stringValue = _.isString(op.value) ? op.value : JSON.stringify(op.value)
          this._store.set(op.key, stringValue)
        }
      } else if (op.type === 'del') {
        this._store.delete(op.key)
      }
    }
    await this._persist() // Save once after the whole batch
  }
  _iterator(options) {
    return new SingleJsonFileIterator(this, options)
  }
}

module.exports = JsonDOWN
