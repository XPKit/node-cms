/*
 * Module dependencies
 */

const path = require('path')
const fs = require('fs')
const pAll = require('p-all')
const Q = require('q')
const compression = require('compression')
const express = require('express')
const helmet = require('helmet')
const _ = require('lodash')
const requireDir = require('require-dir')
const mkdirp = require('mkdirp')
const session = require('express-session')

const UUID = require('./lib/util/uuid')
const SyslogManager = require('./lib/SyslogManager')
const SystemManager = require('./lib/SystemManager')
let Resource = null

/*
 * Default CMS configration
 */

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
    disableAdminLogin: true,
    disableReplication: false,
    disableAuthentication: false,
    disableAnonymous: false,
    apiVersion: 1
  })

/*
 * Define a new resource if not present
 */

/*
 * Constructor
 */

class CMS {
  constructor (options) {
    /* get config path */
    this.resource = this.resource.bind(this)
    this.api = this.api.bind(this)
    this.use = this.use.bind(this)
    this.express = this.express.bind(this)
    const configPath = path.resolve((options != null ? options.config : undefined) || './cms.json')
    if (options) {
      delete options.config
    }

    /* create a default config, if not exist */

    if (!fs.existsSync(configPath)) {
      const cfg = _.extend(defaultConfig(), options)
      fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2))
    }

    /* aggregate options */

    this.options = (options = (this._options = _.extend({}, defaultConfig(), require(configPath), options)))
    Resource = options.apiVersion === 2 ? require('./lib/resourceV2') : require('./lib/resource')

    /* ensure required folders are in place */

    mkdirp.sync(path.resolve(options.resources))
    mkdirp.sync(path.resolve(options.data))

    /* keep track of available resources */
    this._tempResources = {}
    this._resources = {}
    this._resourceNames = []

    /* keep track of available plugins */
    this._plugins = {}

    /* Use prefixed UUID */
    options.uuid = new UUID(options.mid)

    /* automaticly populate CMS resources, if specified */

    if (this._options.autoload) {
      _.each(requireDir(options.resources), (value, key) => this.resource(key, value))
    }

    /* create main application */
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

    /* Enable compression */
    this._app.use(compression({
      filter (req, res) {
        if (req.headers['x-no-compression']) {
          return false
        } return compression.filter(req, res)
      }
    }))

    /* Enable session */
    if (!options.disableAdminLogin) {
      this._app.use(session({
        secret: 'keyboard cat',
        cookie: {}
      }))
      this._app.use((req, res, next) => {
        if (req.session.user && !req.headers.authorization) {
          req.headers.authorization = 'Basic ' + Buffer.from(req.session.user.username + ':' + req.session.user.password).toString('base64')
        }
        next()
      })
    }

    // handle syslog and system
    SyslogManager.init(this, options)
    SystemManager.init(this, options)
    this._app.use(SyslogManager.express())
    this._app.use(SystemManager.express())

    /* REST API */
    if (!options.disableREST) {
      this.use(require('./lib/plugins/rest')())
    }

    /* import API */
    if (options.import) {
      this.use(require('./lib/plugins/import')(options))
    }

    /* Admin API */
    if (!options.disableAdmin) {
      this.use(require('./lib/plugins/admin')(options))
    }

    /* Replication API */
    if (!options.disableReplication) {
      this.use(require('./lib/plugins/replicator')())
    }

    /* Authentication API */
    if (!options.disableAuthentication) {
      this.use(require('./lib/plugins/authentication')(options))
    }

    /* Migration API */
    if (options.migration) {
      this.use(require('./lib/plugins/migration')(options))
    }

    /* Sync API */
    if (options.sync) {
      this.use(require('./lib/plugins/sync')(options))
    }

    /* xlsx API */
    if (options.xlsx) {
      this.use(require('./lib/plugins/xlsx')(options))
    }

    /* anonymousRead */
    if (options.anonymousRead) {
      this.use(require('./lib/plugins/anonymousRead')(options))
    }

    // handle bootstrap
    this.bootstrap = async (callback) => {
      await pAll(_.map(this.bootstrapFunctions, bootstrap => {
        return async () => {
          await Q.nfcall(bootstrap)
        }
      }), {concurrency: 1})
      callback && callback()
    }
  }

  resource (name, config, resolves) {
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

      const resolveMap = _.zipObject(_.map(resolves, item => [item,
        this.resource(item)]))
      this._tempResources[key] = new Resource(name, opts, resolveMap, this)
      if (_.isEmpty(resolves)) {
        this._resources[name] = this._tempResources[key]
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
   *   var cms = new CMS();
   *   var api = cms.api();
   *
   *   api('articles').find('abc123xz', function(error, result) {
   *     if (error) return console.log(error);
   *     console.log(result);
   *   });
   *
   *  api('articles').attachments.read(['abc123xz','lmnop123'])
   *    .pipe(fs.createWriteStream('./image.png'));
   */

  api () {
    return (name, ...rest) => this.resource(name, null, rest)
  }

  /*
   * Install a plugin
   */

  use (plugin) {
    return plugin.apply(this)
  }

  /*
   * Get main application
   */
  express () {
    return this._app
  }
}

/*
 * Expose
 */

exports = module.exports = CMS
