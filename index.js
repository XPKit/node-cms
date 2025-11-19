/**
 * @fileoverview Node CMS - A flexible content management system
 * @author Node CMS Team
 * @see {@link ./lib/jsdoc-types.js} For complete type definitions
 */

/**
 * @typedef {import('./lib/ResourceAPIWrapper.js')} ResourceAPIWrapper
 */

const path = require('path')
const fs = require('fs')
const pAll = require('p-all')
const compression = require('compression')
const cookieParser = require('cookie-parser')
const express = require('express')
const helmet = require('helmet')
const _ = require('lodash')
const mkdirp = require('mkdirp')
const session = require('express-session')
const UUID = require('./lib/util/uuid')
const SyslogManager = require('./lib/SyslogManager')
const SystemManager = require('./lib/SystemManager')
const UpdatesManager = require('./lib/UpdatesManager')
const escapeRegExp = require('./lib/util/escapeRegExp')
const Resource = require('./lib/resource')
const ResourceAPIWrapper = require('./lib/ResourceAPIWrapper')
const logger = new (require('img-sh-logger'))()

/**
 * Recursively loads all .js files in a directory as modules (synchronously).
 * Returns an object mapping filenames (without extension) to the required module.
 * Only loads .js files, skips directories and non-js files.
 * @param {string} dirPath - Absolute or relative path to directory
 * @returns {Object}
 */
const requireDirNative = (dirPath) => {
  const absDir = path.resolve(dirPath)
  const files = fs.readdirSync(absDir)
  const result = {}
  for (const file of files) {
    const fullPath = path.join(absDir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) continue
    if (!file.endsWith('.js')) continue
    const key = file.replace(/\.js$/, '')
    result[key] = require(fullPath)
  }
  return result
}

// Default CMS configration
const defaultConfig = () =>
  ({
    ns: [],
    resources: './resources',
    data: './data',
    autoload: true,
    mode: 'normal',
    mid: Date.now().toString(36),
    disableREST: false,
    disableAdmin: false,
    disableJwtLogin: true,
    disableReplication: false,
    disableAuthentication: false,
    wsRecordUpdates: true,
    importFromRemote: true,
    disableAnonymous: false,
    auth: {
      secret: 'MdjIwFRi9ezT1234567890abcdef'
    },
    session: {
      secret: 'MdjIwFRi9ezT',
      resave: true,
      saveUninitialized: true
    }
  })

