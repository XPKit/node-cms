/*
 * CMS Admin API exposed as plugin
 */

/*
 * Module dependencies
 */

const path = require('path')
const log4js = require('log4js')
const _ = require('lodash')
const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
let logger = log4js.getLogger()

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
    }

    /* Login Page */
    if (!opts.disableAdminLogin) {
      admin.post('/', async (req, res, next) => {
        const {error, result} = await cms.authenticate(req.body.username, req.body.password, req, res)
        if (error || _.isEmpty(result.group)) {
          res.status(500).send('Username and password not match')
        } else {
          result.group = await cms.groups.find(req.session.nodeCmsUser.group)
          req.session.nodeCmsUser = result
          req.session.nodeCmsJwt = _.get(result, 'token', false)
          res.send('success')
        }
      })
      admin.get('/', (req, res, next) => {
        if (!/\/$/.test(req.originalUrl)) {
          return res.redirect(301, req.originalUrl + '/')
        }
        if (_.isEmpty(cms.getUserFromToken(req))) {
          return res.sendFile(path.join(__dirname, '../../../app/login.html'))
        }
        next()
      })
    }

    /* Assets */
    admin.use(express.static(path.join(__dirname, '../../../app'))) // needed for pkg

    /* User info */
    admin.get('/login', async (req, res, next) => {
      logger.warn(`GET admin /login`)
      if (!_.get(req, 'session.nodeCmsUser', false) && _.isEmpty(cms.getUserFromToken(req))) {
        return res.status(200).send({})
      }
      try {
        res.status(200).send({
          username: _.get(req, 'session.nodeCmsUser.username', false),
          group: await cms.getUserGroupName(req)
        })
      } catch (error) {
        return res.status(200).send({})
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
      res.send(_.pick(options, ['autoload', 'disableAdminLogin', 'apiVersion', 'blockRetry', 'import', 'syslog', 'sync']))
    })

    /* Resource schemas */
    admin.get('/resources',
      async (req, res, next) => {
        let userGroup = _.get(req, 'session.nodeCmsUser.group', false)
        if (userGroup) {
          // authed
          try {
            const foundUserGroup = await cms.groups.find({_id: _.get(userGroup, '_id', userGroup)})
            req.resources = foundUserGroup.read
            // only actually display what could be read
            next()
          } catch (error) {
            logger.error(`Error getting user group: `, error)
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
