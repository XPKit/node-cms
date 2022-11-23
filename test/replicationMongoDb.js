/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS201: Simplify complex destructure assignments
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CMS = require('../')
const request = require('supertest')
const Q = require('q')
const path = require('path')
const Helper = require('./helper')
const MASTER_HTTP_PORT = 4100
let helper = Helper.getInstance()

before(async () => {
  helper = Helper.getInstance(MASTER_HTTP_PORT, true)
  helper.MASTER_HTTP_PORT = MASTER_HTTP_PORT
  helper.SLAVE_HTTP_PORT = 5100
  helper.MASTER_NET_PORT = 6100
  helper.SLAVE_NET_PORT = 7100
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
    apiVersion: 2,
    tag: 'master',
    dbEngine: {
      type: 'mongodb'
    }
  })
  helper.master = {
    cms,
    request: request(helper.MASTER_URL)
  }
  cms.resource('articles', { type: 'normal' })
  await Q.ninvoke(cms, 'bootstrap')
  await Q.ninvoke(cms, 'allow', 'anonymous', 'articles')
  await Q.ninvoke(cms.express(), 'listen', MASTER_HTTP_PORT)
})

// create slave node

before(async () => {
  let cms = new CMS({
    data: path.join(__dirname, 'slave'),
    config: path.join(__dirname, 'slave.json'),
    resources: path.join(__dirname, 'resources'),
    netPort: helper.SLAVE_NET_PORT,
    apiVersion: 2,
    tag: 'slave',
    dbEngine: {
      type: 'mongodb'
    }
  })
  helper.slave = {
    cms,
    request: request(helper.SLAVE_URL)
  }
  cms.resource('articles', { type: 'normal' })
  await Q.ninvoke(cms, 'bootstrap')
  await Q.ninvoke(cms, 'allow', 'anonymous', 'articles')
  await Q.ninvoke(cms.express(), 'listen', helper.SLAVE_HTTP_PORT)
})

// populate master with content
helper.importTests('Replication', './unit/tests/replication')
