const _ = require('lodash')

exports = module.exports = function (self) {
  return (req, res, next) => {
    if (!_.includes(self.cms._resourceNames, req.params.resource)) {
      return res.sendStatus(404)
    }
    req.resource = self.cms.resource(req.params.resource)
    return next()
  }
}
