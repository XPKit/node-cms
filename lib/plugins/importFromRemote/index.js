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
// const logger = new (require(path.join(__dirname, '..', '..', 'logger')))()
const ImportWrapper = require('../../../lib-importFromRemote/index')

class ImportFromRemoteClass {
  constructor (config, api, cms) {
    autoBind(this)

    this.config = config
    this.api = api
    this.cms = cms
    this.schemaMap = {}
    this.data = {}
    this.app = express()
    this.app.get('/status', this.onGetStatus)
    this.app.get('/execute', this.onGetExecute)
    this.init()
    this.importWrapper = new ImportWrapper()
    this.importWrapper.init(this.onUpdateProgress)
  }

  async init () {
    console.warn('importFromRemote - init')
  }

  onUpdateProgress(progress) {
    console.warn('onUpdateProgress - ', progress)
  }

  onGetStatus(req, res, next) {
    // TODO: hugo -
  }

  onGetExecute(req, res, next) {
    // TODO: hugo -
  }

  express () {
    return this.app
  }
}

const ImportFromRemotePlugin = function (options) {
  return function () {
    const plugin = new ImportFromRemoteClass(options.import, this.api(), this)
    this._app.use('/importFromRemote', plugin.express())
  }
}

exports = (module.exports = ImportFromRemotePlugin)
