/**
 * @fileoverview Resource API wrapper with explicit method definitions for IDE autocomplete
 * @typedef {import('../index.d.ts').CMSRecord} CMSRecord
 * @typedef {import('../index.d.ts').QueryOptions} QueryOptions
 */
const Driver = require('./util/driver').Driver
/**
 * @typedef {Object} CMSRecord
 * @property {string} _id - Record ID
 * @property {number} _createdAt - Creation timestamp
 * @property {number} _updatedAt - Update timestamp
 * @property {number} [_publishedAt] - Published timestamp
 * @property {string} [_updatedBy] - Updated by user
 * @property {Array} [_attachments] - Attachments array
 * @property {boolean} [_local] - Whether record is local
 */
/**
 * @typedef {Object} QueryOptions
 * @property {number} [page] - Page number for pagination
 * @property {number} [limit] - Maximum number of records to return
 * @property {string} [locale] - Locale for localized fields
 * @property {boolean} [reverse] - Reverse order
 */

/**
 * Resource API wrapper that provides explicit method definitions for better IDE support
 * All methods are fully documented and provide comprehensive autocomplete in IDEs
 *
 * This class is returned by cms.api('resourceName') calls and provides the main
 * interface for interacting with CMS resources.
 *
 * @class ResourceAPIWrapper
 * @public
 * @example
 * const cms = new CMS(config)
 * const api = cms.api()
 * const groupsAPI = api('_groups') // Returns ResourceAPIWrapper instance
 *
 * // All methods have full JSDoc support
 * const groups = await groupsAPI.list()
 * const group = await groupsAPI.find('group-id')
 * const newGroup = await groupsAPI.create({ name: 'New Group' })
 */
class ResourceAPIWrapper {
  /**
   * @param {Object} resource - The resource instance
   */
  constructor(resource) {
    this._resource = resource
  }
  /**
   * List all records matching query
   * @param {Object} [query] - MongoDB-style query object
   * @param {QueryOptions} [options] - Query options (page, limit, locale)
   * @returns {Promise<CMSRecord[]>} Array of matching records
   * @example
   * const articles = await api('articles').list()
   * const published = await api('articles').list({ published: true })
   * const paginated = await api('articles').list({}, { page: 0, limit: 10 })
   */
  async list(query, options) {
    return Driver.list(this._resource, query, options)
  }
  /**
   * Find a single record by ID or query
   * @param {string|Object} idOrQuery - Record ID or query object
   * @param {QueryOptions} [options] - Query options
   * @returns {Promise<CMSRecord>} The matching record
   * @example
   * const article = await api('articles').find('article-id')
   * const article = await api('articles').find({ slug: 'my-article' })
   */
  async find(idOrQuery, options) {
    return Driver.find(this._resource, idOrQuery, options)
  }
  /**
   * Check if a record exists
   * @param {string|Object} idOrQuery - Record ID or query object
   * @returns {Promise<boolean>} True if record exists
   * @example
   * const exists = await api('articles').exists('article-id')
   * if (await api('users').exists({ email: 'user@example.com' })) {
   *   console.log('User already exists')
   * }
   */
  async exists(idOrQuery) {
    return Driver.exists(this._resource, idOrQuery)
  }
  /**
   * Create a new record
   * @param {Object} data - The record data
   * @param {Object} [options] - Creation options
   * @returns {Promise<CMSRecord>} The created record with generated _id
   * @example
   * const article = await api('articles').create({ title: 'New Article', content: 'Content...' })
   */
  async create(data, options) {
    return Driver.create(this._resource, data, options)
  }
  /**
   * Update an existing record
   * @param {string} id - The record ID
   * @param {Object} data - The updated data
   * @param {Object} [options] - Update options
   * @returns {Promise<CMSRecord>} The updated record
   * @example
   * await api('articles').update('article-id', { title: 'Updated Title' })
   */
  async update(id, data, options) {
    return Driver.update(this._resource, id, data, options)
  }
  /**
   * Remove a record
   * @param {string} id - The record ID
   * @returns {Promise<boolean>} True if removed successfully
   * @example
   * await api('articles').remove('article-id')
   */
  async remove(id) {
    return Driver.remove(this._resource, id)
  }
  /**
   * Create an attachment for a record
   * @param {string} id - The record ID
   * @param {Object} attachmentData - The attachment data
   * @returns {Promise<Object>} The created attachment
   * @example
   * const attachment = await api('articles').createAttachment('article-id', {
   *   name: 'photo',
   *   stream: fileStream,
   *   fields: { _filename: 'photo.jpg' }
   * })
   */
  async createAttachment(id, attachmentData) {
    return Driver.createAttachment(this._resource, id, attachmentData)
  }
  /**
   * Update an attachment
   * @param {string} id - The record ID
   * @param {string} attachmentId - The attachment ID
   * @param {Object} data - The updated attachment data
   * @returns {Promise<Object>} The updated attachment
   */
  async updateAttachment(id, attachmentId, data) {
    return Driver.updateAttachment(this._resource, id, attachmentId, data)
  }

  /**
   * Find an attachment with its stream
   * @param {string} id - The record ID
   * @param {string} attachmentId - The attachment ID
   * @param {Object} [opts] - Optional options, i.e {resize: '100xauto'}
   * @returns {Promise<Object>} The attachment with stream property
   * @example
   * const attachment = await api('articles').findAttachment('record-id', 'attachment-id')
   */
  async findAttachment(id, attachmentId, opts = false) {
    return Driver.findAttachment(this._resource, id, attachmentId, opts)
  }

  /**
   * Remove an attachment from a record
   * @param {string} id - The record ID
   * @param {string} attachmentId - The attachment ID
   * @returns {Promise<boolean>} True if removed successfully
   * @example
   * await api('articles').removeAttachment('record-id', 'attachment-id')
   */
  async removeAttachment(id, attachmentId) {
    return Driver.removeAttachment(this._resource, id, attachmentId)
  }

  /**
   * Find a file stream by attachment ID
   * @param {string} attachmentId - The attachment ID
   * @returns {Promise<ReadableStream>} The file stream
   * @example
   * const stream = await api('articles').findFile('attachment-id')
   */
  async findFile(attachmentId) {
    return Driver.findFile(this._resource, attachmentId)
  }

  /**
   * Clean orphaned attachments
   * @returns {Promise<boolean>} True if cleanup completed
   * @example
   * await api('articles').cleanAttachment()
   */
  async cleanAttachment() {
    return Driver.cleanAttachment(this._resource)
  }

  /**
   * Get import mapping for bulk operations
   * @param {Array} importList - List of records to import
   * @param {Object} [query] - Optional filter query
   * @param {boolean} [checkRequired] - Whether to validate required fields
   * @returns {Promise<Object>} Map of operations (create, update, remove)
   * @example
   * const importMap = await api('articles').getImportMap([...])
   */
  async getImportMap(importList, query, checkRequired) {
    return this._resource.getImportMap(importList, query, checkRequired)
  }
  /**
   * Get unique key fields for this resource
   * @returns {Array<string>} Array of unique field names
   * @example
   * const uniqueKeys = api('articles').getUniqueKeys()
   */
  getUniqueKeys() {
    return this._resource.getUniqueKeys()
  }
}
module.exports = ResourceAPIWrapper
