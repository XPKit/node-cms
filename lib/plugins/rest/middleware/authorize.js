/*
 * Module dependencies
 */

const basicAuth = require('basic-auth-connect')
const _ = require('lodash')

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
    console.warn('authorize', req.headers.authorization)
    if (!req.headers.authorization) { // anonymous user
      console.warn('anonymous user detected')
      req.user = {}
      next()
    } else {
      const {username, password} = _.get(req, 'body', {})
      const {error, result} = await cms.authenticate(username, password, req)
      if (error && error.code === 500) {
        return res.status(500).send(error)
      }
      _.set(req, 'session.nodeCmsUser', result)
    }
  },
  function (req, res, next) {
    cms.authorize(req.user, req.resource, methods[req.method], (error) => {
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
