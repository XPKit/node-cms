/*
 * list resources middleware
 */

const _ = require('lodash')

exports = module.exports = function (cms) {
  return function (req, res, next) {
    res.json(_
      .chain(cms._resources)
      .map((resource, name) => _.extend({}, resource.options, {
        title: name,
        acl: null,
        cms: null,
        resource: null,
        mid: resource.options.cms.mid,
        clock: _.map(resource.json._sync.clock, (value, key) => ({
          mid: key.split(' ').pop(),
          time: value
        }))
      }))
      .value())
  }
}
