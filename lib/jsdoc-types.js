/**
 * @fileoverview JSDoc Type Definitions for Node CMS
 * This file contains type definitions for IDE autocomplete and documentation.
 * Include this file in your JSDoc configuration or import it for type hints.
 */

/**
 * @namespace NodeCMS
 * @description Node CMS type definitions and interfaces
 */

/**
 * @typedef {Object} CMSRecord
 * @property {string} _id - Unique identifier for the record
 * @property {number} _createdAt - Creation timestamp
 * @property {number} _updatedAt - Last update timestamp
 * @property {number|null} _publishedAt - Published timestamp
 * @property {Array<Attachment>} _attachments - Array of attached files
 * @property {boolean} _local - Whether the record is local to this CMS instance
 * @memberof NodeCMS
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
 * @memberof NodeCMS
 */

/**
 * @typedef {Object} CreateAttachmentOptions
 * @property {string} name - The field name for the attachment
 * @property {ReadableStream} stream - The file stream
 * @property {Object} fields - Additional fields (e.g., {_filename: 'photo.jpg'})
 * @property {Object} [payload] - Additional payload data
 * @property {Object} [cropOptions] - Image cropping options
 * @property {number} [order] - Display order
 * @memberof NodeCMS
 */

/**
 * @typedef {Object} QueryOptions
 * @property {number} [page] - Page number (0-based)
 * @property {number} [limit] - Number of records per page
 * @property {string} [locale] - Locale for localized content
 * @memberof NodeCMS
 */

/**
 * @typedef {Object} ImportMap
 * @property {Array<CMSRecord>} create - Records to be created
 * @property {Array<CMSRecord>} update - Records to be updated
 * @property {Array<CMSRecord>} remove - Records to be removed
 * @memberof NodeCMS
 */

/**
 * @typedef {Object} ResourceAPI
 * @description Complete Resource API interface available through api('resourceName')
 * @memberof NodeCMS
 *
 * @example
 * // Get the API instance
 * const cms = require('node-cms');
 * const api = cms.api();
 *
 * // Use any resource
 * const articles = await api('articles').list();
 * const article = await api('articles').find('article-id');
 * const newArticle = await api('articles').create({title: 'New Article'});
 */

/**
 * @typedef {function} APIFunction
 * @description Function returned by cms.api() to access resources
 * @param {string} resourceName - Name of the resource to access
 * @param {...string} resolves - Additional resources to resolve/include
 * @returns {ResourceAPI} The resource API instance with all CRUD methods
 * @memberof NodeCMS
 *
 * @example
 * const api = cms.api();
 * const articlesAPI = api('articles');
 * const usersAPI = api('users', 'profile', 'settings'); // with resolves
 */

module.exports = {
  // This file exports types for JSDoc only
  // No runtime exports needed
}
