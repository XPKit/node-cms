const _ = require('lodash')
const mime = require('mime-types')
const path = require('path')
const digestStream = require('digest-stream')
const pAll = require('p-all')
const autoBind = require('auto-bind')
const toArray = require('stream-to-array')
const MimeStream = require('mime-stream')
const through = require('through')

const JStore = require('./db/json_store')
const FStore = require('./db/file_store')
const Driver = require('./util/driver')
const ImageMin = require('./util/imagemin')
const h = require('./helpers')

const logger = new (require('img-sh-logger'))()
const imageTypes = ['image/jpeg', 'image/gif', 'image/png']
/**
 * @typedef {Object} CMSRecord
 * @property {string} _id - Unique identifier for the record
 * @property {number} _createdAt - Creation timestamp
 * @property {number} _updatedAt - Last update timestamp
 * @property {number|null} _publishedAt - Published timestamp
 * @property {Array<Attachment>} _attachments - Array of attached files
 * @property {boolean} _local - Whether the record is local to this CMS instance
 */

/**
 * @typedef {Object} Attachment
 * @property {string} _id - Unique identifier for the attachment
 * @property {string} _name - Field name the attachment belongs to
 * @property {string} _filename - Original filename
 * @property {string} _contentType - MIME type of the file
 * @property {string} _md5sum - MD5 hash of the file
 * @property {number} _size - File size in bytes
 * @property {number} _createdAt - Creation timestamp
 * @property {number} _updatedAt - Last update timestamp
 * @property {Object} _fields - Additional fields from upload
 * @property {Object} _payload - Additional payload data
 * @property {ReadableStream} stream - File stream (when reading)
 */

/**
 * @typedef {Object} CreateAttachmentOptions
 * @property {string} name - The field name for the attachment
 * @property {ReadableStream} stream - The file stream
 * @property {Object} fields - Additional fields (e.g., {_filename: 'photo.jpg'})
 * @property {Object} [payload] - Additional payload data
 * @property {Object} [cropOptions] - Image cropping options
 * @property {number} [order] - Display order
 */

/**
 * @typedef {Object} QueryOptions
 * @property {number} [page] - Page number (0-based)
 * @property {number} [limit] - Number of records per page
 * @property {string} [locale] - Locale for localized content
 */

/**
 * @typedef {Object} ImportMap
 * @property {Array<CMSRecord>} create - Records to be created
 * @property {Array<CMSRecord>} update - Records to be updated
 * @property {Array<CMSRecord>} remove - Records to be removed
 */

/**
 * @namespace ResourceAPI
 * @description Resource API Interface - This defines all the methods available when calling api('resourceName')
 */

/**
 * @typedef {Object} CMSRecord
 * @property {string} _id - Unique identifier for the record
 * @property {number} _createdAt - Creation timestamp
 * @property {number} _updatedAt - Last update timestamp
 * @property {number|null} _publishedAt - Published timestamp
 * @property {Array<Attachment>} _attachments - Array of attached files
 * @property {boolean} _local - Whether the record is local to this CMS instance
 */

/**
 * @typedef {Object} Attachment
 * @property {string} _id - Unique identifier for the attachment
 * @property {string} _name - Field name the attachment belongs to
 * @property {string} _filename - Original filename
 * @property {string} _contentType - MIME type of the file
 * @property {string} _md5sum - MD5 hash of the file
 * @property {number} _size - File size in bytes
 * @property {number} _createdAt - Creation timestamp
 * @property {number} _updatedAt - Last update timestamp
 * @property {Object} _fields - Additional fields from upload
 * @property {Object} _payload - Additional payload data
 * @property {ReadableStream} stream - File stream (when reading)
 */

/**
 * @typedef {Object} CreateAttachmentOptions
 * @property {string} name - The field name for the attachment
 * @property {ReadableStream} stream - The file stream
 * @property {Object} fields - Additional fields (e.g., {_filename: 'photo.jpg'})
 * @property {Object} [payload] - Additional payload data
 * @property {Object} [cropOptions] - Image cropping options
 * @property {number} [order] - Display order
 */

/**
 * @typedef {Object} QueryOptions
 * @property {number} [page] - Page number (0-based)
 * @property {number} [limit] - Number of records per page
 * @property {string} [locale] - Locale for localized content
 */

/**
 * @typedef {Object} ImportMap
 * @property {Array<CMSRecord>} create - Records to be created
 * @property {Array<CMSRecord>} update - Records to be updated
 * @property {Array<CMSRecord>} remove - Records to be removed
 */

