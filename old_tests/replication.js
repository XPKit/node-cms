const CMS = require('..')
const express = require('express')
const request = require('supertest')
const Q = require('q')
const path = require('path')
const Helper = require('./helper')
const MASTER_HTTP_PORT = 4000
let helper = Helper.getInstance()

before(async () => {
  helper = Helper.getInstance(MASTER_HTTP_PORT, true)
  helper.MASTER_HTTP_PORT = MASTER_HTTP_PORT
  helper.SLAVE_HTTP_PORT = 5000
  helper.MASTER_NET_PORT = 6000
  helper.SLAVE_NET_PORT = 7000
  helper.MASTER_URL = `http://localhost:${helper.MASTER_HTTP_PORT}`
  helper.SLAVE_URL = `http://localhost:${helper.SLAVE_HTTP_PORT}`

  helper.removeFiles(
    path.join(__dirname, 'master'),
    path.join(__dirname, 'master.json'),
    path.join(__dirname, 'slave'),
    path.join(__dirname, 'slave.json'),
    path.join(__dirname, '_large_copy.png'),
    path.join(__dirname, 'tmp')
  )
})

// create master node
before(async () => {
  let cms = new CMS({
    data: path.join(__dirname, 'master'),
    config: path.join(__dirname, 'master.json'),
    resources: path.join(__dirname, 'resources'),
    netPort: helper.MASTER_NET_PORT,
    webserver: {
      port: 9090
    },
    disableAnonymous: false
  })
  const authPlugin = cms.use(require('../lib/plugins/authentication'))
  cms._plugins.authentication = authPlugin
  helper.master = {
    cms,
    request: request(helper.MASTER_URL)
  }
  cms.resource('articles', { type: 'normal' })
  await cms.bootstrap()
  // Enable anonymous access for 'articles' resource (after bootstrap)
  await cms._plugins.authentication.allow('anonymous', 'articles', ['read', 'create', 'update', 'remove', 'attachments'])
  await Q.ninvoke(cms.express(), 'listen', MASTER_HTTP_PORT)
})

// create slave node
before(async () => {
  let cms = new CMS({
    data: path.join(__dirname, 'slave'),
    config: path.join(__dirname, 'slave.json'),
    resources: path.join(__dirname, 'resources'),
    netPort: helper.SLAVE_NET_PORT,
    webserver: {
      port: 9091
    },
    disableAnonymous: false
  })
  if (!helper.slave) helper.slave = {}
  helper.slave.cms = cms
  const authPlugin = cms.use(require('../lib/plugins/authentication'))
  cms._plugins.authentication = authPlugin
  helper.slave = {
    app: express(),
    cms,
    request: request(helper.SLAVE_URL)
  }
  helper.slave.cms.resource('articles', { type: 'normal' })
  await helper.slave.cms.bootstrap()
  // Enable anonymous access for 'articles' resource (after bootstrap)
  await helper.slave.cms._plugins.authentication.allow('anonymous', 'articles', ['read', 'create', 'update', 'remove', 'attachments'])

  await Q.ninvoke(cms.express(), 'listen', helper.SLAVE_HTTP_PORT)
})

// populate master with content
helper.importTests('Replication', './unit/tests/replication')
