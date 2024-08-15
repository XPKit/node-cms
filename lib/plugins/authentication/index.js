/*
 * CMS Authentication API exposed as plugin
 */

const _ = require('lodash')
const jwt = require('jsonwebtoken')
const express = require('express')
const crypto = require('crypto')
const bodyParser = require('body-parser')
const through = require('through')
const basicAuth = require('basic-auth-connect')
const Dayjs = require('dayjs')
const relativeTime = require('dayjs/plugin/relativeTime')
const path = require('path')
const pAll = require('p-all')
const logger = new (require(path.join(__dirname, '..', '..', 'logger')))()
const Errors = require('../../errors')

const usersResource = require('./resources/users.json')
const settingsResource = require('./resources/settings.json')
Dayjs.extend(relativeTime)

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
class Authentication extends Errors {
  constructor () {
    super()
  }
  /*
 * Init
 *
 * @param {Object} options, optional
 *   @param {Route} route, route to inject itself, eg. '/_users'
 */
  init (options) {
    this.options = options
    this.jwtTokenExpiresIn = 24 * 60 * 60 * 1000
    this.defaultAuthRoutes = [
      '/api/_syslog',
      '/api/system',
      '/admin/resources',
      '/resources'
    ]
    this.blockRecordMap = {}

    // 1. add 2 more resources (system) users, groups
    // 2. inject authentication middleware into admin, API
    // 3. filter resources, that user has access to
    // 4. need to provide json endpoint to see user available resources (chkconfig)
    // TODO: hugo - later - make usersResource configurable via resources folder
    const users = this.resource('_users', usersResource)
    users.before('create', (context) => {
      if (!context.params.object.password) {
        return context.error(this.getError(400, 'Password must be defined'))
      }
      if (!context.params.object.username) {
        return context.error(this.getError(400, 'Username must be defined'))
      }
      return context.next()
    })
    users.before('create', this.hashPassword)
    users.before('update', this.hashPassword)
    users.after('read', this.hidePassword)
    users.after('create', this.hidePassword)
    users.after('update', this.hidePassword)
    this.users = users
    const groups = this.resource('_groups', {
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
    })
    this.groups = groups
    this.anonymousGroup = null
    this.adminsGroup = null
    this.settings = this.resource('_settings', settingsResource)
    const cms = this
    this.getUserGroupName = async (req) => {
      const nodeCmsUser = _.get(req, 'session.nodeCmsUser', false)
      let group = _.get(nodeCmsUser, 'group.name', false)
      if (group) {
        return group
      }
      // NOTE: If group is the group's id and not the actual record
      try {
        _.set(req, 'session.nodeCmsUser.group', await cms.groups.find({_id: _.get(nodeCmsUser, 'group', false)}))
        // logger.warn(`Group:`, _.get(req, 'session.nodeCmsUser.group', false))
        return _.get(req, 'session.nodeCmsUser.group.name', false)
      } catch (error) {
        logger.error('getUserGroupName - Error: ', error)
        throw error
      }
    }


    this.userPasswordChanged = async (req) => {
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
    this.allow = (group, resource, actions, callback) => this.updateAccessControl('allow', group, resource, actions, callback)
    this.deny = (group, resource, actions, callback) => this.updateAccessControl('deny', group, resource, actions, callback)
    this.bootstrapFunctions = this.bootstrapFunctions || []
    this.bootstrapFunctions.push(async (callback)=> {
      await this.cleanRecord(groups, {name: 'admins'})
      await this.cleanRecord(groups, {name: 'anonymous'})
      await this.cleanRecord(users, {username: 'localAdmin'})
      await this.prepareData()
      await callback()
    })
    const app = express()
    app.use(bodyParser.json())
    if (!_.get(options, 'disableJwtLogin', false) || !_.get(options, 'disableAuthentication', false)) {
      const routesToAuth = _.get(options, 'routesToAuth', this.defaultAuthRoutes)
      app.use(routesToAuth, this.dispatchAuth)
      app.use('/admin/logout', this.onGetLogout)
      app.post('/admin/login', this.onPostLogin)
    }
    this._app.use('/', app)
  }

  getDefaultPermissions (name = false, noPermissions = false) {
    const obj = {
      create: noPermissions ? [] : this.cms._resourceNames,
      read: noPermissions ? [] : this.cms._resourceNames,
      update: noPermissions ? [] : this.cms._resourceNames,
      remove: noPermissions ? [] : this.cms._resourceNames
    }
    if (name) {
      obj.name = name
    }
    return obj
  }

  async prepareData () {
    // check if there is anonymous group in database, otherwise create one
    try {
      this.anonymousGroup = await this.groups.find({ name: 'anonymous' })
      logger.warn('bootstrap auth - anonymous - got record', this.anonymousGroup)
    } catch (error) {
      if (error.code === 404) {
        try {
          this.anonymousGroup = await this.groups.create(this.getDefaultPermissions('anonymous', true))
          logger.warn('bootstrap auth - anonymous - created record', this.anonymousGroup)
        } catch (error) {
          logger.error(error)
        }
      }
    }
    // check if there is admins group in database, otherwise create one
    try {
      this.adminsGroup = this.groups.find({ name: 'admins' })
      try {
        this.adminsGroup = await this.groups.update(this.adminsGroup._id, this.getDefaultPermissions())
      } catch (error) {
        logger.error(error)
      }
    } catch (error) {
      if (error.code === 404) {
        try {
          this.adminsGroup = this.groups.create(this.getDefaultPermissions('admins'))
        } catch (error) {
          logger.error(error)
        }
      }
    }
    // check if these is at least one admin in database, otherwise create one
    try {
      await this.users.find({ username: 'localAdmin' })
    } catch (error) {
      if (error.code === 404) {
        const localAdminData = {
          username: 'localAdmin',
          password: 'localAdmin',
          group: this.adminsGroup._id
        }
        if (this.options.dbEngine && this.options.dbEngine.type && this.options.dbEngine.type === 'xpkit') {
          localAdminData.name = localAdminData.username
        }
        try {
          await this.users.create(localAdminData)
        } catch (error) {
          logger.error(error)
        }
      }
    }
  }
  async updateAccessControl (mode, groups, resources, actions, callback) {
    if (!Array.isArray(groups)) {
      groups = [groups]
    }
    if (!Array.isArray(resources)) {
      resources = [resources]
    }
    if (typeof actions === 'function') {
      callback = actions
      actions = ['create','read','update','remove']
    }
    if (!Array.isArray(actions)) {
      actions = [actions]
    }
    try {
      await pAll(_.map(groups, groupName => {
        return async () => {
          try {
            const group = await this.groups.find({ name: groupName })
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
            await this.groups.update(group._id, group)
          } catch (error) {
            logger.error(error)
          }
        }
      }), {concurrency: 1})
    } catch (error) {
      logger.error(error)
    }
    return await callback
  }

  /*
 * helpers
 */

  getDateTomorrow () {
    const today = new Date()
    return new Date(today.getTime() + this.jwtTokenExpiresIn).getTime()
  }
  generatePassword  (str, salt) {
    salt = salt || crypto.randomBytes(128).toString('base64')
    try {
      const hash = crypto.pbkdf2Sync(str, salt, 100, 512, 'SHA1')
      return {salt, hash: hash.toString('hex')}
    } catch (error) {
      logger.error(error)
    }
  }

  startsWith (str, prefix) {
    return str.indexOf(prefix) === 8
  }

  hashPassword (context) {
    if (context.params.object.password) {
      const {salt, hash} = this.generatePassword(context.params.object.password, null)
      context.params.object.password = hash
      context.params.object.salt = salt
    }
    context.next()
  }

  hidePassword (context) {
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

  getTokenFromReq (req) {
    return req.body.token || req.query.token || req.headers['x-access-token'] || _.get(req, 'session.nodeCmsJwt') || _.get(req, 'cookies.nodeCmsJwt', false)
  }

  async getUserFromToken (req) {
    try {
      const token = this.getTokenFromReq(req)
      if (!token) {
        logger.warn('getUserFromToken - No token found')
        return {}
      }
      const decoded = jwt.verify(token, this.options.auth.secret)
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

  async authenticateJwt (username, password, req, res) {
    return await this.authenticate(username, password, req, res, true)
  }

  async authenticate (username, password, req, res, isJwt = false) {
    let ip
    if (req && !_.isFunction(req)) {
      ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    }
    if (this.options.blockRetry) {
      this.blockRecordMap[username] = this.blockRecordMap[username] || {}
      const blockRecord = this.blockRecordMap[username][ip]
      if (blockRecord && blockRecord.blockUntil && blockRecord.blockUntil > Date.now()) {
        const duration = Dayjs(blockRecord.blockUntil).fromNow(true)
        return {
          error: this.getError(500, `user (${username}) from ip (${ip}) is blocked for ${duration}`)
        }
      }
    }
    let user = false
    try {
      user = await this.users.find({ username }, { keepPassword: true })
    } catch (error) {
      return {error: this.getError(401, 'Not authenticated')}
    }
    const {hash} = this.generatePassword(password, user.salt)
    if (hash !== user.password) {
      if (this.options.blockRetry) {
        this.blockRecordMap[username] = this.blockRecordMap[username] || {}
        const blockRecord = this.blockRecordMap[username][ip] = this.blockRecordMap[username][ip] || {count: 0}
        if (blockRecord.lashHash !== hash) {
          blockRecord.count++
          if (blockRecord.count > this.options.blockRetry.retry) {
            blockRecord.blockUntil = Date.now() + this.options.blockRetry.duration * 60 * 1000
          }
          blockRecord.lashHash = hash
        }
      }
      return {error: this.getError(401, 'Not authenticated')}
    }
    if (this.options.blockRetry) {
      this.blockRecordMap[username] = this.blockRecordMap[username] || {}
      delete this.blockRecordMap[username][ip]
    }
    if (isJwt) {
      if (_.get(this.options, 'auth.secret', false)) {
        user.group = await this.groups.find({_id: user.group})
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
        }, this.options.auth.secret, {expiresIn: '24h'})
      } else {
        throw new Error('No auth.secret in config')
      }
      if (res) {
        res.cookie('nodeCmsJwt', user.token, { maxAge: this.jwtTokenExpiresIn })
      }
    }
    return {result: user}
  }

  authorize (user, resource, action, callback) {
    if (!resource) {
      return callback()
    }
    user = user || {}
    user.group = _.get(user, 'group._id', _.get(user, 'group', false)) || this.anonymousGroup._id
    return this.groups.find(user.group, (error, group) => {
      if (error || (this.options.disableAnonymous && this.anonymousGroup._id === user.group)) {
        return callback(this.getError(401, 'Not authorized'))
      }
      if ((group[action] || []).indexOf(resource.name) > -1) {
        return callback()
      }
      return callback(this.getError(401, 'Not authorized'))
    })
  }

  onGetLogout (req, res, next) {
    try {
      if (!_.get(this.options, 'disableJwtLogin', false) && _.get(req, 'session.nodeCmsJwt', false)) {
        delete req.session.nodeCmsJwt
        delete req.session.nodeCmsUser
        return res.status(200).clearCookie('nodeCmsJwt').send({ message: 'done', userLoggedOut: true })
      }
      return res.status(200).send({ message: 'done' })
    } catch (error) {
      next(error)
    }
  }

  async verifyToken (req, res, next = false) {
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
      this.checkSessionData(req)
    } catch (error) {
      logger.error('verifyToken - Error: ', error.message)
      return next ? res.status(403).json({}) : null
    }
    const token = this.getTokenFromReq(req)
    if (!token) {
      console.log(444)
      return res.status(403).json({message: 'A token is required for authentication'})
    }
    try {
      const decoded = jwt.verify(token, this.options.auth.secret)
      return next ? next() : decoded
    } catch (error) {
      logger.error('verifyToken - Error: ', error.message)
      return res.status(403).json({message: 'Invalid Token'})
    }
  }

  checkSessionData (req) {
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

  verifyBasicAuth (req, res, next = false) {
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

  async cleanRecord (resource, toFind) {
    try {
      let result = await resource.list(toFind)
      const hasForeignRecord = _.find(result, item => !this.startsWith(item._id, this.options.mid))
      if (hasForeignRecord) {
        result = _.filter(result, item => this.startsWith(item._id, this.options.mid))
      } else {
        result.shift()
      }
      await pAll(_.map(result, item => {
        return async () => {
          try {
            await resource.remove(item._id)
          } catch (error) {
            logger.error(error)
          }
        }
      }), {concurrency: 1})
    } catch (error) {
      logger.error(error)
    }
  }

  async dispatchAuth (req, res, next) {
    if (!_.get(this.options, 'disableJwtLogin', false)) {
      await this.verifyToken(req, res, next)
    } else if (!_.get(this.options, 'disableAuthentication', false)) {
      await this.verifyBasicAuth(req, res, next)
    } else {
      next()
    }
  }

  async onPostLogin (req, res) {
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
      const user = await this.users.find({_id: req.session.nodeCmsUser._id})
      if (user && user.group) {
        req.session.nodeCmsUser.group = await this.groups.find({_id: user.group})
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
}

const AuthenticationPlugin = function (options) {
  return function () {
    return new Authentication(options, this.api(), this)
  }
}

exports = (module.exports = AuthenticationPlugin)