/**
 * @namespace ResourceAPI
 * @description Resource API Interface - This defines all the methods available when calling api('resourceName')
 */

/**
 * List all records matching the query
 * @function ResourceAPI.list
 * @param {Object} [query] - MongoDB-style query object
 * @param {QueryOptions} [options] - Query options
 * @returns {Promise<Array<CMSRecord>>} Array of matching records
 *
 * @example
 * // Get all records
 * const articles = await api('articles').list()
 *
 * // Get published articles
 * const published = await api('articles').list({ published: true })
 *
 * // Get with pagination
 * const page1 = await api('articles').list({}, { page: 0, limit: 10 })
 */

/**
 * Find a single record by ID or query
 * @function ResourceAPI.find
 * @param {string|Object} query - Record ID or query object
 * @param {QueryOptions} [options] - Query options
 * @returns {Promise<CMSRecord>} The matching record
 * @throws {Error} If record not found
 *
 * @example
 * // Find by ID
 * const article = await api('articles').find('article-id')
 *
 * // Find by query (returns first match)
 * const article = await api('articles').find({ slug: 'my-article' })
 */

/**
 * Check if a record exists
 * @function ResourceAPI.exists
 * @param {string|Object} query - Record ID or query object
 * @returns {Promise<boolean>} True if record exists, false otherwise
 *
 * @example
 * const exists = await api('articles').exists('article-id')
 * const slugExists = await api('articles').exists({ slug: 'my-article' })
 */

/**
 * Create a new record
 * @function ResourceAPI.create
 * @param {Object} data - The record data
 * @param {QueryOptions} [options] - Creation options
 * @returns {Promise<CMSRecord>} The created record with generated _id
 *
 * @example
 * const article = await api('articles').create({
 *   title: 'My Article',
 *   content: 'Article content...',
 *   published: true
 * })
 */

/**
 * Update an existing record
 * @function ResourceAPI.update
 * @param {string} id - The record ID
 * @param {Object} data - The updated data
 * @param {QueryOptions} [options] - Update options
 * @returns {Promise<CMSRecord>} The updated record
 *
 * @example
 * const updated = await api('articles').update('article-id', {
 *   title: 'Updated Title',
 *   published: false
 * })
 */

/**
 * Remove a record
 * @function ResourceAPI.remove
 * @param {string} id - The record ID
 * @returns {Promise<boolean>} True if removed successfully
 *
 * @example
 * await api('articles').remove('article-id')
 */

/**
 * Create an attachment for a record
 * @function ResourceAPI.createAttachment
 * @param {string} id - The record ID
 * @param {CreateAttachmentOptions} attachmentData - The attachment data
 * @returns {Promise<Attachment>} The created attachment
 *
 * @example
 * const fs = require('fs')
 * const attachment = await api('articles').createAttachment('article-id', {
 *   name: 'photo',
 *   stream: fs.createReadStream('photo.jpg'),
 *   fields: { _filename: 'photo.jpg' }
 * })
 */

/**
 * Update an attachment
 * @function ResourceAPI.updateAttachment
 * @param {string} id - The record ID
 * @param {string} attachmentId - The attachment ID
 * @param {Object} data - The updated attachment data
 * @returns {Promise<Attachment>} The updated attachment
 *
 * @example
 * const updated = await api('articles').updateAttachment('record-id', 'attachment-id', {
 *   order: 1,
 *   _payload: { caption: 'Photo caption' }
 * })
 */

/**
 * Find an attachment with its stream
 * @function ResourceAPI.findAttachment
 * @param {string} id - The record ID
 * @param {string} attachmentId - The attachment ID
 * @param {Object} [opts] - Optional options, i.e {resize: '100xauto'}
 * @returns {Promise<Attachment>} The attachment with stream property
 *
 * @example
 * const attachment = await api('articles').findAttachment('record-id', 'attachment-id')
 * attachment.stream.pipe(response) // Stream the file
 */

/**
 * Find a file stream by attachment ID (without record context)
 * @function ResourceAPI.findFile
 * @param {string} attachmentId - The attachment ID
 * @returns {Promise<ReadableStream>} The file stream
 *
 * @example
 * const stream = await api('articles').findFile('attachment-id')
 * stream.pipe(fs.createWriteStream('downloaded-file.jpg'))
 */

/**
 * Remove an attachment from a record
 * @function ResourceAPI.removeAttachment
 * @param {string} id - The record ID
 * @param {string} attachmentId - The attachment ID
 * @returns {Promise<boolean>} True if removed successfully
 *
 * @example
 * await api('articles').removeAttachment('record-id', 'attachment-id')
 */