class CMS {
  /**
   * Creates a new CMS instance
   * @param {Object} [options] - CMS configuration options
   * @param {string[]} [options.ns] - Namespace array
   * @param {string} [options.resources] - Resources directory path
   * @param {string} [options.data] - Data directory path
   * @param {boolean} [options.autoload] - Auto-load resources
   * @param {string} [options.mode] - CMS mode
   * @param {string} [options.mid] - Machine ID
   * @param {boolean} [options.disableREST] - Disable REST API
   * @param {boolean} [options.disableAdmin] - Disable admin interface
   * @param {boolean} [options.disableJwtLogin] - Disable JWT login
   * @param {boolean} [options.disableReplication] - Disable replication
   * @param {boolean} [options.disableAuthentication] - Disable authentication
   * @param {boolean} [options.wsRecordUpdates] - Enable WebSocket record updates
   * @param {boolean} [options.importFromRemote] - Enable import from remote
   * @param {boolean} [options.disableAnonymous] - Disable anonymous access
   * @param {Object} [options.session] - Session configuration
   * @param {Object} [options.auth] - Authentication configuration
   *
   * @example
   * const CMS = require('node-cms')
   * const cms = new CMS({
   *   resources: './resources',
   *   data: './data',
   *   disableREST: false
   * })
   *
   * // Get API to work with resources
   * const api = cms.api()
   * const groups = await api('_groups').list()
   * const user = await api('_users').find('user-id')
   */
  constructor(options) {
    // NOTE: Min auth key length
    this.requiredKeyLength = 16
    this.fieldFileTypes = ['file', 'img', 'image', 'imageView', 'attachmentView']
    const configPath = path.resolve((options != null ? options.config : undefined) || './cms.json')
    if (options) {
      delete options.config
    }
    // create a default config, if not exist
    if (!fs.existsSync(configPath)) {
      const cfg = _.extend(defaultConfig(), options)
      fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2))
    }
    // aggregate options
    this.options = (options = (this._options = _.extend({}, defaultConfig(), require(configPath), options)))
    // ensure required folders are in place
    mkdirp.sync(path.resolve(options.resources))
    mkdirp.sync(path.resolve(options.data))
    // keep track of available resources
    this._tempResources = {}
    this._resources = {}
    this._paragraphs = {}
    this._attachmentFields = {}
    this._relations = {}
    this._resourceNames = []
    // keep track of available plugins
    this._plugins = {}
    // Use prefixed UUID
    options.uuid = new UUID(options.mid)
    // automaticly populate CMS resources, if specified
    if (this._options.autoload) {
      _.each(requireDirNative(options.resources), (value, key) => this.resource(key, value))
      const paragraphsDir = path.join(_.get(options, 'paragraphs', options.resources), 'paragraphs')
      // logger.info(`Paragraphs dir: ${paragraphsDir}`)
      try {
        const results = requireDirNative(paragraphsDir)
        _.each(results, (value, key)=> {
          _.set(this._paragraphs, key, value)
          this.formatSchema(this._paragraphs, key, true)
        })
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        logger.warn('No folder found for ', paragraphsDir)
      }
      _.set(this._paragraphs, '_settingsLink', {
        displayname: 'Settings link',
        maxCount: 1,
        schema: [
          {
            field: 'name',
            localised: false,
            input: 'string',
            required: true
          },
          {
            field: 'url',
            localised: false,
            input: 'url',
            required: true
          }
        ]
      })
      this.formatSchema(this._paragraphs, '_settingsLink', true)
      _.set(this._paragraphs, '_settingsLinkGroup', {
        displayname: 'Link group',
        maxCount: 1,
        schema: [
          {
            label: 'Group title',
            field: 'title',
            localised: false,
            input: 'string',
            required: true
          },
          {
            field: 'links',
            input: 'paragraph',
            localised: false,
            options: {
              types: ['_settingsLink']
            }
          }
        ]
      })
      this.formatSchema(this._paragraphs, '_settingsLinkGroup', true)
    }
    // create main application
    this._app = express()
    this._app.use(helmet.dnsPrefetchControl())
    this._app.use(helmet.expectCt())
    this._app.use(helmet.frameguard())
    this._app.use(helmet.hidePoweredBy())
    this._app.use(helmet.hsts())
    this._app.use(helmet.ieNoOpen())
    this._app.use(helmet.noSniff())
    this._app.use(helmet.permittedCrossDomainPolicies())
    this._app.use(helmet.referrerPolicy())
    // Enable compression
    this._app.use(compression({
      filter (req, res) {
        return req.headers['x-no-compression'] ? false : compression.filter(req, res)
      }
    }))
    if (!options.disableAuthentication || !options.disableJwtLogin) {
      const secret = _.get(this.options, 'auth.secret')
      if (_.isEmpty(secret)) {
        throw new Error('config.auth.secret is missing')
      } else if (_.get(secret, 'length', 0) <= this.requiredKeyLength) {
        throw new Error(`config.auth.secret isn't long enough, adjust the value to have minimum ${this.requiredKeyLength} characters`)
      }
      this._app.use(session(_.extend({cookie: {}}, this.options.session)))
    }
    if (!options.disableAuthentication) {
      // Enables session with basic auth
      this._app.use((req, res, next) => {
        if (req.session.user && !req.headers.authorization) {
          req.headers.authorization = 'Basic ' + Buffer.from(req.session.user.username + ':' + req.session.user.password).toString('base64')
        }
        next()
      })
    } else if (!options.disableJwtLogin) {
      // Enables session with jwt token auth
      this._app.use(cookieParser())
      this._app.use((req, res, next) => {
        if (!req.headers.authorization) {
          const token = _.get(req, 'session.nodeCmsUser.token', false)
          if (token) {
            req.headers.authorization = token
          } else if (_.get(req, 'query.jwt', false)) {
            req.headers.authorization = req.query.jwt
          }
        }
        next()
      })
    }
    this.use(require('./lib/plugins/authentication'), options, configPath)
    // handle syslog and system
    this.bootstrapFunctions = this.bootstrapFunctions || []
    this.bootstrapFunctions.push(async (callback) => {
      SyslogManager.init(this, options)
      SystemManager.init(this, options)
      UpdatesManager.init(this, options)
      callback()
    })
    // Initialize SmartCrop if enabled
    this.bootstrapFunctions.push(async (callback) => {
      if (_.get(options, 'smartCrop', false)) {
        try {
          const smartCrop = require('./lib/smartcrop')
          await smartCrop.initialize(options)
          logger.info('SmartCrop initialization completed during CMS bootstrap')
        } catch (error) {
          logger.warn('SmartCrop initialization failed during CMS bootstrap:', error.message)
        }
      }
      callback()
    })
    this._app.use(SyslogManager.express())
    this._app.use(SystemManager.express())
    const pluginConditions = [
      { name: 'rest',           enabled: !options.disableREST },
      { name: 'import',         enabled: !!options.import },
      { name: 'importFromRemote', enabled: !!options.importFromRemote },
      { name: 'admin',          enabled: !options.disableAdmin },
      { name: 'replicator',     enabled: !options.disableReplication },
      { name: 'sync',           enabled: !!options.sync },
      { name: 'xlsx',           enabled: !!options.xlsx },
      { name: 'anonymousRead',  enabled: !!options.anonymousRead }
    ]
    this.usedPlugins = _.chain(pluginConditions).filter('enabled').map('name').value()
    logger.info(`Will use plugins: ${this.usedPlugins.join(', ')}`)
    _.each(this.usedPlugins, (plugin) => {
      this.use(require(`./lib/plugins/${plugin}`), options, configPath)
    })
    // handle bootstrap
    this.bootstrap = async (server, callback) => {
      if (_.isFunction(server) && _.isUndefined(callback)) {
        callback = server
        server = undefined
      }
      this.server = server
      // this.io = new Server(this.server)
      await pAll(_.map(this.bootstrapFunctions, bootstrap => {
        return async () => {
          await new Promise((resolve, reject) => {
            bootstrap((err) => {
              if (err) reject(err)
              else resolve()
            })
          })
        }
      }), {concurrency: 1})
      callback && callback()
    }
    this._processAttachmentFields()
    this._processSourceFields()
  }
  _processAttachmentFields = () => {
    _.each(this._resources, (resource, resourceKey) => {
      const schema = _.get(resource, 'options.schema', [])
      _.each(schema, fieldItem => {
        const rootPath = `${fieldItem.field}`
        if (_.includes(['file', 'image'], fieldItem.input)) {
          const field = _.cloneDeep(fieldItem)
          field.path = rootPath
          _.set(this._resources, `["${resourceKey}"].options._attachmentFields["${escapeRegExp(rootPath)}"]`, field)
          _.set(this._attachmentFields, `${resourceKey}["${escapeRegExp(rootPath)}"]`, field)
        } else if (fieldItem.input === 'paragraph') {
          this._processAttachmentFieldsParagraph(fieldItem, resourceKey, rootPath)
        }
      })
    })
  }
  _processAttachmentFieldsParagraph = (fieldItem, resourceKey, rootPath) => {
    const paragraphTypes = _.get(fieldItem, 'options.types', [])
    _.each(paragraphTypes, paragraphType => {
      const schema = _.get(this._paragraphs, `["${paragraphType}"].schema`, [])
      _.each(schema, paragraphFieldItem => {
        const paragraphRootPath = `${rootPath}.{{*}}.${paragraphFieldItem.field}`
        if (_.includes(['file', 'image'], paragraphFieldItem.input)) {
          const field = _.cloneDeep(paragraphFieldItem)
          field.path = paragraphRootPath
          console.warn('tamer - ', field.localised)
          _.set(this._resources, `["${resourceKey}"].options._attachmentFields["${escapeRegExp(paragraphRootPath, field.localised)}"]`, field)
          _.set(this._attachmentFields,  `${resourceKey}["${escapeRegExp(paragraphRootPath)}"]`, field)
        } else if (fieldItem.input === 'paragraph') {
          this._processAttachmentFieldsParagraph(paragraphFieldItem, resourceKey, paragraphRootPath)
        }
      })
    })
  }
  isValidRelation = (field) => {
    return _.includes(['select', 'multiselect'], field.input) && _.includes(this._resourceNames, field.source)
  }
  _processSourceFields = () => {
    _.each(this._resources, (resource, resourceKey) => {
      const schema = _.get(resource, 'options.schema', [])
      _.each(schema, fieldItem => {
        const rootPath = `${fieldItem.field}`
        if (this.isValidRelation(fieldItem)) {
          const field = _.cloneDeep(fieldItem)
          field.path = rootPath
          _.set(this._resources, `["${resourceKey}"].options._relations["${escapeRegExp(rootPath)}"]`, field)
          _.set(this._relations, `${resourceKey}["${escapeRegExp(rootPath)}"]`, field)
        } else if (fieldItem.input === 'paragraph') {
          this._processSourceFieldsParagraph(fieldItem, resourceKey, rootPath)
        }
      })
    })
  }
  _processSourceFieldsParagraph = (fieldItem, resourceKey, rootPath) => {
    const paragraphTypes = _.get(fieldItem, 'options.types', [])
    _.each(paragraphTypes, paragraphType => {
      const schema = _.get(this._paragraphs, `["${paragraphType}"].schema`, [])
      _.each(schema, paragraphFieldItem => {
        const paragraphRootPath = `${rootPath}.{{*}}.${paragraphFieldItem.field}`
        if (this.isValidRelation(paragraphFieldItem)) {
          const field = _.cloneDeep(paragraphFieldItem)
          field.path = paragraphRootPath
          _.set(this._resources, `["${resourceKey}"].options._relations["${escapeRegExp(paragraphRootPath)}"]`, field)
          _.set(this._relations,  `${resourceKey}["${escapeRegExp(paragraphRootPath)}"]`, field)
        } else if (fieldItem.input === 'paragraph') {
          this._processAttachmentFieldsParagraph(paragraphFieldItem, resourceKey, paragraphRootPath)
        }
      })
    })
  }
  getKeyFor = (name, key, forParagraph = false) => {
    return `[${name}]${!forParagraph ? 'options' : ''}.${key}`
  }

  formatSchema = (resourcesList, name, forParagraph = false) => {
    const schemaKey = this.getKeyFor(name, 'schema', forParagraph)
    const schema = _.get(resourcesList, schemaKey, [])
    const attachmentFields = []
    const localesKey = this.getKeyFor(name, 'locales', forParagraph)
    const resourceIsLocalised = _.get(resourcesList, `${localesKey}.length`, 0) !== 0
    _.each(schema, (field)=> {
      field.localised = _.get(field, 'localised', resourceIsLocalised)
      if (_.includes(this.fieldFileTypes, _.get(field, 'input', false))) {
        attachmentFields.push(field.field)
      }
    })
    _.set(resourcesList, schemaKey, schema)
    const attachmentsKey = this.getKeyFor(name, '_attachments', forParagraph)
    _.set(resourcesList, attachmentsKey, attachmentFields)
  }

  broadcast = (msg) => {
    if (_.get(this.options, 'wsRecordUpdates', false)) {
      UpdatesManager.broadcast(msg)
    }
  }

  resource = (name, config, resolves) => {
    resolves = _.intersection(resolves, this._resourceNames)
    if (_.isEmpty(resolves)) {
      resolves = undefined
    }
    const key = JSON.stringify({ name, resolves })
    if (!this._tempResources[key] && (config || resolves || (this._options.mode === 'normal'))) {
      let opts = _.extend(config || Resource.DEFAULTS, { cms: this._options })
      if (!_.isEmpty(resolves)) {
        const referenceKey = JSON.stringify({ name, resolves: undefined })
        opts = this._tempResources[referenceKey].options
      }
      const resolveMap = _.zipObject(resolves, _.map(resolves, item => this.resource(item)))
      this._tempResources[key] = new Resource(name, opts, resolveMap, this)
      if (_.isEmpty(resolves)) {
        this._resources[name] = this._tempResources[key]
        this.formatSchema(this._resources, name)
      }
      if (!_.includes(this._resourceNames, name)) {
        this._resourceNames.push(name)
      }
    }
    return this._tempResources[key]
  }

  /*
   * Use CMS resources on the backend
   *
   * @example
   *   let cms = new CMS();
   *   let api = cms.api();
   *
   *   api('articles').find('abc123xz', function(error, result) {
   *     if (error) return logger.info(error);
   *     logger.info(result);
   *   });
   *
   *  api('articles').attachments.read(['abc123xz','lmnop123'])
   *    .pipe(fs.createWriteStream('./image.png'));
   */
  /**
   * Get API access to CMS resources
   * @returns {function(string, ...string): ResourceAPI} A function that returns resource API for the given resource name
   *
   * @example
   * const api = cms.api()
   *
   * // List all records
   * const articles = await api('articles').list()
   *
   * // Find a specific record
   * const article = await api('articles').find('article-id')
   *
   * // Find with query
   * const publishedArticles = await api('articles').find({ published: true })
   *
   * // Create a new record
   * const newArticle = await api('articles').create({ title: 'New Article', content: 'Content...' })
   *
   * // Update a record
   * await api('articles').update('article-id', { title: 'Updated Title' })
   *
   * // Remove a record
   * await api('articles').remove('article-id')
   *
   * // Check if record exists
   * const exists = await api('articles').exists('article-id')
   *
   * // Work with attachments
   * const attachment = await api('articles').createAttachment('article-id', {
   *   name: 'photo',
   *   stream: fileStream,
   *   fields: { filename: 'photo.jpg' }
   * })
   *
   * // Find attachment
   * const foundAttachment = await api('articles').findAttachment('article-id', 'attachment-id')
   *
   * // Remove attachment
   * await api('articles').removeAttachment('article-id', 'attachment-id')
   */
  /**
   * Get API access to CMS resources
   * @returns {function(string, ...string): ResourceAPIWrapper} Function that returns resource API wrapper for the given resource name
   * @memberof CMS
   *
   * @example
   * const api = cms.api()
   *
   * // All these calls return ResourceAPIWrapper objects with full method availability
   * const groupsAPI = api('_groups')
   * const usersAPI = api('_users')
   *
   * // Use the ResourceAPI methods with full IDE support
   * const groups = await groupsAPI.list()
   * const group = await groupsAPI.find('group-id')
   * const newGroup = await groupsAPI.create({ name: 'New Group' })
   * const updated = await groupsAPI.update('group-id', { name: 'Updated' })
   * await groupsAPI.remove('group-id')
   */
  api = () => {
    const self = this
    /**
     * Create a resource API wrapper for the specified resource
     * @param {string} name - The resource name (e.g., '_groups', 'articles', '_users')
     * @param {...*} rest - Additional arguments passed to resource()
     * @returns {ResourceAPIWrapper} A wrapper providing list, find, create, update, remove and attachment methods
     */
    function createResourceAPI (name, ...rest) {
      const resource = self.resource(name, null, rest)
      return new ResourceAPIWrapper(resource)
    }

    // Add explicit type annotation for better IDE support
    /** @type {function(string, ...string): ResourceAPIWrapper} */
    createResourceAPI.signature = createResourceAPI

    return createResourceAPI
  }

  // Install a plugin and store in _plugins
  use = (plugin, options, configPath) => {
    const instance = new plugin(this, options, configPath)
    // Always store under pluginName if available
    if (plugin.pluginName) {
      this._plugins[plugin.pluginName] = instance
    } else {
      const name = plugin.name || plugin.constructor?.name || 'plugin'
      this._plugins[name] = instance
    }
    return instance
  }

  // Get main application
  express = () => {
    return this._app
  }
}

