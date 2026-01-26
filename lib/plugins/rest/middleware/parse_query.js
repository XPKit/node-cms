const _ = require('lodash')

module.exports = (req, _res, next) => {
  req.options = req.options || {}
  if (_.get(req, 'query.query', false)) {
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