/**
 * Clean orphaned attachments (files not referenced by any record)
 * @function ResourceAPI.cleanAttachment
 * @returns {Promise<boolean>} True if cleanup completed
 *
 * @example
 * await api('articles').cleanAttachment()
 */

/**
 * Get import mapping for bulk operations
 * @function ResourceAPI.getImportMap
 * @param {Array<Object>} importList - List of records to import
 * @param {Object} [query] - Optional filter query
 * @param {boolean} [checkRequired] - Whether to validate required fields
 * @returns {Promise<ImportMap>} Map of operations (create, update, remove)
 *
 * @example
 * const importMap = await api('articles').getImportMap([
 *   { title: 'Article 1', slug: 'article-1' },
 *   { title: 'Article 2', slug: 'article-2' }
 * ])
 * console.log(`Will create: ${importMap.create.length} records`)
 */

/**
 * Get unique key fields for this resource
 * @function ResourceAPI.getUniqueKeys
 * @returns {Array<string>} Array of unique field names
 *
 * @example
 * const uniqueKeys = api('articles').getUniqueKeys()
 * // Returns: ['slug'] or ['email'] etc.
 */

const defaults = {
  type: 'normal'
}

class RequiredFieldError extends Error {
}

/*
 * Constructor
 *
 * @param {String} name, resource name
 * @param {Object} options, resource/cms options
 *   @param {Object} cms, reference
 *     @param [Array] ns, optional, cms namespace
 *     @param {Function} uuid, UUID generator
 *   @param {Array} locales, optional
 */
class Resource {
  /**
   * Creates a new Resource instance
   * @param {string} name - The name of the resource
   * @param {Object} options - Resource configuration options
   * @param {Object} resolveMap - Map of resolved dependencies
   * @param {Object} cms - CMS instance reference
   */
  constructor (name, options, resolveMap, cms) {
    autoBind(this)
    this.cms = cms
    this.api = this.cms.api()
    this.options = _.extend({}, defaults, options)
    this.name = name
    this.resolveMap = resolveMap
    const jpath = path.join(this.options.cms.data, path.join(...this.options.cms.ns), name, 'json')
    const apath = path.join(this.options.cms.data, path.join(...this.options.cms.ns), name, 'blob')
    const key = JSON.stringify({ name })
    this.options.cms.gJStoreMap = this.options.cms.gJStoreMap || {}
    this.options.cms.gFStoreMap = this.options.cms.gFStoreMap || {}
    this.json = this.options.cms.gJStoreMap[key] || (this.options.cms.gJStoreMap[key] = new JStore(jpath, this.options.cms.mid, this.options, name))
    this.file = this.options.cms.gFStoreMap[key] || (this.options.cms.gFStoreMap[key] = new FStore(apath, this.options.cms.mid, this.options))
    this.json.attachments = this.file
    this.options.resource = this
    this.initDriver()
    this.defaultResize = 'autox100'
  }

  /**
   * Recursively cleans an object by removing empty values, null, and undefined properties
   * @param {Object} object - The object to clean
   * @returns {Object} The cleaned object
   */
  clean (object) {
    Object
      .entries(object)
      .forEach(([k, v]) => {
        if (v && _.isObject(v)) {
          this.clean(v)
        }
        if (v && _.isObject(v) && !Object.keys(v).length || v === null || v === undefined) {
          if (_.isArray(object)) {
            object.splice(k, 1)
          } else {
            if (_.isArray(v) && v.length === 0) {
              logger.log(`Will not clean ${k}`)
            } else {
              delete object[k]
            }
          }
        }
      })
    return object
  }

  /**
   * Checks if two items are equal, handling deep comparison for objects and arrays
   * @param {*} updateItem - The item to compare (from update)
   * @param {*} cmsItem - The item to compare against (from CMS)
   * @returns {boolean} True if items are equal, false otherwise
   */
  isEqual (updateItem, cmsItem) {
    if (_.isPlainObject(updateItem) || _.isArray(updateItem)) {
      if (_.isArray(updateItem) && _.size(updateItem) !== _.size(cmsItem)) {
        return false
      }
      return _.every(_.keys(updateItem), key => cmsItem && this.isEqual(updateItem[key], cmsItem[key]))
    }
    return _.isEqual(updateItem, cmsItem)
  }

  /**
   * Converts a stream to a buffer
   * @param {Stream} attachmentStream - The stream to convert
   * @returns {Promise<Buffer>} A buffer containing the stream data
   */
  async getBufferFromStream (attachmentStream) {
    const parts = await toArray(attachmentStream)
    const buffers = parts.map(part => Buffer.isBuffer(part) ? part : Buffer.from(part))
    return Buffer.concat(buffers)
  }

