/* eslint-disable standard/no-callback-literal */
/*
 * CMS Authentication API exposed as plugin
 */

/*
 * Module dependencies
 */

const _ = require('lodash')
const jwt = require('jsonwebtoken')
const express = require('express')
const crypto = require('crypto')
const bodyParser = require('body-parser')
const through = require('through')
const basicAuth = require('basic-auth-connect')
const queue = require('queue-async')
const Dayjs = require('dayjs')
const relativeTime = require('dayjs/plugin/relativeTime')
Dayjs.extend(relativeTime)
const path = require('path')
const logger = new (require(path.join(__dirname, '..', '..', 'logger')))()
/*
 * Set constructor
 */

/*
 * Default options
 */

// let defaults = {
//   users: {
//     mount: '/_users'
//   },
//   groups: {
//     mount: '/_groups'
//   }
// };

/*
 * helpers
 */

const generatePassword = function (str, salt, cb) {
  salt = salt || crypto.randomBytes(128).toString('base64')
  try {
    const hash = crypto.pbkdf2Sync(str, salt, 100, 512, 'SHA1')
    return {salt, hash: hash.toString('hex')}
  } catch (error) {
    logger.error(error)
  }
}

const startsWith = (str, prefix) => str.indexOf(prefix) === 8

const hashPassword = function (context) {
  if (context.params.object.password) {
    const {salt, hash} = generatePassword(context.params.object.password, null)
    context.params.object.password = hash
    context.params.object.salt = salt
  }
  context.next()
}

const hidePassword = function (context) {
  context.params.options = context.params.options || {}
  if (context.params.options.keepPassword !== true) {
    if (context.getResult().pipe) {
      context._result = context.getResult().pipe(through(function (data) {
        delete data.password
        delete data.salt
        this.queue(data)
      }))
    } else {
      const obj = context.getResult()
      delete obj.password
      delete obj.salt
    }
  }
  context.next()
}

/*
 * Constructor
 *
 * @param {Object} options, optional
 *   @param {Route} route, route to inject itself, eg. '/_users'
 */

