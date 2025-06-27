/*
 * CMS Admin API exposed as plugin
 */



const path = require('path')
const _ = require('lodash')
const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const os = require('os')
const fs = require('fs')
const basicAuth = require('basic-auth-connect')
const autoBind = require('auto-bind')
const logger = new (require('img-sh-logger'))()
const pkg = require(path.join(process.cwd(), 'package.json'))
const nodeCmsPkg = require(path.join(__dirname, '..', '..', '..', 'package.json'))
/*
 * Default options
 */
const bootTime = +new Date()
const defaults = {
  mount: '/admin'
}

/*
 * Set constructor
 */

/*
 * Constructor
 *
 * @param {Object} options, optional
 *   @param {Route} route, route to inject itself, eg. '/admin'
 */

class Admin {
  constructor(cms, options, configPath) {
    autoBind(this)
    this.cms = cms
    this.cms.$admin = this
    this._app = cms._app
    this.options = _.extend({}, defaults, options)
    this.configPath = configPath
    this.bootTime = bootTime
    this.initialize()
  }

  initialize() {
    const admin = express()
    // Use the CMS instance that was set in the factory

    admin.use(bodyParser.json())
    const config = _.pick(this.options, ['autoload', 'disableJwtLogin', 'disableAuthentication', 'apiVersion', 'blockRetry', 'import', 'importFromRemote', 'syslog', 'sync', 'toolbarTitle', 'webserver', 'wsRecordUpdates'])
    config.version = _.get(nodeCmsPkg, 'version', 'unknown')
    /* Login Page */
    if (!this.options.disableJwtLogin) {
      admin.post('/', this.onPostLogin.bind(this))
    }
    if (!this.options.disableJwtLogin) {
      admin.get('/', this.onGetRoot.bind(this))
    } else if (!this.options.disableAuthentication) {
      admin.get('/', this.onGetRootBasicAuth.bind(this))
    }
    admin.get('/js/:file', this.onGetJsFile.bind(this))

    admin.get('/fonts/*', this.onGetFonts.bind(this))

    /* Assets */
    let servePath = path.join(__dirname, '../../../dist')
    if (_.get(process, 'env.VITE_DEV_MODE', false) !== false) {
      logger.warn('DEV mode detected, will serve /src folder')
      admin.use(express.static(path.join(__dirname, '../../../public'), {
        maxAge: '365d',
        setHeaders: (res, path) => {
          if (path.search('index.html') > -1) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
            res.setHeader('Pragma', 'no-cache')
            res.setHeader('Expires', '0')
            res.setHeader('Surrogate-Control', 'no-store')
            res.setHeader('Last-Modified',  new Date(+new Date() - Math.ceil(os.uptime())).toUTCString())
          }
        }
      }))
      servePath = path.join(__dirname, '../../../src')
    }
    admin.use(express.static(servePath)) // needed for pkg

    admin.get('/changeTheme/:newTheme', this.onGetChangeTheme.bind(this))

    admin.get('/_groups', this.onGetGroups.bind(this))

    /* User info */
    admin.get('/login', this.onGetLogin.bind(this))

    /* Languages */
    let i18nFolder = path.resolve(path.join('.', 'i18n'))
    if (!fs.existsSync(i18nFolder)) {
      i18nFolder = path.resolve(path.join(__dirname, '../../../i18n'))
    }
    if (fs.existsSync(i18nFolder)) {
      admin.get('/i18n/config.json', this.onGetI18nConfig.bind(this))
      admin.use('/i18n', express.static(i18nFolder))
    }

    /* Resource schemas */
    admin.get('/config', this.onGetConfig.bind(this))

    /* Resource schemas */
    admin.get('/resources', this.resourcesAuthMiddleware.bind(this), this.onGetResources.bind(this))

    /* Paragraphs schemas */
    admin.get('/paragraphs', this.paragraphsAuthMiddleware.bind(this), this.onGetParagraphs.bind(this))

    /* Replication control */

    admin.get('/replicate/:resource', this.onGetReplicate.bind(this))

    /* CMS Configuration Editor - Admin only */

    // GET /admin/cms-config - Load current CMS configuration
    admin.get('/cms-config', this.onGetCmsConfig.bind(this))

    // POST /admin/cms-config - Save CMS configuration and restart server
    admin.post('/cms-config', this.onPostCmsConfig.bind(this))

