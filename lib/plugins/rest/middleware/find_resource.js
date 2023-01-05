/*
 * Find resource middleware
 */

const _ = require('lodash')

exports = module.exports = function (cms) {
  return (req, res, next) => {
    if (!_.includes(cms._resourceNames, req.params.resource)) {
      return res.sendStatus(404)
    }
    req.resource = cms.resource(req.params.resource)
    return next()
  }
}
