/*
 * Find resource middleware
 */

const _ = require('underscore')

exports = module.exports = function (cms) {
  return (req, res, next) => {
    if (!_.contains(cms._resourceNames, req.params.resource)) {
      return res.sendStatus(404)
    }
    req.resource = cms.resource(req.params.resource)
    return next()
  }
}
