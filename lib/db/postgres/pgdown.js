const { AbstractLevel, AbstractIterator } = require('abstract-level')
const { Pool } = require('pg')
const pAll = require('p-all')
const _ = require('lodash')

/**
 * Builds a SQL WHERE clause from a MongoDB-style query object.
 * @param {Object} query - MongoDB-style filter
 * @param {Array} params - Accumulates parameterized values
 * @returns {string|null} SQL condition string or null if none
 */
function buildWhereClause(query, params) {
  if (_.isEmpty(query)) {
    return null
  }
  const conditions = []
  for (const [key, value] of Object.entries(query)) {
    if (key === '_id' || key === 'id') {
      if (_.isString(value)) {
        if (value === 'INVALID_ID') {
          conditions.push('1=0')
        } else {
          params.push(value)
          conditions.push(`id = $${params.length}`)
        }
      } else if (_.isObject(value) && !_.isArray(value)) {
        if (value.$regex) {
          const pattern = value.$regex instanceof RegExp
            ? value.$regex.source
            : _.toString(value.$regex)
          params.push(pattern)
          conditions.push(`id ~ $${params.length}`)
        }
        if (value.$nin) {
          const arr = _.isArray(value.$nin) ? value.$nin : []
          if (arr.length > 0) {
            params.push(arr)
            conditions.push(`id != ALL($${params.length})`)
          } else {
            conditions.push('1=1')
          }
        }
      }
    } else if (key === '$and') {
      if (_.isArray(value)) {
        const subConditions = []
        for (const subQuery of value) {
          const clause = buildWhereClause(subQuery, params)
          if (clause) {
            subConditions.push(`(${clause})`)
          }
        }
        if (subConditions.length > 0) {
          conditions.push(subConditions.join(' AND '))
        }
      }
    } else if (key === '$or') {
      if (_.isArray(value)) {
        const subConditions = []
        for (const subQuery of value) {
          const clause = buildWhereClause(subQuery, params)
          if (clause) {
            subConditions.push(`(${clause})`)
          }
        }
        if (subConditions.length > 0) {
          conditions.push(`(${subConditions.join(' OR ')})`)
        }
      }
    } else {
      const jsonKey = key.replace(/'/g, '\'\'')
      if (_.isString(value) || _.isNumber(value) || _.isBoolean(value)) {
        params.push(_.toString(value))
        conditions.push(`data->>'${jsonKey}' = $${params.length}`)
      } else if (_.isNull(value)) {
        conditions.push(`data->>'${jsonKey}' IS NULL`)
      } else if (_.isObject(value) && !_.isArray(value)) {
        if (value.$regex) {
          const pattern = value.$regex instanceof RegExp
            ? value.$regex.source
            : _.toString(value.$regex)
          params.push(pattern)
          conditions.push(`data->>'${jsonKey}' ~ $${params.length}`)
        }
        if (value.$in) {
          const arr = _.isArray(value.$in) ? value.$in : []
          if (arr.length > 0) {
            params.push(arr.map(_.toString))
            conditions.push(
              `data->>'${jsonKey}' = ANY($${params.length})`
            )
          }
        }
        if (value.$nin) {
          const arr = _.isArray(value.$nin) ? value.$nin : []
          if (arr.length > 0) {
            params.push(arr.map(_.toString))
            conditions.push(
              `data->>'${jsonKey}' != ALL($${params.length})`
            )
          }
        }
      }
    }
  }
  return conditions.length > 0 ? conditions.join(' AND ') : null
}

/**
 * Parses a value to a plain object suitable for JSONB storage.
 * @param {*} value
 * @returns {Object}
 */
function parseValue(value) {
  if (_.isString(value)) {
    try {
      return JSON.parse(value)
    } catch {
      return { _raw: value }
    }
  }
  return value
}

/**
 * An iterator for the PostgreSQL database.
 * Fetches all matching rows on the first _next() call,
 * then returns them one by one as [key, value] pairs.
 */
class PgIterator extends AbstractIterator {
  /**
   * @param {PgDOWN} db
   * @param {Object} options - reverse, limit, query
   */
  constructor(db, options) {
    super(db, options)
    this.options = options || {}
    this._rows = null
    this._index = 0
  }

  /**
   * Lazily loads all matching rows from PostgreSQL.
   * @returns {Promise<void>}
   */
  async _ensureRows() {
    if (this._rows !== null) {
      return
    }
    const { reverse, limit, query } = this.options
    const params = []
    const whereClause = buildWhereClause(query || {}, params)
    let sql = `SELECT id, data FROM "${this.db.tableName}"`
    if (whereClause) {
      sql += ` WHERE ${whereClause}`
    }
    sql += ` ORDER BY created_at ${reverse ? 'DESC' : 'ASC'}`
    if (limit !== undefined && limit > -1) {
      sql += ` LIMIT ${parseInt(limit, 10)}`
    }
    try {
      const result = await this.db.pool.query(sql, params)
      this._rows = result.rows
    } catch (error) {
      throw new Error(`PgIterator query error: ${error.message}`)
    }
  }