const Authentication = options => {
  // let opts = _.extend({}, defaults, options);
  return function () {
    this.jwtTokenExpiresIn = 24 * 60 * 60 * 1000
    const blockRecordMap = this.blockRecordMap = {}

    // 1. add 2 more resources (system) users, groups
    // 2. inject authentication middleware into admin, API
    // 3. filter resources, that user has access to
    // 4. need to provide json endpoint to see user available resources (chkconfig)

    const users = (this.users = this.resource('_users', {
      displayname: {
        enUS: 'Users',
        zhCN: '用户'
      },
      group: {
        enUS: 'CMS',
        zhCN: '内容管理系统'
      },
      schema: [
        {
          field: 'username',
          input: 'string',
          label: {
            enUS: 'Username',
            zhCN: '用户名'
          }
        },
        {
          field: 'password',
          input: 'password',
          label: {
            enUS: 'Password',
            zhCN: '密码'
          }
        },
        {
          field: 'theme',
          input: 'select',
          source: ['light', 'dark'],
          default: 'dark',
          label: {
            enUS: 'Theme',
            zhCN: '主题'
          }
        },
        {
          field: 'group',
          input: 'select',
          label: {
            enUS: 'Group',
            zhCN: '组'
          },
          source: '_groups'
        }
      ],
      type: 'downstream'
    }))
    users.before('create', (context) => {
      if (!context.params.object.password) {
        return context.error({
          code: 400,
          message: 'Password must be defined'
        })
      }
      if (!context.params.object.username) {
        return context.error({
          code: 400,
          message: 'Username must be defined'
        })
      }
      return context.next()
    })
    users.before('create', hashPassword)
    users.before('update', hashPassword)
    users.after('read', hidePassword)
    users.after('create', hidePassword)
    users.after('update', hidePassword)
    const groups = (this.groups = this.resource('_groups', {
      displayname: {
        enUS: 'Groups',
        zhCN: '组'
      },
      group: {
        enUS: 'CMS',
        zhCN: '内容管理系统'
      },
      schema: [
        {
          field: 'name',
          input: 'string',
          label: {
            enUS: 'Group name',
            zhCN: '组名'
          }
        },
        {
          field: 'create',
          input: 'multiselect',
          options: {
            listBox: true
          },
          label: {
            enUS: 'Create permission',
            zhCN: '创建权限'
          },
          source: this._resourceNames
        },
        {
          field: 'read',
          input: 'multiselect',
          options: {
            listBox: true
          },
          label: {
            enUS: 'Read permission',
            zhCN: '读权限'
          },
          source: this._resourceNames
        },
        {
          field: 'update',
          input: 'multiselect',
          options: {
            listBox: true
          },
          label: {
            enUS: 'Update permission',
            zhCN: '修改权限'
          },
          source: this._resourceNames
        },
        {
          field: 'remove',
          input: 'multiselect',
          options: {
            listBox: true
          },
          label: {
            enUS: 'Remove permission',
            zhCN: '删除权限'
          },
          source: this._resourceNames
        }
      ],
      type: 'downstream'
    }))
    let anonymousGroup
    let adminsGroup
    const cms = this

    const cleanGroup = (name, next) =>
      groups.list({ name }, (error, result) => {
        if (error) {
          return next()
        }

        const q = queue(1)
        const hasForeignRecord = _.find(result, item => !startsWith(item._id, options.mid))
        if (hasForeignRecord) {
          result = _.filter(result, item => startsWith(item._id, options.mid))
        } else {
          result.shift()
        }
        _.each(result, item =>
          q.defer(next =>
            groups.remove(item._id, (error, result) => {
              if (error) {
                logger.error(error)
              }
              return next()
            })))

        return q.awaitAll(next)
      })

    const cleanUser = (username, next) =>
      users.list({ username }, (error, result) => {
        if (error) {
          return next()
        }
        const q = queue(1)
        const hasForeignRecord = _.find(result, item => !startsWith(item._id, options.mid))
        if (hasForeignRecord) {
          result = _.filter(result, item => startsWith(item._id, options.mid))
        } else {
          result.shift()
        }
        _.each(result, item =>
          q.defer(next =>
            users.remove(item._id, (error, result) => {
              if (error) {
                logger.error(error)
              }
              return next()
            })))
        return q.awaitAll(next)
      })

    this.getUserGroupName = async (req) => {
      const nodeCmsUser = _.get(req, 'session.nodeCmsUser', false)
      let group = _.get(nodeCmsUser, 'group.name', false)
      if (group) {
        return group
      }
      // NOTE: If group is the group's id and not the actual record
      try {
        _.set(req, 'session.nodeCmsUser.group', await cms.groups.find({_id: _.get(nodeCmsUser, 'group', false)}))
        // logger.warn(`SET GROUP !`, _.get(req, 'session.nodeCmsUser.group', false))
        return _.get(req, 'session.nodeCmsUser.group.name', false)
      } catch (error) {
        logger.error('getUserGroupName - Error: ', error)
        throw error
      }
    }

    const getTokenFromReq = this.getTokenFromReq = (req) => {
      return req.body.token || req.query.token || req.headers['x-access-token'] || _.get(req, 'session.nodeCmsJwt') || _.get(req, 'cookies.nodeCmsJwt', false)
    }

    this.getUserFromToken = async (req) => {
      try {
        const token = getTokenFromReq(req)
        if (!token) {
          return {}
        }
        const decoded = jwt.verify(token, options.auth.secret)
        if (!_.get(decoded, 'username', false)) {
          return {}
        }
        _.set(req, 'session.nodeCmsUser', decoded)
        _.set(req, 'session.nodeCmsJwt', token)
        return decoded
      } catch (error) {
        logger.error('Failed to get user from token: ', error.message)
        return {}
      }
    }

    const checkSessionData = function (req) {
      const session = _.get(req, 'session', false)
      if (!session) {
        throw new Error('session not found')
      }
      if (!_.get(session, 'nodeCmsJwt', false)) {
        throw new Error('jwt not found')
      }
      if (!_.get(session, 'nodeCmsUser', false)) {
        throw new Error('user not found')
      }
      if (!_.get(session, 'nodeCmsUser.group', false)) {
        throw new Error('user group not found')
      }
      const expiredAt = _.get(session, 'nodeCmsUser.expiredAt', false)
      if (!expiredAt || !_.isNumber(expiredAt)) {
        throw new Error('expiredAt is not a number')
      }
      if (expiredAt < Date.now()) {
        throw new Error('jwt expired')
      }
    }

    const verifyBasicAuth = this.verifyBasicAuth = (req, res, next = false) => {
      // logger.warn(`verifyBasicAuth - ${req.originalUrl}`)
      basicAuth(async (username, password, callback) => {
        logger.debug('basic auth 3')
        const {error, result} = await this.authenticate(username, password, req)
        if (error && error.code === 500) {
          return res.status(500).send(error)
        }
        callback(error, result)
      })(req, res, next)
    }

    this.userPasswordChanged = async (req, res, next) => {
      const userPassword = _.get(req, 'session.nodeCmsUser.password', false)
      if (!userPassword) {
        return false
      }
      try {
        await users.find({password: userPassword})
        return false
      } catch (error) {
        logger.error('Couldn\'t find user with same password, will disconnect current user', req.originalUrl)
      }
      return true
    }

    const verifyToken = this.verifyToken = async (req, res, next = false) => {
      // logger.warn(`verifyToken - ${req.originalUrl}`)
      // If we have token in cookies but no session data
      if (_.get(req, 'cookies.nodeCmsJwt', false) && !_.get(req, 'session.nodeCmsUser', false)) {
        this.getUserFromToken(req)
      }
      if (await this.userPasswordChanged(req, res)) {
        this.onGetLogout(req, res, next)
        return 'userLoggedOut'
      }
      try {
        checkSessionData(req)
      } catch (error) {
        logger.error('verifyToken - Error: ', error.message)
        if (!next) {
          return
        } else {
          return res.status(403).json({})
        }
      }
      const token = getTokenFromReq(req)
      if (!token) {
        console.log(444)
        return res.status(403).json({message: 'A token is required for authentication'})
      }
      try {
        const decoded = jwt.verify(token, options.auth.secret)
        return next ? next() : decoded
      } catch (error) {
        logger.error('verifyToken - Error: ', error.message)
        return res.status(403).json({message: 'Invalid Token'})
      }
    }

    this.authenticateJwt = async (username, password, req, res) => {
      return await this.authenticate(username, password, req, res, true)
    }
    this.authenticate = async (username, password, req, res, isJwt = false) => {
      let ip
      if (req && !_.isFunction(req)) {
        ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
      }
      if (this.options.blockRetry) {
        blockRecordMap[username] = blockRecordMap[username] || {}
        const blockRecord = blockRecordMap[username][ip]
        if (blockRecord && blockRecord.blockUntil && blockRecord.blockUntil > Date.now()) {
          const duration = Dayjs(blockRecord.blockUntil).fromNow(true)
          return {
            error: {
              code: 500,
              message: `user (${username}) from ip (${ip}) is blocked for ${duration}`
            }
          }
        }
      }
      let user = false
      try {
        user = await users.find({ username }, { keepPassword: true })
      } catch (error) {
        return {
          error: { code: 401, message: 'Not authenticated' }
        }
      }
      const {hash} = generatePassword(password, user.salt)
      if (hash !== user.password) {
        if (this.options.blockRetry) {
          blockRecordMap[username] = blockRecordMap[username] || {}
          const blockRecord = blockRecordMap[username][ip] = blockRecordMap[username][ip] || {count: 0}
          if (blockRecord.lashHash !== hash) {
            blockRecord.count++
            if (blockRecord.count > this.options.blockRetry.retry) {
              blockRecord.blockUntil = Date.now() + this.options.blockRetry.duration * 60 * 1000
            }
            blockRecord.lashHash = hash
          }
        }
        return {
          error: {
            code: 401,
            message: 'Not authenticated'
          }
        }
      }
      if (this.options.blockRetry) {
        blockRecordMap[username] = blockRecordMap[username] || {}
        delete blockRecordMap[username][ip]
      }
      if (isJwt) {
        if (_.get(options, 'auth.secret', false)) {
          user.group = await groups.find({_id: user.group})
          user.expiredAt = this.getDateTomorrow()
          user.token = jwt.sign({
            username: user.username,
            theme: user.theme,
            expiredAt: user.expiredAt,
            password: user.password,
            group: {
              name: _.get(user, 'group.name', false),
              _id: _.get(user, 'group._id', false)
            }
          }, options.auth.secret, {expiresIn: '24h'})
        } else {
          throw new Error('No auth.secret in config')
        }
        if (res) {
          res.cookie('nodeCmsJwt', user.token, { maxAge: this.jwtTokenExpiresIn })
        }
      }
      return {
        result: user
      }
    }

    this.getDateTomorrow = function () {
      const today = new Date()
      return new Date(today.getTime() + this.jwtTokenExpiresIn).getTime()
    }

    this.authorize = function (user, resource, action, callback) {
      if (!resource) {
        return callback()
      }
      user = user || {}
      user.group = _.get(user, 'group._id', _.get(user, 'group', false)) || anonymousGroup._id
      return groups.find(user.group, (error, group) => {
        if (error) {
          return callback({
            code: 401,
            message: 'Not authorized'
          })
        }
        if (options.disableAnonymous && (anonymousGroup._id === user.group)) {
          return callback({
            code: 401,
            message: 'Not authorized'
          })
        }
        if ((group[action] || []).indexOf(resource.name) > -1) {
          return callback()
        }
        return callback({
          code: 401,
          message: 'Not authorized'
        })
      })
    }

    const self = this

    const updateAccessControl = function (mode, groups, resources, actions, callback) {
      if (!Array.isArray(groups)) {
        groups = [groups]
      }
      if (!Array.isArray(resources)) {
        resources = [resources]
      }
      if (typeof actions === 'function') {
        callback = actions
        actions = [
          'create',
          'read',
          'update',
          'remove'
        ]
      }
      if (!Array.isArray(actions)) {
        actions = [actions]
      }
      const q = queue(1)
      groups.forEach(groupName => {
        return q.defer(next => {
          self.groups.find({ name: groupName }, (error, group) => {
            if (error) {
              return next(error)
            }
            actions.forEach((actionName) => {
              let groupResources = group[actionName] || []
              resources.forEach((resource) => {
                if ((mode === 'allow') && (groupResources.indexOf(resource) === -1)) {
                  return groupResources.push(resource)
                } else if (mode === 'deny') {
                  return groupResources = groupResources.filter(item => item !== resource)
                }
              })

              return group[actionName] = groupResources
            })

            return self.groups.update(group._id, group, (error, group) => {
              if (error) {
                return next(error)
              }
              return next()
            })
          })
        })
      })

      return q.awaitAll(callback)
    }

    this.allow = (group, resource, actions, callback) => updateAccessControl('allow', group, resource, actions, callback)

    this.deny = (group, resource, actions, callback) => updateAccessControl('deny', group, resource, actions, callback)
    this.bootstrapFunctions = this.bootstrapFunctions || []
    this.bootstrapFunctions.push(function (callback) {
      const q = queue(1)
      q.defer(next => cleanGroup('admins', next))
      q.defer(next => cleanGroup('anonymous', next))
      q.defer(next => cleanUser('localAdmin', next))
      q.defer(next => {
        // check if there is anonymous group in database, otherwise create one
        return groups.find({ name: 'anonymous' }, (error, result) => {
          if (error && (error.code === 404)) {
            // logger.warn(`not found: `, error, result)
            return groups.create({
              name: 'anonymous',
              create: [],
              read: [],
              update: [],
              remove: []
            }, (error, group) => {
              if (error) {
                logger.error(error)
              }
              // logger.warn(`bootstrap auth - anonymous - created record`, group)
              anonymousGroup = group
              return next()
            })
          }
          if (error) {
            logger.error(error)
          }
          anonymousGroup = result
          // logger.warn(`bootstrap auth - anonymous - got record`, result)
          return next()
        })
      })

      q.defer((next) => {
        return groups.find({ name: 'admins' }, (error, result) => {
          if (error && (error.code === 404)) {
            return groups.create({
              name: 'admins',
              create: cms._resourceNames,
              read: cms._resourceNames,
              update: cms._resourceNames,
              remove: cms._resourceNames
            }, (error, group) => {
              if (error) {
                logger.error(error)
              }
              adminsGroup = group
              return next()
            })
          }
          return groups.update(result._id, {
            create: cms._resourceNames,
            read: cms._resourceNames,
            update: cms._resourceNames,
            remove: cms._resourceNames
          }, (error, group) => {
            if (error) {
              logger.error(error)
            }
            adminsGroup = result
            return next()
          })
        // check if there is admins group in database, otherwise create one
        })
      })

      q.defer(next =>
        // check if these is at least one admin in database, otherwise create one
        users.find({ username: 'localAdmin' }, (error, result) => {
          if (error && (error.code === 404)) {
            const localAdminData = {
              username: 'localAdmin',
              password: 'localAdmin',
              group: adminsGroup._id
            }
            if (options.dbEngine && options.dbEngine.type && options.dbEngine.type === 'xpkit') {
              localAdminData.name = localAdminData.username
            }
            return users.create(localAdminData, (error, user) => {
              if (error) {
                logger.error(error)
              }
              next()
            })
          }
          return next()
        }))
      return q.awaitAll(callback)
    })

    this.onGetLogout = (req, res, next) => {
      try {
        if (!_.get(options, 'disableJwtLogin', false) && _.get(req, 'session.nodeCmsJwt', false)) {
          delete req.session.nodeCmsJwt
          delete req.session.nodeCmsUser
          return res.status(200).clearCookie('nodeCmsJwt').send({ message: 'done', userLoggedOut: true })
        }
        return res.status(200).send({ message: 'done' })
      } catch (error) {
        next(error)
      }
    }

    this.dispatchAuth = async (req, res, next) => {
      const jwtLogin = !_.get(options, 'disableJwtLogin', false)
      const basicAuthLogin = !_.get(options, 'disableAuthentication', false)
      const hasLogin = jwtLogin || basicAuthLogin
      if (hasLogin) {
        jwtLogin ? await verifyToken(req, res, next) : await verifyBasicAuth(req, res, next)
      } else {
        next()
      }
    }

    this.onPostLogin = async (req, res) => {
      try {
        // logger.warn(`POST auth /login`)
        const {username, password} = _.get(req, 'body', {})
        const {error, result} = await this.authenticateJwt(username, password, req, res)
        // const {error, result} = await authenticate(username, password, req, res)
        if (error) {
          logger.error('Error on login:', error.message)
          return res.status(error.code).send(error)
        }
        _.set(req, 'session.nodeCmsUser', result)
        const user = await users.find({_id: req.session.nodeCmsUser._id})
        if (user && user.group) {
          req.session.nodeCmsUser.group = await groups.find({_id: user.group})
        }
      } catch (error) {
        logger.error('Error on login:', error.message)
        return res.status(403).send({message: 'Failed to log in, wrong credentials'})
      }
      const userToReturn = _.omit(req.session.nodeCmsUser, ['password'])
      _.set(req, 'session.nodeCmsJwt', _.get(req.session, 'nodeCmsUser.token', false))
      // logger.debug(`onPostLogin - will return user`, userToReturn)
      res.status(200).send(userToReturn)
    }

    const app = express()
    app.use(bodyParser.json())
    if (!_.get(options, 'disableJwtLogin', false) || !_.get(options, 'disableAuthentication', false)) {
      const routesToAuth = _.get(options, 'routesToAuth', [
        '/api/_syslog',
        '/api/system',
        '/admin/resources',
        '/resources'
      ])
      app.use(routesToAuth, this.dispatchAuth)
      app.use('/admin/logout', this.onGetLogout)
      app.post('/admin/login', this.onPostLogin)
    }
    this._app.use('/', app)
  }
}
/*
 * Expose
 */

exports = (module.exports = Authentication)
