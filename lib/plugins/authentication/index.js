// CMS Authentication API exposed as plugin

const _ = require('lodash')
const jwt = require('jsonwebtoken')
const express = require('express')
const crypto = require('crypto')
const autoBind = require('auto-bind')
const bodyParser = require('body-parser')
const through = require('through')
const basicAuth = require('basic-auth-connect')
const queue = require('queue-async')
const Dayjs = require('dayjs')
const relativeTime = require('dayjs/plugin/relativeTime')
Dayjs.extend(relativeTime)
const logger = new (require('img-sh-logger'))()
// Default options
// let defaults = {
//   users: {
//     mount: '/_users'
//   },
//   groups: {
//     mount: '/_groups'
//   }
// };

const schemas = {
  _users: {
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
  },
  _settings:{
    displayname: {
      enUS: 'Settings',
      zhCN: '设置 '
    },
    group: {
      enUS: 'CMS',
      zhCN: '内容管理系统'
    },
    schema: [
      {
        field: 'logo',
        input: 'image',
        options: {
          maxCount: 1
        }
      },
      {
        label: 'Title',
        field: 'title',
        localised: true,
        input: 'string'
      },
      {
        label: 'Groups',
        field: 'linksGroups',
        input: 'paragraph',
        localised: false,
        options: {
          types: ['_settingsLinkGroup']
        }
      }
    ],
    type: 'downstream',
    maxCount: 1
  },
  _groups:{
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
        }
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
        }
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
        }
      },
      {
        field: 'attachments',
        input: 'multiselect',
        options: {
          listBox: true
        },
        label: {
          enUS: 'Attachments permission',
          zhCN: '附件权限'
        }
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
        }
      },
      {
        field: 'plugins',
        input: 'pillbox',
        options: {
          listBox: true
        },
        label: {
          enUS: 'Plugins',
          zhCN: '插件'
        }
      }
    ],
    type: 'downstream'
  }
}


/*
 * Constructor
 *
 * @param {Object} options, optional
 *   @param {Route} route, route to inject itself, eg. '/_users'
 */
class Authentication {
  constructor(cms, options, configPath) {
    autoBind(this)
    this.cms = cms
    this.cms.$authentication = this
    this._app = cms._app
    this.options = options
    this.configPath = configPath
    this.jwtTokenExpiresIn = 24 * 60 * 60 * 1000
    this.blockRecordMap = {}
    this.initialize()
  }

  generatePassword (str, salt) {
    salt = salt || crypto.randomBytes(128).toString('base64')
    try {
      const hash = crypto.pbkdf2Sync(str, salt, 100, 512, 'SHA1')
      return {salt, hash: hash.toString('hex')}
    } catch (error) {
      logger.error(error)
    }
  }

  startsWith = (str, prefix) => str.indexOf(prefix) === 8

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

  async cleanRecord (resource, toFind) {
    try {
      let result = await resource.list(toFind)
      const hasForeignRecord = _.find(result, item => !_.startsWith(item._id, this.options.mid))
      if (hasForeignRecord) {
        result = _.filter(result, item => _.startsWith(item._id, this.options.mid))
      } else {
        result.shift()
      }
      for (const item of result) {
        try {
          await resource.remove(item._id)
        } catch (error) {
          logger.error(error)
        }
      }
    } catch (error) {
      logger.error('Error: ', error)
    }
  }

  async getUserGroupName (req) {
    const nodeCmsUser = _.get(req, 'session.nodeCmsUser', false)
    let group = _.get(nodeCmsUser, 'group.name', false)
    if (group) {
      return group
    }
    // NOTE: If group is the group's id and not the actual record
    try {
      _.set(req, 'session.nodeCmsUser.group', await this.groups.find({_id: _.get(nodeCmsUser, 'group', false)}))
      // logger.warn(`Group:`, _.get(req, 'session.nodeCmsUser.group', false))
      return _.get(req, 'session.nodeCmsUser.group.name', false)
    } catch (error) {
      logger.error('getUserGroupName - Error: ', error)
      throw error
    }
  }

