/*
 * Module dependencies
 */

const path = require('path')
const fs = require('fs')
const pAll = require('p-all')
const Q = require('q')
const compression = require('compression')
const cookieParser = require('cookie-parser')
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
    disableJwtLogin: true,
    disableReplication: false,
    disableAuthentication: false,
    disableAnonymous: false,
    apiVersion: 1,
    session: {
      secret: 'MdjIwFRi9ezT'
    }
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
    if (!options.disableAuthentication || !options.disableJwtLogin) {
      const secret = _.get(this.options, 'session.secret')
      if (_.isEmpty(secret)) {
        throw new Error('config.session.secret is missing')
      }
      this._app.use(session(_.extend({cookie: {}}, this.options.session)))
    }
    if (!options.disableAuthentication) {
      /* Enables session with basic auth */
      this._app.use((req, res, next) => {
        if (req.session.user && !req.headers.authorization) {
          req.headers.authorization = 'Basic ' + Buffer.from(req.session.user.username + ':' + req.session.user.password).toString('base64')
        }
        next()
      })
    } else if (!options.disableJwtLogin) {
      /* Enables session with jwt token auth */
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
    this.use(require('./lib/plugins/authentication')(options))

    // handle syslog and system
    this.bootstrapFunctions = this.bootstrapFunctions || []
    this.bootstrapFunctions.push(async (callback) => {
      SyslogManager.init(this, options)
      SystemManager.init(this, options)
    })
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
    this.bootstrap = async (server, callback) => {
      if (_.isFunction(server) && _.isUndefined(callback)) {
        callback = server
        server = undefined
      }
      this.server = server
      await pAll(_.map(this.bootstrapFunctions, bootstrap => {
        return async () => {
          await Q.nfcall(bootstrap)
        }
      }), {concurrency: 1})
      callback && callback()
    }
  }

  underscoreObject (list, values) {
    let result = {}
    for (let i = 0, length = _.get(list, 'length', 0); i < length; i++) {
      if (values) {
        result[list[i]] = values[i]
      } else {
        result[list[i][0]] = list[i][1]
      }
    }
    return result
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

      const resolveMap = _.zipObject(resolves, _.map(resolves, item => this.resource(item)))

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
   *   let cms = new CMS();
   *   let api = cms.api();
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