    this._app.use(this.options.mount, admin)
  }

  async checkIfUserLoggedIn(req) {
    if (this.cms.$authentication.getUserFromToken && _.isEmpty(await this.cms.$authentication.getUserFromToken(req))) {
      console.warn(`User not logged in ${req.originalUrl}`)
      return false
    }
    return true
  }

  async serveDevMode(req, res, next) {
    const devPort = _.get(pkg, 'config.port', 9990) + 10000
    const userLoggedIn = await this.checkIfUserLoggedIn(req, res, next)
    const url = `http://localhost:${devPort}${!userLoggedIn ? `${_.get(pkg, 'config.mountPath', '/')}admin/index.html` : req.originalUrl}`
    logger.warn(`serveDevMode - ${url}`)
    this.serveTemplate(req, res, url, userLoggedIn)
  }

  async getGroupNameFromId(groupId) {
    return _.get(await this.cms.$authentication.groups.find({_id: groupId}), 'name', false)
  }

  replaceTagsInTemplate(template, userIsLoggedIn) {
    const forDev = _.get(process, 'env.VITE_DEV_MODE', false)
    if (forDev) {
      template = _.replace(template, './main.js', '/src/main.js')
    }
    template = _.replace(template, '__TYPE__', userIsLoggedIn ? 'index' : 'login')
    template = _.replace(template, '__TITLE__', userIsLoggedIn ? 'node-cms' : 'Login')
    return template
  }

  serveTemplate(req, res, url, userLoggedIn) {
    const forDev = _.get(process, 'env.VITE_DEV_MODE', false)
    if (!forDev) {
      const body = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'dist', 'index.html'))
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      res.setHeader('Pragma', 'no-cache')
      res.setHeader('Expires', '0')
      res.setHeader('Surrogate-Control', 'no-store')
      res.setHeader('Last-Modified',  new Date(+new Date() - Math.ceil(os.uptime())).toUTCString())
      return res.send(this.replaceTagsInTemplate(body, userLoggedIn))
    }
    http.get(url).on('response', (response) => {
      let body = ''
      response.on('data', (chunk) => {
        body += chunk
      })
      response.on('end', () => {
        res.send(this.replaceTagsInTemplate(body, userLoggedIn))
      })
    })
  }

  async isAdminUser(req) {
    try {
      if (!this.options.disableJwtLogin) {
        const user = await this.cms.$authentication.getUserFromToken(req)
        if (!user) return false
        const groupName = await this.cms.$authentication.getUserGroupName(req)
        return groupName === 'admins'
      } else if (!this.options.disableAuthentication) {
        // For basic auth, we need to check the session or authenticate
        const userGroup = _.get(req, 'user.group', false)
        if (userGroup) {
          const foundUserGroup = await this.cms.$authentication.groups.find({_id: _.get(userGroup, '_id', userGroup)})
          return foundUserGroup.name === 'admins'
        }
        return false
      } else {
        // If authentication is disabled, deny access to config editor
        return false
      }
    } catch (error) {
      logger.error('Error checking admin user:', error)
      return false
    }
  }

  // Route handlers with "on" prefix

  async onPostLogin(req, res) {
    const {error, result} = await this.cms.$authentication.authenticateJwt(req.body.username, req.body.password, req, res)
    if (error || _.isEmpty(result.group)) {
      res.status(500).send('Username and password not match')
    } else {
      result.group = await this.cms.$authentication.groups.find(req.session.nodeCmsUser.group)
      req.session.nodeCmsUser = result
      req.session.nodeCmsJwt = _.get(result, 'token', false)
      res.send('success')
    }
  }

  async onGetRoot(req, res, next) {
    // logger.log(`GET /admin/ from ${req.originalUrl}`)
    if (!/\/$/.test(req.originalUrl)) {
      return res.redirect(301, req.originalUrl + '/')
    }
    if (this.cms.$authentication.getUserFromToken && _.isEmpty(await this.cms.$authentication.getUserFromToken(req))) {
      if (_.get(process, 'env.VITE_DEV_MODE', false) !== false) {
        return this.serveDevMode(req, res, next)
      }
      if (!/\/$/.test(req.originalUrl)) {
        return res.redirect(301, req.originalUrl + '/')
      }
      return this.serveTemplate(req, res, `${req.protocol + '://' + req.get('host') + req.originalUrl}index.html`, false)
    }
    const url = req.protocol + '://' + req.get('host') + req.originalUrl
    if (_.endsWith(url, '/admin/')) {
      return this.serveTemplate(req, res, `${url}index.html`, true)
    }
    next()
  }

  async onGetRootBasicAuth(req, res, next) {
    // logger.log(`GET /admin/ from ${req.originalUrl}`)
    if (!/\/$/.test(req.originalUrl)) {
      return res.redirect(301, req.originalUrl + '/')
    }
    return basicAuth(async (username, password, callback) => {
      const {error} = await this.cms.$authentication.authenticate(username, password, req, callback)
      if (error) {
        next(error)
      } else {
        const url = req.protocol + '://' + req.get('host') + req.originalUrl
        return this.serveTemplate(req, res, `${url}index.html`, true)
      }
    })(req, res, next)
  }

  async onGetJsFile(req, res, next) {
    if (_.get(process, 'env.VITE_DEV_MODE', false) !== false) {
      return await this.serveDevMode(req, res, next)
    }
    next()
  }

  async onGetFonts(req, res, next) {
    await this.serveDevMode(req, res, next)
  }

  async onGetChangeTheme(req, res) {
    try {
      let user = await this.cms.$authentication.getUserFromToken(req)
      await this.cms.$authentication.getUserFromToken(req)
      user = await this.cms.$authentication.users.find({username: _.get(user, 'username', false), group: _.get(user, 'group._id')})
      user.theme = _.get(req, 'params.newTheme', 'dark')
      _.set(req, 'session.nodeCmsUser.theme', user.theme)
      user = await this.cms.$authentication.users.update(user._id, user)
      res.status(200).json({message: 'done'})
    } catch (error) {
      logger.error('/changeTheme error:', error)
      res.status(500).json(error)
    }
  }

  async onGetGroups(req, res) {
    let groups = await this.cms.$authentication.groups.list({})
    groups = _.map(groups, (group) => {
      return {
        name: group.name,
        plugins: group.plugins
      }
    })
    return res.status(200).send(groups)
  }

  async onGetLogin(req, res, next) {
    // logger.warn(`GET admin /login`)
    if (!_.get(this.options, 'disableJwtLogin', false)) {
      if (!_.get(req, 'session.nodeCmsUser', false) && this.cms.$authentication.getUserFromToken && _.isEmpty(await this.cms.$authentication.getUserFromToken(req))) {
        return res.status(200).send({})
      }
      try {
        const groupName = await this.cms.$authentication.getUserGroupName(req)
        const group = await this.cms.$authentication.groups.find({name: groupName})
        const user = await this.cms.$authentication.users.find({username: _.get(req, 'session.nodeCmsUser.username', false), group: _.get(group, '_id')})

        res.status(200).send({
          username: _.get(req, 'session.nodeCmsUser.username', false),
          theme: _.get(user, 'theme', 'light'),
          group: groupName,
          uptime: this.bootTime
        })
      } catch (error) {
        logger.error('Error on login: ', error.message)
        return res.status(200).send({})
      }
    } else if (!_.get(this.options, 'disableAuthentication', false)) {
      basicAuth(async (username, password, callback) => {
        logger.debug('basic auth 1')
        const {error, result} = await this.cms.$authentication.authenticate(username, password, req, callback)
        if (error) {
          next(error)
        } else {
          return res.status(200).send({
            username: _.get(result, 'username', false),
            theme: _.get(result, 'theme', 'light'),
            group: await this.getGroupNameFromId(_.get(result, 'group', false)),
            uptime: this.bootTime
          })
        }
      })(req, res, next)
    } else {
      return res.status(200).send({
        username: 'anonymous',
        theme: 'light',
        group: 'anonymous',
        uptime: this.bootTime
      })
    }
  }

  onGetI18nConfig(req, res) {
    res.json(_.get(this.cms, '_options.admin', { language: { 'defaultLocale': 'enUS', 'locales': ['enUS'] } }))
  }

  onGetConfig(req, res) {
    const config = _.pick(this.options, ['autoload', 'disableJwtLogin', 'disableAuthentication', 'apiVersion', 'blockRetry', 'import', 'importFromRemote', 'syslog', 'sync', 'toolbarTitle', 'webserver', 'wsRecordUpdates'])
    config.version = _.get(nodeCmsPkg, 'version', 'unknown')
    res.send(config)
  }

  // Middleware methods
  async resourcesAuthMiddleware(req, res, next) {
    if (!this.options.disableJwtLogin) {
      _.set(req, 'user.group', _.get(req, 'session.nodeCmsUser.group', false))
      next()
    } else if (!this.options.disableAuthentication) {
      basicAuth(async (username, password, callback) => {
        const {error, result} = await this.cms.$authentication.authenticate(username, password, req, callback)
        if (error) {
          next(error)
        } else {
          _.set(req, 'user', result)
        }
      })(req, res, next)
    } else {
      next()
    }
  }

  async onGetResources(req, res) {
    const userGroup = _.get(req, 'user.group', false)
    if (userGroup) {
      // authed
      try {
        const foundUserGroup = await this.cms.$authentication.groups.find({_id: _.get(userGroup, '_id', userGroup)})
        req.resources = foundUserGroup.read
      } catch (error) {
        logger.error('Error getting user group: ', error)
        return res.status(401).send('Not authorized')
      }
    } else {
      // anonymous
      try {
        const group = await this.cms.$authentication.groups.find({ name: 'anonymous' })
        req.resources = group.read
      } catch (error) {
        logger.error('GET /admin/resources Error: ', error.message)
        return res.status(401).send('Not authorized')
      }
    }
    if (!req.resources.length) {
      logger.warn('Unauthorized')
      res.statusCode = 401
      res.setHeader('WWW-Authenticate', 'Basic realm="Authorization Required"')
      return res.end('Unauthorized')
    }
    let resources = _.map(this.cms._resources, (resource, name) => {
      _.each(resource.options, (item) => {
        if (_.isRegExp(_.get(item, 'options.regex.value'))) {
          item.options.regex.value = item.options.regex.value.toString()
        } else if (_.isObject(_.get(item, 'options.regex'))) {
          _.each(item.options.regex, (localeItem) => {
            if (_.isRegExp(localeItem.value)) {
              localeItem.value = localeItem.value.toString()
            }
          })
        }
        return item
      })
      return _.extend({}, resource.options, {
        title: name,
        acl: null,
        cms: null,
        resource: null,
        mid: resource.options.cms.mid,
        clock: _.map(resource.json._sync && resource.json._sync.clock, (value, key) =>
          ({
            mid: key.split(' ').pop(),
            time: value
          }))
      })
    })
    resources = _.filter(resources, (resource) => req.resources.indexOf(resource.title) > -1)
    if (!_.get(req.query, 'listAttachments', false)) {
      _.each(resources, (resource) => {
        if (_.get(resource, '_attachments', false)) {
          delete resource._attachments
        }
      })
    }
    res.json(resources)
  }

  async paragraphsAuthMiddleware(req, res, next) {
    if (!this.options.disableJwtLogin) {
      _.set(req, 'user.group', _.get(req, 'session.nodeCmsUser.group', false))
      next()
    } else if (!this.options.disableAuthentication) {
      basicAuth(async (username, password, callback) => {
        const {error, result} = await this.cms.$authentication.authenticate(username, password, req, callback)
        if (error) {
          next(error)
        } else {
          _.set(req, 'user', result)
        }
      })(req, res, next)
    } else {
      next()
    }
  }

  async onGetParagraphs(req, res) {
    try {
      const userGroup = _.get(req, 'user.group', false)
      if (!userGroup) {
        throw new Error('Not authorized')
      }
      req.paragraphs = this.cms._paragraphs
      const paragraphs = _.map(this.cms._paragraphs, (paragraph, name) => {
        return _.extend({}, paragraph.options, paragraph, {title: name})
      })
      res.status(200).json(paragraphs)
    } catch (error) {
      logger.warn('Unauthorized', error)
      res.statusCode = 401
      res.setHeader('WWW-Authenticate', 'Basic realm="Authorization Required"')
      res.end('Unauthorized')
    }
  }

  onGetReplicate(req, res) {
    this.cms.replicate(req.query.host, parseInt(req.query.port, 10), req.params.resource, (error) => {
      if (error) {
        return res.status(500).send(error)
      }
      res.json({ result: 'ok' })
    })
  }

  async onGetCmsConfig(req, res) {
    try {
      if (!(await this.isAdminUser(req))) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' })
      }
      res.json(JSON.parse(fs.readFileSync(this.configPath, 'utf8')))
    } catch (error) {
      logger.error('Error loading CMS config:', error)
      res.status(500).json({ error: 'Failed to load configuration: ' + error.message })
    }
  }

  async onPostCmsConfig(req, res) {
    try {
      if (!(await this.isAdminUser(req))) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' })
      }

      const newConfig = req.body
      if (!newConfig || !_.isObject(newConfig)) {
        return res.status(400).json({ error: 'Invalid configuration data' })
      }

      // Validate that it's valid JSON by stringifying and parsing
      try {
        JSON.parse(JSON.stringify(newConfig))
      } catch (jsonError) {
        return res.status(400).json({ error: 'Invalid JSON configuration: ' + jsonError.message })
      }

      // Write the new configuration to cms.json
      const configString = JSON.stringify(newConfig, null, 2)

      // Create backup before writing
      const backupPath = this.configPath + '.backup.' + Date.now()
      if (fs.existsSync(this.configPath)) {
        fs.copyFileSync(this.configPath, backupPath)
        logger.info(`Created backup of cms.json at: ${backupPath}`)
      }

      fs.writeFileSync(this.configPath, configString, 'utf8')
      logger.info('CMS configuration updated successfully')

      res.json({
        message: 'Configuration saved successfully. Server will restart shortly.',
        backupPath: backupPath
      })

      // Restart the server after a short delay
      setTimeout(() => {
        logger.info('Restarting server due to configuration change...')
        process.exit(0) // Let process manager (like PM2, nodemon, etc.) restart
      }, 1000)

    } catch (error) {
      logger.error('Error saving CMS config:', error)
      res.status(500).json({ error: 'Failed to save configuration: ' + error.message })
    }
  }
}

exports = module.exports = Admin

