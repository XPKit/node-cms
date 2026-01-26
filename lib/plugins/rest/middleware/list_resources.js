const _ = require('lodash')

module.exports = (self) => (_req, res) => {
  res.json(
    _.chain(self.cms._resources)
      .map((resource, name) =>
        _.extend({}, resource.options, {
          title: name,
          cms: null,
          resource: null,
          mid: resource.options.cms.mid,
        }),
      )
      .value(),
  )
}
