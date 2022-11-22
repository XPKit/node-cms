/*
 * Module dependencies
 */

const basicAuth = require('basic-auth-connect')

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
 * Authneticate and authorize a request against resource ACL
 */

const authorize = function (cms) {
  return [function (req, res, next) {
    if (!req.headers.authorization) { // anonymous user
      req.user = {}
      next()
    } else {
      basicAuth((username, password, callback) => {
        cms.authenticate(username, password, req, (error, result) => {
          if (error && error.code === 500) {
            res.status(500).send(error)
            return
          }
          callback(error, result)
        })
      })(req, res, next)
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