  /**
   * Finds a record with a unique key and returns its ID
   * @param {Array} errors - Array to collect errors
   * @param {Array} records - Array of records to search
   * @param {string} uniqueKey - The unique key field name
   * @param {*} value - The value to search for
   * @returns {string|undefined} The record ID if found, undefined otherwise
   */
  findRecordWithUniqueKey(errors, records, uniqueKey, value) {
    const v = _.find(records, {[uniqueKey]: value})
    if (!v && errors != null) {
      errors.push('record (' + value + ') not found in resource ' + name)
    }
    return v != null ? v._id : void 0
  }

  /**
   * Converts a unique key value to an ID, handling both select and multiselect types
   * @param {*} value - The value to convert
   * @param {string} type - The field type ('select' or 'multiselect')
   * @param {Array} records - Array of records to search
   * @param {string} name - The resource name
   * @param {Array} uniqueKeys - Array of unique key field names
   * @param {Array} errors - Array to collect errors
   * @returns {*} The converted value (ID or array of IDs)
   */
  convertKeyToId (value, type, records, name, uniqueKeys, errors) {
    const uniqueKey = _.first(uniqueKeys)
    if (type === 'select') {
      return this.findRecordWithUniqueKey(errors, records, uniqueKey, value)
    } else if (type === 'multiselect') {
      return _.compact(_.map(value, (key)=> this.findRecordWithUniqueKey(errors, records, uniqueKey, key)))
    }
    return value
  }

  /**
   * Gets the unique key fields for this resource
   * @returns {Array<string>} Array of unique key field names
   * @throws {Error} If no unique key fields are found
   */
  getUniqueKeys () {
    const uniqueKeyField = _.filter(this.options.schema, item => item.unique || item.xlsxKey)
    if (_.isEmpty(uniqueKeyField)) {
      throw new Error(`${this.name} didn't have unique key field`)
    }
    return _.map(uniqueKeyField, 'field')
  }

  /**
   * Sets a JSON key by parsing the string value as JSON
   * @param {Object} item - The item to modify
   * @param {string} key - The key to set
   */
  setJSONKey (item, key) {
    const v = _.get(item, key)
    _.set(item, key, v ? JSON.parse(v) : v)
  }

  /**
   * Generates an import map by comparing import data with existing CMS data
   * @param {Array} importList - List of items to import
   * @param {Object} query - Optional query filter
   * @param {boolean} isCheckRequired - Whether to check required fields
   * @returns {Promise<Object>} Object containing create, update, and remove arrays
   * @throws {RequiredFieldError} If required fields are missing
   */
  async getImportMap (importList, query, isCheckRequired) {
    let errors = []
    let cmsList = await this.list()
    const uniqueKeys = this.getUniqueKeys()
    const schema = this.options.schema
    await pAll(_.map(schema, field => {
      return async () => {
        if (field.input === 'object') {
          _.each(importList, item => {
            if (field.locales) {
              _.each(field.locales, locale => {
                this.setJSONKey(item, `${field.field}.${locale}`)
              })
            } else {
              this.setJSONKey(item, field.field)
            }
          })
        }
        if (!_.isString(field.source)) {
          return
        }
        try {
          const relationUniqueKeys = this.api(field.source).getUniqueKeys()
          const dependencyRecords = await this.api(field.source).list()
          _.each(importList, item => {
            const keyObj = _.pick(item, uniqueKeys)
            if (field.locales) {
              _.each(field.locales, locale => {
                let v = _.get(item, `${field.field}.${locale}`)
                let oldKey = v
                if (_.isEmpty(v)) {
                  return _.set(item, `${field.field}.${locale}`, null)
                }
                v = this.convertKeyToId(v, field.input, dependencyRecords, field.source, relationUniqueKeys, errors)
                if (isCheckRequired && field.required && (_.isUndefined(v) || (!_.isArray(v) && _.isEmpty(v)))) {
                  throw new RequiredFieldError(`record (${JSON.stringify(keyObj)}), required field (${field.field}) and value (${oldKey}) is invalid`)
                }
                _.set(item, `${field.field}.${locale}`, v)
              })
            } else {
              let v = _.get(item, field.field)
              let oldKey = v
              if (_.isEmpty(v)) {
                return _.set(item, field.field, null)
              }
              v = this.convertKeyToId(v, field.input, dependencyRecords, field.source, relationUniqueKeys, errors)
              if (isCheckRequired && field.required && (_.isUndefined(v) || (!_.isArray(v) && _.isEmpty(v)))) {
                throw new RequiredFieldError(`record (${JSON.stringify(keyObj)}), required field (${field.field}) and value (${oldKey}) is invalid`)
              }
              _.set(item, field.field, v)
            }
          })
          // update query
          let v = _.get(query, field.field)
          if (query && v) {
            v = this.convertKeyToId(v, field.input, dependencyRecords, field.source, relationUniqueKeys, errors)
            _.set(query, field.field, v)
          }
        } catch (error) {
          if (error instanceof RequiredFieldError) {
            throw error
          }
          logger.warn(error.message)
        }
      }
    }))
    if (!_.isEmpty(errors)) {
      logger.error(errors)
    }
    const removeItem = _.filter(cmsList, item => !_.find(importList, _.pick(item, uniqueKeys)))
    const createItem = _.filter(importList, item => !_.find(cmsList, _.pick(item, uniqueKeys)))
    let updateItem = _.difference(importList, createItem)
    if (query) {
      const filteredCmsList = _.filter(cmsList, query)
      updateItem = _.filter(updateItem, item => _.find(filteredCmsList, _.pick(item, uniqueKeys)))
    }
    updateItem = _.filter(updateItem, updateItem => {
      const cmsItem = _.find(cmsList, _.pick(updateItem, uniqueKeys))
      updateItem._id = cmsItem._id
      return !this.isEqual(updateItem, cmsItem)
    })
    return {create: createItem, update: updateItem, remove: removeItem}
  }

