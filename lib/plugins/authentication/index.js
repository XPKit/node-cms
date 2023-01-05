/* eslint-disable standard/no-callback-literal */
/*
 * CMS Authentication API exposed as plugin
 */

/*
 * Module dependencies
 */

const _ = require('lodash')
const crypto = require('crypto')
const through = require('through')
const queue = require('queue-async')
const humanizeDuration = require('humanize-duration')

const generatePassword = function (str, salt, cb) {
  salt = salt || crypto.randomBytes(128).toString('base64')
  return crypto.pbkdf2(str, salt, 100, 512, 'SHA1', (error, hash) => {
    if (error) {
      console.error(error)
    }
    cb(salt, hash.toString('hex'))
  })
}

/*
 * Set constructor
 */

/*
 * Default options
 */

// var defaults = {
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

const startsWith = (str, prefix) => str.indexOf(prefix) === 8

const hashPassword = function (context) {
  if (context.params.object.password) {
    generatePassword(context.params.object.password, null, (salt, hash) => {
      context.params.object.password = hash
      context.params.object.salt = salt
      context.next()
    })
  } else {
    context.next()
  }
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
  // var opts = _.extend({}, defaults, options);
  return function () {
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
                console.error(error)
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
                console.error(error)
              }
              return next()
            })))
        return q.awaitAll(next)
      })

    const authenticate = this.authenticate = (username, password, req, callback) => {
      let ip
      if (req && !_.isFunction(req)) {
        ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
      }
      if (_.isUndefined(callback) && _.isFunction(req)) {
        callback = req
      }

      if (this.options.blockRetry) {
        blockRecordMap[username] = blockRecordMap[username] || {}
        const blockRecord = blockRecordMap[username][ip]
        if (blockRecord && blockRecord.blockUntil && blockRecord.blockUntil > Date.now()) {
          const duration = humanizeDuration(blockRecord.blockUntil - Date.now(), { round: true })
          return callback({
            code: 500,
            message: `user (${username}) from ip (${ip}) is blocked in ${duration}`
          })
        }
      }

      users.find({ username }, { keepPassword: true }, (error, user) => {
        if (error) {
          // return callback({ code: 401, message: 'Not authenticated' })
          return callback(null, {
            username,
            group: authenticate._id
          })
        }
        return generatePassword(password, user.salt, (salt, hash) => {
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
            return callback({
              code: 401,
              message: 'Not authenticated'
            })
          }
          if (this.options.blockRetry) {
            blockRecordMap[username] = blockRecordMap[username] || {}
            delete blockRecordMap[username][ip]
          }
          return callback(null, user)
        })
      })
    }

    this.authorize = function (user, resource, action, callback) {
      if (!resource) {
        return callback()
      }
      user.group = user.group || anonymousGroup._id
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
            // console.warn(`not found: `, error, result)
            return groups.create({
              name: 'anonymous',
              create: [],
              read: [],
              update: [],
              remove: []
            }, (error, group) => {
              if (error) {
                console.error(error)
              }
              // console.warn(`bootstrap auth - anonymous - created record`, group)
              anonymousGroup = group
              return next()
            })
          }
          if (error) {
            console.error(error)
          }
          anonymousGroup = result
          // console.warn(`bootstrap auth - anonymous - got record`, result)
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
                console.error(error)
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
              console.error(error)
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
                console.error(error)
              }
              next()
            })
          }
          return next()
        }))
      return q.awaitAll(callback)
    })
  }
}
/*
 * Expose
 */

exports = (module.exports = Authentication)
