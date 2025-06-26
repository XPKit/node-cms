/*
 * CMS Admin API exposed as plugin
 */

// const path = require('path')
// const _ = require('lodash')
const express = require('express')
// const fs = require('fs-extra')
const autoBind = require('auto-bind')
// const pAll = require('p-all')
// const os = require('os')
// const logger = new (require('img-sh-logger'))()
const ImportWrapper = require('../../../lib-importFromRemote/index')

class ImportFromRemoteClass {
  constructor (cms, options) {
    autoBind(this)
    this.cms = cms
    this.cms.$importFromRemote = this
    this.config = options.importFromRemote || options
    this.api = cms.api()
    this.schemaMap = {}
    this.data = {}
    this.initialize()
  }

  initialize() {
    this.app = express()
    this.app.get('/status', this.onGetStatus)
    this.app.get('/execute', this.onGetExecute)
    this.init()
    this.importWrapper = new ImportWrapper()
    this.importWrapper.init(this.onUpdateProgress)

    this.cms._app.use('/importFromRemote', this.app)
    return this
  }

  async init () {
    // console.warn('importFromRemote - init')
  }

  onUpdateProgress(progress) {
    console.warn('onUpdateProgress - ', progress)
  }

  onGetStatus(_req, _res, _next) {
    // TODO: hugo -
  }

  onGetExecute(_req, _res, _next) {
    // TODO: hugo -
  }

  express () {
    return this.app
  }
}

exports = module.exports = ImportFromRemoteClass
