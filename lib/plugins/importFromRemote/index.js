// const path = require('node:path')
const _ = require('lodash')
const express = require('express')
// const fs = require('fs-extra')
const bodyParser = require('body-parser')
// const pAll = require('p-all')
// const os = require('node:os')
// const logger = new (require('img-sh-logger'))()
const ImportWrapper = require('../../../lib-importFromRemote/index')

class ImportFromRemoteClass {
  constructor(cms, options) {
    this.cms = cms
    this.cms.$importFromRemote = this
    this.config = options.importFromRemote || options
    this.api = cms.api()
    this.schemaMap = {}
    this.data = {}
    this.importStatus = { status: 'idle', progress: 0, message: '' }
    this.initialize()
  }

  initialize = () => {
    const app = express()
    // Raise the JSON body size limit to 100mb
    app.use(bodyParser.json({ limit: '100mb' }))
    app.get('/status', this.onGetStatus)
    app.get('/execute', this.onGetExecute)
    this.init()
    this.importWrapper = new ImportWrapper()
    this.importWrapper.init(this.onUpdateProgress)
    this.cms._app.use('/importFromRemote', app)
  }

  init = async () => {
    // console.warn('importFromRemote - init')
  }

  onUpdateProgress = (progress) => {
    this.importStatus = progress
    console.warn('onUpdateProgress - ', progress)
  }

  onGetStatus = (_req, res) => {
    try {
      res.json({
        status: this.importStatus.status || 'idle',
        progress: this.importStatus.progress || 0,
        message: this.importStatus.message || '',
      })
    } catch (error) {
      console.error('Failed to get import status:', error)
      res.status(500).json({ error: 'Failed to get import status' })
    }
  }

  onGetExecute = async (_req, res) => {
    try {
      if (this.importWrapper.ongoingImport) {
        return res.status(409).json({
          status: 'busy',
          message: 'An import is already in progress.',
        })
      }
      // You may want to allow config override via req.body in the future
      this.importStatus = { status: 'starting', progress: 0, message: 'Starting import...' }
      // Launch import asynchronously, do not block the response
      try {
        await this.importWrapper.startImport(this.config, true, false, false)
        this.importStatus = { status: 'done', progress: 100, message: 'Import completed.' }
      } catch (error) {
        this.importStatus = { status: 'error', progress: 0, message: _.get(error, 'message', 'Import failed.') }
        console.error('Import failed:', error)
      }
      res.json({ status: 'started', message: 'Import process started.' })
    } catch (error) {
      console.error('Failed to start import:', error)
      res.status(500).json({ error: 'Failed to start import' })
    }
  }

  express = () => this.app
}

module.exports = ImportFromRemoteClass
