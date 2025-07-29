/*
 * list resources middleware
 */

const _ = require('lodash')

exports = module.exports = function (self) {
  return function (req, res) {
    res.json(_
      .chain(self.cms._resources)
      .map((resource, name) => _.extend({}, resource.options, {
        title: name,
        cms: null,
        resource: null,
        mid: resource.options.cms.mid
      }))
      .value())
  }
}