  /**
   * Gets the schema for a paragraph type
   * @param {string} type - The paragraph type
   * @returns {Array} The schema array for the paragraph type
   */
  getParagraphSchema(type) {
    return _.get(this.cms._paragraphs, `${type}.schema`, [])
  }

  /**
   * Broadcasts an action to all connected clients via WebSocket
   * @param {string} action - The action type (create, update, remove, etc.)
   * @param {Object} context - The context object containing resource and result data
   */
  broadcast(action, context) {
    const resource = _.get(context, 'options.name', false)
    if (_.startsWith(resource, '_')) {
      return
    }
    this.cms.broadcast({
      action,
      data: {
        resource,
        _id: _.get(context, '_result._id', false),
        _updatedBy: _.get(context, '_result._updatedBy', false)
      }
    })
  }

  /**
   * Initializes the driver with all CRUD operations and middleware
   * Sets up read, list, find, exists, create, update, remove operations
   * and attachment-related operations (create, update, find, remove)
   */
  initDriver () {
    // Store reference for middleware and hooks - no longer building dynamic methods
    this._driver = new Driver(this.name, this.options)
    this._driver.use((context) => {
      context.resource = context.options.resource
      return context.next()
    })

    // Setup hooks for each method but don't define them dynamically
    this.setupDriverHooks()

    // Build the driver for backward compatibility with plugins
    const builtMethods = this._driver.build()

    // Extend this resource with built methods for backward compatibility
    return _.extend(this, builtMethods)
  }

  /**
   * Sets up all the driver hooks and middleware for resource operations
   * @private
   */
  setupDriverHooks() {
    const driver = this._driver

    // read hooks
    driver.before('read', h.openReadStream)
    driver.before('read', h.filterQuery)
    driver.define('read', ['query?', 'options?'], Driver.Driver._readImpl)

    // list hooks
    driver.before('list', h.getDependencyItems.bind(this))
    driver.define('list', ['query?', 'options?'], Driver.Driver._listImpl)

    // find hooks
    driver.before('find', h.getDependencyItems.bind(this))
    driver.define('find', ['query', 'options?'], Driver.Driver._findImpl)

    // exists
    driver.define('exists', ['query'], Driver.Driver._existsImpl)

    // create hooks
    driver.before('create', h.normalizeSchema)
    driver.before('create', (context) => {
      const now = Date.now()
      _.extend(context.params.object, {
        _id: context.options.cms.uuid(),
        _createdAt: now,
        _updatedAt: now,
        _publishedAt: null
      })
      return context.next()
    })
    driver.before('create', h.getDependencyItems.bind(this))
    driver.before('create', h.checkResourceLimits)
    driver.before('create', h.checkUniqueFields)
    driver.define('create', ['object', 'options?'], Driver.Driver._createImpl)
    driver.after('create', h.leaveOneActive)
    driver.after('create', async (context) => {
      this.broadcast('create', context)
      context.next()
    })

    // update hooks
    driver.before('update', h.lockResource)
    driver.before('update', h.findRecord)
    driver.before('update', h.checkUniqueFields)
    driver.define('update', ['id', 'object', 'options?'], Driver.Driver._updateImpl)
    driver.after('update', h.leaveOneActive)
    driver.after('update', async (context) => {
      this.broadcast('update', context)
      context.next()
    })

    // remove hooks
    driver.before('remove', h.enableFirstAsActive)
    driver.before('remove', h.findRecord)
    driver.before('remove', async context => {
      try {
        await pAll(_.map(context.record._attachments, attachment => {
          return async () => {
            try {
              // Clean all cached versions of this attachment
              await Driver.Driver.cleanAttachmentCache(context.resource, attachment._id)
              return await context.resource.file.remove(attachment._id)
            } catch (error) {
              throw h.removeAttachmentError(context.resource.name, context.record._id, attachment._id, error)
            }
          }
        }), {concurrency: 10})
        context.next()
      } catch (error) {
        context.error(error)
      }
    })
    driver.define('remove', ['id'], Driver.Driver._removeImpl)
    driver.after('remove', async (context) => {
      this.broadcast('remove', context)
      context.next()
    })
    // attachment hooks
    this.setupAttachmentHooks(driver)
  }

