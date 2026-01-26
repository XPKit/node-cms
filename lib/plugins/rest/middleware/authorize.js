const _ = require('lodash')
const basicAuth = require('basic-auth-connect')
const logger = new (require('img-sh-logger'))()

/*
 * List permitted HTTP verbs
 */
const methods = {
  POST: 'create',
  GET: 'read',
  PUT: 'update',
  DELETE: 'remove',
}

/*
 * Respond with 401 Unauthorized
 */
const unauthorized = (res) => {
  res.statusCode = 401
  res.setHeader('WWW-Authenticate', 'Basic realm="Authorization Required"')
  res.end('Unauthorized')
}

/*
 * Authenticate and authorize a request against resource
 */
const authorize = (self) => [
  async (req, res, next) => {
    const jwtToken =
      req.body.token || req.query.token || req.headers['x-access-token'] || _.get(req, 'cookies.nodeCmsJwt', false)
    if (!jwtToken && req.headers.authorization) {
      return basicAuth(async (username, password, callback) => {
        const { error, result } = await self.cms.$authentication.authenticate(username, password, req)
        if (error) {
          return res.status(error.code).send(error)
        }
        _.set(req, 'session.nodeCmsUser', result)
        callback(error, result)
      })(req, res, next)
    }
    if (!jwtToken) {
      // anonymous user
      _.set(req, 'session.nodeCmsUser', {})
    } else if ((await self.cms.$authentication.verifyToken(req, res)) === 'userLoggedOut') {
      return
    }
    next()
  },
  (req, res, next) => {
    try {
      self.cms.$authentication.authorize(
        _.get(req, 'session.nodeCmsUser', false),
        req.resource,
        methods[req.method],
        req.originalUrl.indexOf('/attachments') !== -1,
        async (error) => {
          if (error) {
            logger.error('authorize Error: ', error)
            return unauthorized(res)
          }
          let userGroup = _.get(req, 'session.nodeCmsUser.group', false)
          try {
            userGroup = _.get(await self.cms.$authentication.groups.find({ _id: userGroup }), 'name', userGroup)
          } catch (error) {
            console.error('Error:', error)
          }
          _.set(req, 'body._updatedBy', `${userGroup}~${_.get(req, 'session.nodeCmsUser.username', false)}`)
          next()
        },
      )
    } catch (error) {
      console.error('authorize Error: ', error, error.stack)
    }
  },
]

module.exports = authorize
