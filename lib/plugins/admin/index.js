/*
 * CMS Admin API exposed as plugin
 */

/*
 * Module dependencies
 */

const http = require('http')
const path = require('path')
const _ = require('lodash')
const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const basicAuth = require('basic-auth-connect')
const logger = new (require(path.join(__dirname, '..', '..', 'logger')))()
const pkg = require(path.join(__dirname, '..', '..', '..', 'package.json'))

/*
 * Default options
 */

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

const Admin = function (options) {
  const opts = _.extend({}, defaults, options)
  return function () {
    const admin = express()
    const cms = this

    admin.use(bodyParser.json())

    /* Plugins */
    let pluginsFolder = path.resolve(path.join('.', 'plugins'))
    if (fs.existsSync(pluginsFolder)) {
      admin.use('/plugins', express.static(pluginsFolder))
    } else {
      logger.warn(`No plugins found at ${pluginsFolder}`)
    }

    /* Login Page */
    if (!opts.disableJwtLogin) {
      admin.post('/', async (req, res, next) => {
        const {error, result} = await cms.authenticateJwt(req.body.username, req.body.password, req, res)
        if (error || _.isEmpty(result.group)) {
          res.status(500).send('Username and password not match')
        } else {
          result.group = await cms.groups.find(req.session.nodeCmsUser.group)
          req.session.nodeCmsUser = result
          req.session.nodeCmsJwt = _.get(result, 'token', false)
          res.send('success')
        }
      })
      admin.get('/', async (req, res, next) => {
        logger.warn(`GET /admin/ from ${req.originalUrl}`)
        if (!/\/$/.test(req.originalUrl)) {
          return res.redirect(301, req.originalUrl + '/')
        }
        if (cms.getUserFromToken && _.isEmpty(await cms.getUserFromToken(req))) {
          logger.warn('LOGIN !')
          if (_.get(process, 'env.VITE_DEV_MODE', false) !== false) {
            logger.warn('DEV !')
            return this.serveDevMode(req, res, next)
          }
          if (!/\/$/.test(req.originalUrl)) {
            logger.warn('PROD ! 1')
            return res.redirect(301, req.originalUrl + '/')
          }
          return res.sendFile(path.join(__dirname, '../../../dist/src/login.html'))
        }
        next()
      })
      admin.get('/js/:file', async (req, res, next) => {
        if (_.get(process, 'env.VITE_DEV_MODE', false) !== false) {
          return await this.serveDevMode(req, res, next)
        }
        next()
      })
    }

    admin.get('/fonts/*', async (req, res, next) => {
      await this.serveDevMode(req, res, next)
    })

    this.checkIfUserLoggedIn = async function (req, res, next) {
      if (cms.getUserFromToken && _.isEmpty(await cms.getUserFromToken(req))) {
        console.warn(`User not logged in ${req.originalUrl}`)
        return false
      }
      return true
    }

    this.serveDevMode = async function (req, res, next) {
      const devPort = _.get(pkg, 'config.port', 9990) + 10000
      const userLoggedIn = await this.checkIfUserLoggedIn(req, res, next)
      const url = `http://localhost:${devPort}${!userLoggedIn ? '/admin/login.html' : req.originalUrl}`
      logger.warn(`serveDevMode - ${url}`)
      const request = http.get(url, (response) => {
        const contentType = _.get(response, 'headers[\'content-type\']', 'application/octet-stream')
        res.setHeader('Content-Type', contentType)
        response.pipe(res)
      })
      request.on('error', (error) => {
        console.error('failed to pipe remote file', error)
        throw error
      })
    }

    /* Assets */
    let servePath = path.join(__dirname, '../../../dist')
    if (_.get(process, 'env.VITE_DEV_MODE', false) !== false) {
      logger.warn('DEV mode detected, will serve /src folder')
      admin.use(express.static(path.join(__dirname, '../../../public')))
      servePath = path.join(__dirname, '../../../src')
    }
    admin.use(express.static(servePath)) // needed for pkg

    this.getGroupNameFromId = async (groupId) => {
      return _.get(await cms.groups.find({_id: groupId}), 'name', false)
    }

    admin.get('/changeTheme/:newTheme', async (req, res, next) => {
      try {
        let user = await cms.getUserFromToken(req)
        // TODO: hugo - change the theme in the session too
        user = await cms.users.find({username: _.get(user, 'username', false), group: _.get(user, 'group._id')})
        user.theme = _.get(req, 'params.newTheme', 'dark')
        console.warn('new theme = ', user.theme)
        _.set(req, 'session.nodeCmsUser.theme', user.theme)
        user = await cms.users.update(user._id, user)
        res.status(200).json({message: 'done'})
      } catch (error) {
        logger.error('/changeTheme error:', error)
        res.status(500).json(error)
      }
    })

    /* User info */
    admin.get('/login', async (req, res, next) => {
      // logger.warn(`GET admin /login`)
      if (!_.get(options, 'disableJwtLogin', false)) {
        if (!_.get(req, 'session.nodeCmsUser', false) && cms.getUserFromToken && _.isEmpty(await cms.getUserFromToken(req))) {
          return res.status(200).send({})
        }
        try {
          res.status(200).send({
            username: _.get(req, 'session.nodeCmsUser.username', false),
            theme: _.get(req, 'session.nodeCmsUser.theme', 'light'),
            group: await cms.getUserGroupName(req)
          })
        } catch (error) {
          logger.error('Error on login: ', error.message)
          return res.status(200).send({})
        }
      } else if (!_.get(options, 'disableAuthentication', false)) {
        basicAuth(async (username, password, callback) => {
          logger.debug('basic auth 1')
          const {error, result} = await cms.authenticate(username, password, req, callback)
          if (error) {
            next(error)
          } else {
            return res.status(200).send({
              username: _.get(result, 'username', false),
              theme: _.get(result, 'theme', 'light'),
              group: await this.getGroupNameFromId(_.get(result, 'group', false))
            })
          }
        })(req, res, next)
      } else {
        return res.status(200).send({
          username: 'anonymous',
          theme: 'light',
          group: 'anonymous'
        })
      }
    })

    /* Languages */
    let i18nFolder = path.resolve(path.join('.', 'i18n'))
    if (!fs.existsSync(i18nFolder)) {
      i18nFolder = path.resolve(path.join(__dirname, '../../../i18n'))
    }
    if (fs.existsSync(i18nFolder)) {
      admin.get('/i18n/config.json', (req, res, next) => res.json(_.get(cms, '_options.admin', { language: { 'defaultLocale': 'enUS', 'locales': ['enUS'] } })))
      admin.use('/i18n', express.static(i18nFolder))
    }

    /* Resource schemas */
    admin.get('/config', (req, res, next) => {
      res.send(_.pick(options, ['autoload', 'disableJwtLogin', 'apiVersion', 'blockRetry', 'import', 'syslog', 'sync', 'toolbarTitle', 'webserver']))
    })

    /* Resource schemas */
    admin.get('/resources',
      async (req, res, next) => {
        if (!options.disableJwtLogin) {
          _.set(req, 'user.group', _.get(req, 'session.nodeCmsUser.group', false))
          next()
        } else if (!options.disableAuthentication) {
          basicAuth(async (username, password, callback) => {
            logger.debug('basic auth 2')
            const {error, result} = await cms.authenticate(username, password, req, callback)
            if (error) {
              next(error)
            } else {
              _.set(req, 'user', result)
            }
          })(req, res, next)
        } else {
          next()
        }
      },
      async (req, res, next) => {
        const userGroup = _.get(req, 'user.group', false)
        if (userGroup) {
          // authed
          try {
            const foundUserGroup = await cms.groups.find({_id: _.get(userGroup, '_id', userGroup)})
            req.resources = foundUserGroup.read
            // only actually display what could be read
            next()
          } catch (error) {
            logger.error('Error getting user group: ', error)
            return res.status(401).send('Not authorized')
          }
        } else {
          // anonymous
          try {
            const group = await cms.groups.find({ name: 'anonymous' })
            req.resources = group.read
            // only actually display what could be read
            next()
          } catch (error) {
            logger.error('GET /admin/resources Error: ', error.message)
            return res.status(401).send('Not authorized')
          }
        }
      }, (req, res, next) => {
        if (!req.resources.length) {
          logger.warn('Unauthorized')
          res.statusCode = 401
          res.setHeader('WWW-Authenticate', 'Basic realm="Authorization Required"')
          res.end('Unauthorized')
        } else {
          next()
        }
      }, (req, res) => {
        res.json(_.chain(cms._resources).map((resource, name) => {
          _.each(resource.options, (item) => {
            if (_.isRegExp(_.get(item, 'options.regex.value'))) {
              item.options.regex.value = item.options.regex.value.toString()
            } else if (_.isObject(_.get(item, 'options.regex'))) {
              _.forEach(item.options.regex, (localeItem, locale) => {
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
        }).filter(resource => req.resources.indexOf(resource.title) > -1).value())
      })

    /* Replication control */

    admin.get('/replicate/:resource', (req, res) => {
      cms.replicate(req.query.host, parseInt(req.query.port, 10), req.params.resource, (error) => {
        if (error) {
          return res.status(500).send(error)
        }
        res.json({ result: 'ok' })
      })
    })
    this._app.use(opts.mount, admin)
  }
}

/*
 * Expose
 */

exports = (module.exports = Admin)