/**
 * @module node-cms
 * @description Node CMS - A flexible content management system
 *
 * @example
 * const CMS = require('node-cms')
 * const cms = new CMS(config)
 * const api = cms.api()
 *
 * // Use the API to work with resources
 * const groups = await api('_groups').list()
 * const group = await api('_groups').find('group-id')
 * const newGroup = await api('_groups').create({ name: 'New Group' })
 */

/**
 * @typedef {Object} module:node-cms.ResourceAPI
 * @description Complete Resource API interface available through api('resourceName')
 * @property {function(Object=, Object=): Promise<Array<Object>>} list - List all records matching query
 * @property {function(string|Object, Object=): Promise<Object>} find - Find a single record by ID or query
 * @property {function(string|Object): Promise<boolean>} exists - Check if a record exists
 * @property {function(Object, Object=): Promise<Object>} create - Create a new record
 * @property {function(string, Object, Object=): Promise<Object>} update - Update an existing record
 * @property {function(string): Promise<boolean>} remove - Remove a record
 * @property {function(string, Object): Promise<Object>} createAttachment - Create an attachment for a record
 * @property {function(string, string, Object): Promise<Object>} updateAttachment - Update an attachment
 * @property {function(string, string): Promise<Object>} findAttachment - Find an attachment with its stream
 * @property {function(string): Promise<ReadableStream>} findFile - Find a file stream by attachment ID
 * @property {function(string, string): Promise<boolean>} removeAttachment - Remove an attachment from a record
 * @property {function(): Promise<boolean>} cleanAttachment - Clean orphaned attachments
 * @property {function(Array<Object>, Object=, boolean=): Promise<Object>} getImportMap - Get import mapping for bulk operations
 * @property {function(): Array<string>} getUniqueKeys - Get unique key fields for this resource
 */

/**
 * Node CMS Constructor
 * @class
 * @name CMS
 * @memberof module:node-cms
 */
exports = module.exports = CMS

/**
 * Export ResourceAPIWrapper for advanced IDE support
 * @type {ResourceAPIWrapper}
 */
CMS.ResourceAPIWrapper = ResourceAPIWrapper

/**
 * Export RestHelper for middleware reuse in external projects
 * @type {RestHelper}
 */
CMS.RestHelper = require('./lib/plugins/rest/helper')