  /**
   * Sets up attachment-related hooks
   * @private
   * @param {Driver} driver - The driver instance
   */
  setupAttachmentHooks(driver) {
    // createAttachment hooks
    driver.before('createAttachment', h.findRecord)
    driver.before('createAttachment', async (context) => {
      if (_.get(context, 'params.object.name.length', 0) === 0) {
        return context.error(h.removeAttachmentError(context.resource.name, context.record, null, new Error('missing field name')))
      }
      const obj = context.params.object
      obj.filename = path.basename(obj.stream.path)
      let contentType = mime.lookup(_.get(obj, 'fields._filename', obj.filename))
      if (_.includes(imageTypes, contentType)) {
        const mimeStream = new MimeStream()
        mimeStream.on('type', async (type) => {
          contentType = mime.lookup(_.get(type, 'ext', obj.filename))
          context.params.object.contentType = _.get(type, 'mime', false) || contentType || 'application/octet-stream'
          const field = _.find(context.resource.options.schema, { field: obj.name })
          if (field && field.options && field.options.width && field.options.height) {
            const {stream} = await ImageMin.resizeAttachment(mimeStream, `${field.options.width}x${field.options.height}`, context.params.object.contentType)
            context.params.object.stream = stream
          } else {
            context.params.object.stream = mimeStream
          }
          context.next()
        })
        obj.stream.pipe(mimeStream)
      } else {
        context.params.object.contentType = contentType
        context.next()
      }
    })
    driver.before('createAttachment', (context) => {
      const obj = context.params.object
      const attachmentId = (context.attachmentId = context.resource.options.cms.uuid())
      obj.stream.on('error', async err => {
        try {
          await context.resource.file.remove(attachmentId)
          return context.error(h.createAttachmentError(context.resource.name, context.params.id, err))
        } catch (error) {
          return context.error(h.removeAttachmentError(context.resource.name, context.record, attachmentId, error))
        }
      })
      const dstream = digestStream('md5', 'hex', md5sum => context.md5sum = md5sum)
      const writeStream = context.resource.file.write(attachmentId)
      writeStream.on('finish', async () => {
        const contentType = _.get(context.params.object, 'contentType', 'application/octet-stream')
        if (_.includes(imageTypes, contentType)) {
          logger.info('Will cache resized img', `${attachmentId}-${this.defaultResize}`, contentType)
          try {
            const savedFileStream = context.resource.file.read(attachmentId)
            const resizedStream = context.resource.file.write(`${attachmentId}-${this.defaultResize}`)
            const {stream} = await ImageMin.resizeAttachment(savedFileStream, this.defaultResize, contentType)
            stream.pipe(resizedStream)
          } catch {
            context.resource.file.remove(`${attachmentId}-${this.defaultResize}`)
          }
        }
        context.next()
      })
      context.size = 0
      return obj.stream
        .on('data', chunk => context.size += chunk.length)
        .pipe(dstream).pipe(writeStream)
    })
    driver.before('createAttachment', h.lockResource)
    driver.before('createAttachment', h.findRecord)
    driver.before('createAttachment', async (context) => {
      try {
        const obj = context.params.object
        const field = _.find(context.resource.options.schema, { field: obj.name })
        const maxCount = _.get(field, 'options.maxCount', -1)
        if (_.get(field, 'input') === 'image' && maxCount !== -1) {
          const oldAttachments = _.filter(context.record._attachments, {_name: obj.name})
          if (maxCount === 1) {
            context.record._attachments = _.difference(context.record._attachments, oldAttachments)
            await context.resource.json.update(context.record._id, context.record)
            await pAll(_.map(oldAttachments, attach => {
              return async () => await context.resource.file.remove(attach._id)
            }), {concurrency: 1})
          } else if (_.get(oldAttachments, 'length', 0) + 1 > maxCount) {
            throw new Error('Adding one more attachment would exceed the limit, will cancel')
          }
        }
        context.next()
      } catch (error) {
        context.error(error)
      }
    })
    driver.define('createAttachment', ['id', 'object'], Driver.Driver._createAttachmentImpl)
    driver.after('createAttachment', async (context) => {
      this.broadcast('createAttachment', context)
      context.next()
    })

    // updateAttachment hooks
    driver.before('updateAttachment', h.findRecord)
    driver.before('updateAttachment', h.findRecordAttachment)
    driver.before('updateAttachment', async context => {
      try {
        // Clean cached versions when attachment is updated
        await Driver.Driver.cleanAttachmentCache(context.resource, context.params.aid)
        context.next()
      } catch (error) {
        console.error(`Failed to clean attachment cache for ${context.params.aid}:`, error)
        // Don't fail the update if cache cleanup fails
        context.next()
      }
    })
    driver.before('updateAttachment', h.lockResource)
    driver.define('updateAttachment', ['id','aid','object'], Driver.Driver._updateAttachmentImpl)
    driver.after('updateAttachment', async (context) => {
      this.broadcast('updateAttachment', context)
      context.next()
    })

    // findFile
    driver.define('findFile', ['aid'], Driver.Driver._findFileImpl)

    // findAttachment hooks
    driver.before('findAttachment', h.findRecord)
    driver.before('findAttachment', h.findRecordAttachment)
    driver.define('findAttachment', ['id', 'aid', 'opts?'], Driver.Driver._findAttachmentImpl)

    // removeAttachment hooks
    driver.before('removeAttachment', h.findRecord)
    driver.before('removeAttachment', h.findRecordAttachment)
    driver.before('removeAttachment', async context => {
      try {
        // Clean all cached versions of this attachment
        await Driver.Driver.cleanAttachmentCache(context.resource, context.params.aid)
        await context.resource.file.remove(context.params.aid)
        return context.next()
      } catch (error) {
        if (error.notFound) {
          return context.error(h.findAttachmentError(context.resource.name, context.params.id, context.params.aid, error))
        }
        return context.error(h.removeAttachmentError(context.resource.name, context.params.id, context.params.aid, error))
      }
    })
    driver.before('removeAttachment', h.lockResource)
    driver.before('removeAttachment', h.findRecord)
    driver.define('removeAttachment', ['id', 'aid'], Driver.Driver._removeAttachmentImpl)
    driver.after('removeAttachment', async (context) => {
      this.broadcast('removeAttachment', context)
      context.next()
    })

    // cleanAttachment
    driver.define('cleanAttachment', [], Driver.Driver._cleanAttachmentImpl)
  }

