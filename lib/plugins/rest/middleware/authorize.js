/*
 * Module dependencies
 */

const _ = require('lodash')
const basicAuth = require('basic-auth-connect')
const log4js = require('log4js')
let logger = log4js.getLogger()

/*
 * List permitted HTTP verbs
 */

const methods = {
  POST: 'create',
  GET: 'read',
  PUT: 'update',
  DELETE: 'remove'
}

/*
 * Respond with 401 Unauthorized
 */

const unauthorized = function (res) {
  res.statusCode = 401
  res.setHeader('WWW-Authenticate', 'Basic realm="Authorization Required"')
  res.end('Unauthorized')
}

/*
 * Authenticate and authorize a request against resource ACL
 */

const authorize = function (cms) {
  return [async function (req, res, next) {
    const jwtToken = _.get(req, 'cookies.nodeCmsJwt', false)
    // console.warn('authorize', jwtToken)
    if (req.headers.authorization) {
      return basicAuth(async (username, password, callback) => {
        const {error, result} = await cms.authenticate(username, password, req)
        if (error) {
          logger.error(`authorize - Error:`, error)
          return res.status(error.code).send(error)
        }
        _.set(req, 'session.nodeCmsUser', result)
        callback(error, result)
      })(req, res, next)
    }
    if (!jwtToken) { // anonymous user
      // console.warn('authorize - anonymous user detected')
      _.set(req, 'session.nodeCmsUser', {})
    } else {
      await cms.verifyToken(req, res)
      // TODO: hugo - check when trying to access a resource when currently logged in user changed his password
      // TODO: hugo - may need to re-check user
    }
    next()
  },
  function (req, res, next) {
    cms.authorize(_.get(req, 'session.nodeCmsUser', false), req.resource, methods[req.method], (error) => {
      if (error) {
        return unauthorized(res)
      }
      next()
    })
  }]
}

/*
 * Expose
 */

exports = module.exports = authorize