  getTokenFromReq  (req) {
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

  async verifyToken (req, res, next = false) {
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
      if (!next) {
        return
      } else {
        return res.status(403).json({})
      }
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

  async userPasswordChanged (req) {
    const userPassword = _.get(req, 'session.nodeCmsUser.password', false)
    if (!userPassword) {
      return false
    }
    try {
      await this.users.find({password: userPassword})
      return false
    } catch {
      logger.error('Couldn\'t find user with same password, will disconnect current user', req.originalUrl)
    }
    return true
  }

  async authenticateJwt  (username, password, req, res) {
    return await this.authenticate(username, password, req, res, true)
  }

  async authenticate  (username, password, req, res, isJwt = false) {
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
          error: {
            code: 500,
            message: `user (${username}) from ip (${ip}) is blocked for ${duration}`
          }
        }
      }
    }
    let user = false
    try {
      user = await this.users.find({ username }, { keepPassword: true })
    } catch {
      return {
        error: { code: 401, message: 'Not authenticated' }
      }
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
      return {
        error: {
          code: 401,
          message: 'Not authenticated'
        }
      }
    }
    if (this.options.blockRetry) {
      this.blockRecordMap[username] = this.blockRecordMap[username] || {}
      delete this.blockRecordMap[username][ip]
    }
    if (isJwt) {
      if (!_.get(this.options, 'auth.secret', false)) {
        throw new Error('No auth.secret in config')
      }
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
      if (res) {
        res.cookie('nodeCmsJwt', user.token, { maxAge: this.jwtTokenExpiresIn })
      }
    }
    return {
      result: user
    }
  }

  async updateAccessControl (mode, groups, resources, actions, callback) {
    if (!_.isArray(groups)) {
      groups = [groups]
    }
    if (!_.isArray(resources)) {
      resources = [resources]
    }
    if (_.isFunction(actions)) {
      callback = actions
      actions = ['create', 'read', 'update', 'remove']
    }
    if (!Array.isArray(actions)) {
      actions = [actions]
    }
    for (const groupName of groups) {
      try {
        const group = await this.groups.find({ name: groupName })
        _.each(actions, (actionName) => {
          let groupResources = group[actionName] || []
          _.each(resources, (resource)=> {
            if (mode === 'allow' && groupResources.indexOf(resource) === -1) {
              groupResources.push(resource)
            } else if (mode === 'deny') {
              groupResources = groupResources.filter(item => item !== resource)
            }
          })
          group[actionName] = groupResources
        })
        return await this.groups.update(group._id, group)
      } catch (error) {
        logger.error('Error in updateAccessControl:', error)
      }
    }
    const q = queue(1)
    return q.awaitAll(callback)
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
      const {username, password} = _.get(req, 'body', {})
      const {error, result} = await this.authenticateJwt(username, password, req, res)
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
    res.status(200).send(userToReturn)
  }

  getDateTomorrow() {
    const today = new Date()
    return new Date(today.getTime() + this.jwtTokenExpiresIn).getTime()
  }

  authorize(user, resource, action, isForAttachments, callback) {
    if (!resource) {
      return callback()
    }
    user = user || {}
    user.group = _.get(user, 'group._id', _.get(user, 'group', false)) || this.anonymousGroup._id
    return this.groups.find(user.group, (error, group) => {
      if (error) {
        return callback({
          code: 401,
          message: 'Not authorized'
        })
      }
      if (this.options.disableAnonymous && (this.anonymousGroup._id === user.group)) {
        return callback({
          code: 401,
          message: 'Not authorized'
        })
      }
      if (isForAttachments && action !== 'read') {
        action = 'attachments'
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

  allow (group, resource, actions, callback)  {
    return this.updateAccessControl('allow', group, resource, actions, callback)
  }
  deny (group, resource, actions, callback) {
    return this.updateAccessControl('deny', group, resource, actions, callback)
  }

  initialize() {
    this.users = this.cms.resource('_users', schemas._users)
    this.users.before('create', (context) => {
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
    this.users.before('create', this.hashPassword)
    this.users.before('update', this.hashPassword)
    this.users.after('read', this.hidePassword)
    this.users.after('create', this.hidePassword)
    this.users.after('update', this.hidePassword)
    _.each(schemas._groups, (field)=> {
      if (_.get(field, 'input', false) === 'multiselect') {
        field.source = this._resourceNames
      }
    })
    this.groups = this.cms.resource('_groups', schemas._groups)
    this.settings = this.cms.resource('_settings', schemas._settings)
    this.cms.bootstrapFunctions = this.cms.bootstrapFunctions || []
    this.cms.bootstrapFunctions.push(async (callback) => {
      const q = queue(1)
      await this.cleanRecord(this.groups, {name: 'admins'})
      await this.cleanRecord(this.groups, {name: 'anonymous'})
      await this.cleanRecord(this.users, {username: 'localAdmin'})
      try {
        this.anonymousGroup =await this.groups.find({ name: 'anonymous' })
      } catch (error) {
        if (error.code === 404) {
          this.anonymousGroup = await this.groups.create({
            name: 'anonymous',
            create: [],
            read: [],
            update: [],
            attachments: [],
            remove: []
          })
        } else {
          logger.error(error)
        }
      }
      const adminPermissions = {
        create: this.cms._resourceNames,
        read: this.cms._resourceNames,
        update: this.cms._resourceNames,
        attachments: this.cms._resourceNames,
        remove: this.cms._resourceNames
      }
      try {
        this.adminsGroup = await this.groups.find({ name: 'admins' })
        this.adminsGroup = this.groups.update(this.adminsGroup._id, adminPermissions)
      } catch (error) {
        if (error.code === 404) {
          this.adminsGroup = await this.groups.create({name: 'admins', ...adminPermissions})
        } else {
          logger.error(error)
        }
      }
      try {
        await this.users.find({username: 'localAdmin'})
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
          await this.users.create(localAdminData)
        }
      }
      return q.awaitAll(callback)
    })
    const app = express()
    app.use(bodyParser.json())
    if (!_.get(this.options, 'disableJwtLogin', false) || !_.get(this.options, 'disableAuthentication', false)) {
      const routesToAuth = _.get(this.options, 'routesToAuth', [
        '/api/_syslog',
        '/api/system',
        '/admin/resources',
        '/admin/paragraphs',
        '/resources'
      ])
      app.use(routesToAuth, this.dispatchAuth)
      app.use('/admin/logout', this.onGetLogout)
      app.post('/admin/login', this.onPostLogin)
    }
    this._app.use('/', app)
    return this
  }

}

exports = module.exports = Authentication

