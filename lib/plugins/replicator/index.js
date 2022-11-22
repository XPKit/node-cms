/* eslint-disable standard/no-callback-literal */
/*
 * CMS Replication API exposed as plugin
 */

/*
 * Module dependencies
 */

'use strict'

const log4js = require('log4js')
const _ = require('lodash')

const Replicator = require('./replicator')
const ReplicatorMongoDb = require('./replicatorMongoDb')

let logger = log4js.getLogger()
logger.level = log4js.levels.DEBUG
/*
 * Constructor
 *
 * @param {Object} options, optional
 *   @param {Route} route, route to inject itself, eg. '/api'
 */

function ReplicatorWrapper (options) {
  return function plugin () {
    const cms = this

    if (_.get(cms, 'options.dbEngine.type') === 'mongodb') {
      this.replicator = new ReplicatorMongoDb(cms)
    } else {
      this.replicator = new Replicator(cms)
    }
  }
}

/*
 * Expose
 */

exports = module.exports = ReplicatorWrapper
