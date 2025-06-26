/*
 * CMS Replication API exposed as plugin
 */
'use strict'

// const logger = new (require('img-sh-logger'))()
const _ = require('lodash')
const autoBind = require('auto-bind')

const Replicator = require('./replicator')
const ReplicatorMongoDb = require('./replicatorMongoDb')

const defaults = {
}

class ReplicatorManager {
  constructor (cms, options) {
    autoBind(this)
    this.cms = cms
    this.cms.$replicator = this
    this.options = _.extend({}, defaults, options)
    this.initialize()
  }

  initialize() {
    if (_.get(this.cms, 'options.dbEngine.type') === 'mongodb') {
      this.replicator = new ReplicatorMongoDb(this.cms)
    } else {
      this.replicator = new Replicator(this.cms)
    }
  }
}

exports = module.exports = ReplicatorManager
