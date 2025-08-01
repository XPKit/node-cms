import _ from 'lodash'

/*
 * Parse query middleware
 */

export default (req, res, next) => {
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
