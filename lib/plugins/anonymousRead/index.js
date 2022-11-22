/*
 * CMS Admin API exposed as plugin
 */

/*
 * Module dependencies
 */

const path = require('path')
const _ = require('lodash')
const express = require('express')
const autoBind = require('auto-bind')
const os = require('os')
const log4js = require('log4js')

const logger = log4js.getLogger()
logger.level = log4js.levels.DEBUG
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
  constructor (config, api, cms) {
    autoBind(this)

    this.config = config
    this.api = api
    this.cms = cms
    this.schemaMap = {}
    this.data = {}
  }
  async init () {
    const group = await this.api('_groups').find({name: 'anonymous'})
    if (!_.isEmpty(_.difference(this.cms._options.anonymousRead, group.read))) {
      const readList = _.union(group.read, this.cms._options.anonymousRead)
      await this.api('_groups').update(group._id, {read: readList})
    }
  }
}

const AnonymousReadPlugin = function (options) {
  return function () {
    const anonymousReadClass = new AnonymousReadClass(options.import, this.api(), this)
    this.bootstrapFunctions = this.bootstrapFunctions || []
    this.bootstrapFunctions.push(async (callback) => {
      await anonymousReadClass.init()
      callback()
    })
  }
}

/*
 * Expose
 */

exports = (module.exports = AnonymousReadPlugin)