  /**
   * Read records as a stream with filtering and transformations
   * @param {Object} [query] - Query parameters
   * @param {Object} [options] - Options
   * @returns {Promise<ReadableStream>} Stream of records
   */
  async read(query, options) {
    const _options = this.options
    return new Promise((resolve) => {
      // Use the helper functions to open and filter the stream
      let stream = this.json.read(query, options)
      // Apply filtering and local marking
      stream = stream.pipe(through(function (data) {
        data._local = _.get(data, '_id', '').indexOf(_options.cms.mid) === 8
        return this.queue(data)
      }))
      resolve(stream)
    })
  }

  /**
   * List all records matching the query
   * @param {Object} [query] - MongoDB-style query object
   * @param {QueryOptions} [options] - Query options
   * @returns {Promise<Array<CMSRecord>>} Array of matching records
   */
  async list(query, options) {
    // Get dependency items first
    const dependencyMap = await h.getDependencyItems.call(this, query, options)
    // Setup options
    const queryOptions = options || {}
    return new Promise((resolve, reject) => {
      this.read(query, queryOptions)
        .then(gotStream => {
          const results = []
          gotStream.pipe(through(
            data => {
              return results.push(h.injectDependency(data, dependencyMap, this.options, this.resolveMap))
            },
            () => {
              resolve(results)
            }
          )).on('error', reject)
        })
        .catch(reject)
    })
  }

