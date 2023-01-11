/*
 * Module dependencies
 */

const _ = require('lodash')
const basicAuth = require('basic-auth-connect')
const path = require('path')
const logger = new (require(path.join(__dirname, '..', '..', '..', 'logger')))()

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
    const jwtToken = req.body.token || req.query.token || req.headers['x-access-token'] || _.get(req, 'cookies.nodeCmsJwt', false)
    if (!jwtToken && req.headers.authorization) {
      return basicAuth(async (username, password, callback) => {
        const {error, result} = await cms.authenticate(username, password, req)
        if (error) {
          // logger.error(`authorize - Error:`, error)
          return res.status(error.code).send(error)
        }
        // logger.warn(`session.nodeCmsUser is now: `, result)
        _.set(req, 'session.nodeCmsUser', result)
        callback(error, result)
      })(req, res, next)
    }
    if (!jwtToken) { // anonymous user
      // logger.warn('authorize - anonymous user detected')
      _.set(req, 'session.nodeCmsUser', {})
    } else {
      if (await cms.verifyToken(req, res) === 'userLoggedOut') {
        return
      }
    }
    next()
  },
  function (req, res, next) {
    cms.authorize(_.get(req, 'session.nodeCmsUser', false), req.resource, methods[req.method], (error) => {
      if (error) {
        logger.error(`authorize Error: `, error)
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
