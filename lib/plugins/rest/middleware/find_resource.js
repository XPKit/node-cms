/*
 * Find resource middleware
 */

import _ from 'lodash'

export default function (self) {
  return (req, res, next) => {
    if (!_.includes(self.cms._resourceNames, req.params.resource)) {
      return res.sendStatus(404)
    }
    req.resource = self.cms.resource(req.params.resource)
    return next()
  }
}
