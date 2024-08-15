/*
 * CMS Replication API exposed as plugin
 */
'use strict'

const _ = require('lodash')

const Replicator = require('./replicator')
const ReplicatorMongoDb = require('./replicatorMongoDb')

/*
 * Constructor
 *
 * @param {Object} options, optional
 *   @param {Route} route, route to inject itself, eg. '/api'
 */
function ReplicatorWrapper () {
  return function plugin () {
    const cms = this
    if (_.get(cms, 'options.dbEngine.type') === 'mongodb') {
      this.replicator = new ReplicatorMongoDb(cms)
    } else {
      this.replicator = new Replicator(cms)
    }
  }
}

exports = module.exports = ReplicatorWrapper
