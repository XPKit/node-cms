const _ = require('lodash')
/*
 * Default options
 */
/*
 * Set constructor
 */
/*
 * Constructor
 *
 * @param {Object} options, optional
 *   @param {Route} route, route to inject itself, eg. '/admin'
 */

class AnonymousReadClass {
  constructor (cms) {
    this.cms = cms
    this.api = this.cms.api()
  }
  async init () {
    let group = await this.api('_groups').find({name: 'anonymous'})
    if (!group) {
      group = await this.api('_groups').create({ name: 'anonymous', create: [], read: [], update: [], remove: [], attachments: [] })
    }
    if (!_.isEmpty(_.difference(this.cms._options.anonymousRead, group.read))) {
      const readList = _.union(group.read, this.cms._options.anonymousRead)
      await this.api('_groups').update(group._id, {read: readList})
    }
  }
}

class AnonymousReadPlugin {
  constructor (cms, _options, _configPath) {
    const anonymousReadClass = new AnonymousReadClass(cms)
    cms.bootstrapFunctions = cms.bootstrapFunctions || []
    cms.bootstrapFunctions.push(async (callback) => {
      await anonymousReadClass.init(cms)
      callback()
    })
  }
}
exports = module.exports = AnonymousReadPlugin