  /**
   * Find a single record by ID or query
   * @param {string|Object} query - Record ID or query object
   * @param {QueryOptions} [options] - Query options
   * @returns {Promise<CMSRecord>} The matching record
   */
  async find(query, options) {
    const _options = this.options
    // Get dependency items first
    const dependencyMap = await h.getDependencyItems.call(this, query, options)
    if (_.isString(query)) {
      try {
        const result = await this.json.find(query)
        result._local = _.get(result, '_id', '').indexOf(_options.cms.mid) === 8
        return h.injectDependency(result, dependencyMap, this.options, this.resolveMap)
      } catch (error) {
        if (error.notFound) {
          throw h.recordNotFoundError(this.name, query, error)
        }
        throw h.recordNotFoundError(this.name, query, error)
      }
    }
    // For object queries, use list with limit 1
    try {
      const results = await this.list(query, _.extend(options || {}, {page: 0, limit: 1}))
      if (!results.length) {
        throw h.listNotFoundError(this.name, query)
      }
      return results[0]
    } catch (error) {
      throw h.listRecordError(this.name, query, error)
    }
  }

  /**
   * Check if a record exists
   * @param {string|Object} query - Record ID or query object
   * @returns {Promise<boolean>} True if record exists
   */
  async exists(query) {
    if (_.isString(query)) {
      try {
        await this.json.find(query)
        return true
      } catch (error) {
        if (error.notFound) {
          return false
        }
        throw h.recordNotFoundError(this.name, query, error)
      }
    }
    try {
      const results = await this.list(query, { page: 0, limit: 1 })
      return results.length > 0
    } catch (error) {
      throw h.recordNotFoundError(this.name, query, error)
    }
  }

  /**
   * Create a new record
   * @param {Object} object - Record data to create
   * @param {Object} [options] - Creation options
   * @returns {Promise<CMSRecord>} The created record
   */
  async create(object, options) {
    const _options = this.options
    // Apply normalization
    h.normalizeSchema({ params: { object }, options: this.options, next: () => {} })
    // Add timestamps and ID
    const now = Date.now()
    _.extend(object, {
      _id: this.options.cms.uuid(),
      _createdAt: now,
      _updatedAt: now,
      _publishedAt: null
    })
    // Get dependency items
    const dependencyMap = await h.getDependencyItems.call(this, {}, options)
    // Check resource limits and unique fields
    const context = { params: { object }, resource: this, options: this.options }
    h.checkResourceLimits(context)
    h.checkUniqueFields(context)
    const result = await this.json.create(object._id, object)
    result._local = _.get(result, '_id', '').indexOf(_options.cms.mid) === 8
    // Broadcast and handle after hooks
    this.broadcast('create', { _result: result })
    return h.injectDependency(result, dependencyMap, this.options, this.resolveMap)
  }

  /**
   * Update an existing record
   * @param {string} id - Record ID
   * @param {Object} object - Updated record data
   * @param {Object} [_options] - Update options
   * @returns {Promise<CMSRecord>} The updated record
   */
  async update(id, object, _options) {
    // Find the existing record first
    const record = await this.json.find(id)
    // Check unique fields
    const context = { params: { object }, resource: this, options: this.options }
    h.checkUniqueFields(context)
    // Clean the update object
    delete object._id
    delete object._createdAt
    delete object._attachments
    object._updatedAt = Date.now()
    // Merge with existing record
    h.merge(record, object)
    const result = await this.json.update(id, record)
    // Broadcast update
    this.broadcast('update', { _result: result })
    return result
  }

  /**
   * Remove a record
   * @param {string} id - Record ID
   * @returns {Promise<Object>} The removed record
   */
  async remove(id) {
    // Find the record first
    const record = await this.json.find(id)
    // Remove all attachments first
    if (record._attachments && record._attachments.length > 0) {
      await pAll(_.map(record._attachments, attachment => {
        return async () => {
          try {
            try {
              await this.file.remove(`${attachment._id}-${this.defaultResize}`)
            } catch (error) {
              logger.error(`Couldn't remove default resized attachment ${attachment._id}-${this.defaultResize}`, error)
            }
            return await this.file.remove(attachment._id)
          } catch (error) {
            throw h.removeAttachmentError(this.name, record._id, attachment._id, error)
          }
        }
      }), {concurrency: 10})
    }
    const result = await this.json.remove(id)
    // Broadcast removal
    this.broadcast('remove', { _result: result })
    return result
  }
}

/**
 * @module node-cms/lib/resource
 * @description Node CMS Resource class - implements the ResourceAPI interface
 * @see {@link module:node-cms.ResourceAPI} For the complete API interface
 */

/**
 * Resource class that implements all ResourceAPI methods
 * @class
 * @implements {module:node-cms.ResourceAPI}
 */
exports = module.exports = Resource
