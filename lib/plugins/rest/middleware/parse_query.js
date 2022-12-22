const _ = require('lodash')

/*
 * Parse query middleware
 */

exports = module.exports = (req, res, next) => {
  req.options = req.options || {}
  if (req.query && req.query.query) {
    try {
      req.options.query = JSON.parse(req.query.query)
      delete req.query.query
    } catch (err) {
      return next(err)
    }
  }
  _.extend(req.options, req.query)
  return next()
}