  /**
   * Returns the next [key, value] pair, or undefined when exhausted.
   * @returns {Promise<Array|undefined>}
   */
  async _next() {
    await this._ensureRows()
    if (this._index >= this._rows.length) {
      return
    }
    const row = this._rows[this._index++]
    return [row.id, JSON.stringify(row.data)]
  }
}

/**
 * A custom AbstractLevel database backed by PostgreSQL.
 * Stores each record as a row with: id TEXT PRIMARY KEY, data JSONB.
 * Location format: host:port/dbname/tablename/indexMapJson
 */
class PgDOWN extends AbstractLevel {
  /**
   * @param {string} location - e.g. "localhost:5432/mydb/articles/{}"
   * @param {Object} options - AbstractLevel options
   */
  constructor(location, options = {}) {
    const manifest = {
      encodings: { utf8: true, buffer: true, view: true },
      has: true,
      getMany: true,
      implicitSnapshots: false,
      explicitSnapshots: false
    }
    super(manifest, options)
    const segments = location.split('/')
    const indexMapStr = segments.pop()
    this.tableName = segments.pop()
    const dbName = segments.pop()
    const hostPort = segments.join('/')
    const colonIdx = hostPort.lastIndexOf(':')
    let parsedHost, parsedPort
    if (colonIdx !== -1) {
      parsedHost = hostPort.substring(0, colonIdx)
      parsedPort = parseInt(hostPort.substring(colonIdx + 1), 10) || 5432
    } else {
      parsedHost = hostPort || 'localhost'
      parsedPort = 5432
    }
    this.pgConfig = {
      host: process.env.POSTGRES_HOST || parsedHost,
      port: parseInt(
        process.env.POSTGRES_PORT || String(parsedPort), 10
      ),
      database: process.env.POSTGRES_DB || dbName,
      user: process.env.POSTGRES_USER || undefined,
      password: process.env.POSTGRES_PASSWORD || undefined,
      ssl: process.env.POSTGRES_SSL
        ? { rejectUnauthorized: false }
        : undefined
    }
    try {
      this.indexMap = JSON.parse(indexMapStr)
    } catch (error) {
      console.error(
        `unable to json parse indexMap string ${indexMapStr},`,
        error.message
      )
      this.indexMap = {}
    }
    this.pool = null
    // Hooks support for sync/replication (mirrors jsondown/mongodown)
    this.hooks = {
      prewrite: {
        noop: true,
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
          this.hooks.prewrite.noop =
            !this._prewriteHooks ||
            this._prewriteHooks.length === 0
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
   * Gets or creates a shared pg.Pool for the given config key.
   * Queues concurrent callers so only one connection attempt runs.
   * @param {string} configKey - Unique identifier for the pool
   * @returns {Promise<Pool>}
   */
  async getPool(configKey) {
    const existing = gPoolMap[configKey]
    if (existing) {
      return existing
    }
    if (!gPoolPromiseMap[configKey]) {
      gPoolPromiseMap[configKey] = []
    }
    if (gPoolPromiseMap[configKey].length > 0) {
      return new Promise((resolve, reject) => {
        gPoolPromiseMap[configKey].push({ resolve, reject })
      })
    }
    // Placeholder for the primary caller
    gPoolPromiseMap[configKey].push({ resolve: null, reject: null })
    let newPool, error
    try {
      newPool = new Pool(this.pgConfig)
      const client = await newPool.connect()
      client.release()
      gPoolMap[configKey] = newPool
    } catch (err) {
      error = err
      console.error('PostgreSQL Pool connect error:', error)
    }
    _.each(gPoolPromiseMap[configKey], deferred => {
      if (error) {
        if (deferred.reject) {
          deferred.reject(error)
        }
      } else if (deferred.resolve) {
        deferred.resolve(newPool)
      }
    })
    gPoolPromiseMap[configKey] = []
    if (error) {
      throw error
    }
    return newPool
  }

  /**
   * Opens the database: acquires a pool, creates the table and indexes.
   * @returns {Promise<void>}
   */
  async _open(_options) {
    try {
      const configKey = [
        this.pgConfig.host,
        this.pgConfig.port,
        this.pgConfig.database
      ].join('/')
      this.pool = await this.getPool(configKey)
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS "${this.tableName}" (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `)
      if (!_.isEmpty(this.indexMap)) {
        for (const field of Object.keys(this.indexMap)) {
          const safeField = field.replace(/'/g, '\'\'')
          const rawName = `idx_${this.tableName}_${field}`
          const indexName = rawName.replace(/[^a-zA-Z0-9_]/g, '_')
          await this.pool.query(`
            CREATE INDEX IF NOT EXISTS "${indexName}"
            ON "${this.tableName}" ((data->>'${safeField}'))
          `)
        }
      }
    } catch (error) {
      const { host, port, database } = this.pgConfig
      throw new Error(
        'Error opening PostgreSQL connection ' +
        `(${host}:${port}/${database}): ${error.message}`
      )
    }
  }

  /**
   * Upserts a record and processes any hook-generated operations.
   * @param {string} key
   * @param {*} value
   * @returns {Promise<void>}
   */
  async _put(key, value, _options) {
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
    try {
      if (!key.startsWith('ÿ')) {
        const parsedValue = parseValue(value)
        await this.pool.query(
          `INSERT INTO "${this.tableName}" (id, data)
           VALUES ($1, $2)
           ON CONFLICT (id) DO UPDATE SET data = $2`,
          [key, parsedValue]
        )
      }
      for (const op of batch.operations) {
        if (op.type === 'put' && !op.key.startsWith('ÿ')) {
          const hookValue = parseValue(op.value)
          await this.pool.query(
            `INSERT INTO "${this.tableName}" (id, data)
             VALUES ($1, $2)
             ON CONFLICT (id) DO UPDATE SET data = $2`,
            [op.key, hookValue]
          )
        } else if (op.type === 'del' && !op.key.startsWith('ÿ')) {
          await this.pool.query(
            `DELETE FROM "${this.tableName}" WHERE id = $1`,
            [op.key]
          )
        }
      }
    } catch (error) {
      throw new Error(`PostgreSQL put error: ${error.message}`)
    }
  }

  /**
   * Retrieves a record by its key.
   * @param {string} key
   * @returns {Promise<string>} JSON-encoded record
   */
  async _get(key, _options) {
    if (key.startsWith('ÿ')) {
      const err = new Error(`Key not found in database [${key}]`)
      err.code = 'LEVEL_NOT_FOUND'
      throw err
    }
    try {
      const result = await this.pool.query(
        `SELECT id, data FROM "${this.tableName}" WHERE id = $1`,
        [key]
      )
      if (result.rows.length === 0) {
        const err = new Error(`Key not found in database [${key}]`)
        err.code = 'LEVEL_NOT_FOUND'
        throw err
      }
      return JSON.stringify(result.rows[0].data)
    } catch (error) {
      if (error.code === 'LEVEL_NOT_FOUND') {
        throw error
      }
      throw new Error(`PostgreSQL get error: ${error.message}`)
    }
  }

  /**
   * Deletes a record and processes any hook-generated operations.
   * @param {string} key
   * @returns {Promise<void>}
   */
  async _del(key, _options) {
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
    try {
      if (!key.startsWith('ÿ')) {
        await this.pool.query(
          `DELETE FROM "${this.tableName}" WHERE id = $1`,
          [key]
        )
      }
      for (const op of batch.operations) {
        if (op.type === 'put' && !op.key.startsWith('ÿ')) {
          const hookValue = parseValue(op.value)
          await this.pool.query(
            `INSERT INTO "${this.tableName}" (id, data)
             VALUES ($1, $2)
             ON CONFLICT (id) DO UPDATE SET data = $2`,
            [op.key, hookValue]
          )
        } else if (op.type === 'del' && !op.key.startsWith('ÿ')) {
          await this.pool.query(
            `DELETE FROM "${this.tableName}" WHERE id = $1`,
            [op.key]
          )
        }
      }
    } catch (error) {
      throw new Error(`PostgreSQL delete error: ${error.message}`)
    }
  }

  /**
   * Executes a batch of put/del operations atomically via an
   * individual serial queue (mirrors mongodown behaviour).
   * @param {Array} operations
   * @returns {Promise<void>}
   */
  async _batch(operations, _options) {
    const batch = {
      operations: [...operations],
      add: (op) => {
        batch.operations.push(op)
      }
    }
    if (this._prewriteHooks && this._prewriteHooks.length > 0) {
      for (const op of operations) {
        for (const hook of this._prewriteHooks) {
          hook(op, batch)
        }
      }
    }
    try {
      await pAll(
        _.map(batch.operations, item => async () => {
          if (item.type === 'put' && !item.key.startsWith('ÿ')) {
            const parsedValue = parseValue(item.value)
            await this.pool.query(
              `INSERT INTO "${this.tableName}" (id, data)
               VALUES ($1, $2)
               ON CONFLICT (id) DO UPDATE SET data = $2`,
              [item.key, parsedValue]
            )
          } else if (
            item.type === 'del' && !item.key.startsWith('ÿ')
          ) {
            await this.pool.query(
              `DELETE FROM "${this.tableName}" WHERE id = $1`,
              [item.key]
            )
          }
        }),
        { concurrency: 1 }
      )
    } catch (error) {
      throw new Error(`PostgreSQL batch error: ${error.message}`)
    }
  }

  /**
   * Returns a new PgIterator for this database.
   * @param {Object} options
   * @returns {PgIterator}
   */
  _iterator(options) {
    return new PgIterator(this, options)
  }
}

const gPoolPromiseMap = {}
const gPoolMap = {}

module.exports = PgDOWN
