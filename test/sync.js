const CMS = require('../')
const chai = require('chai')
const _ = require('lodash')
const request = require('supertest')
const pAll = require('p-all')
const path = require('path')
// const md5File = require('md5-file')
chai.should()
const fs = require('fs-extra')
const Q = require('q')
const delay = require('delay')
const assert = require('assert')

const MASTER_HTTP_PORT = 8850
const SLAVE_HTTP_PORT = 9850
const MASTER_NET_PORT = 18850
const SLAVE_NET_PORT = 19850
const MASTER_URL = `http://localhost:${MASTER_HTTP_PORT}`
const SLAVE_URL = `http://localhost:${SLAVE_HTTP_PORT}`

let master = null
let slave = null
let article = null
let pushData = null

const remove = (...files) => {
  _.each(files, file => {
    fs.removeSync(file)
  })
}

const createRecord = async (machine, resource, content) => {
  const {body} = await machine.request.post(`/api/${resource}`)
    .send(content)
    .expect(200)
  return body
}

const uploadArticleAttachment = async (machine, articleId, filename, cb) => {
  const {body} = await machine.request.post(`/api/articles/${articleId}/attachments`)
    .attach('file', `${__dirname}/${filename}`)
    .expect(200)
  return body
}

const uploadArticleLocalisedAttachment = async (machine, articleId, filename, cb) => {
  const {body} = await machine.request.post(`/api/articles/${articleId}/attachments`)
    .attach('localisedFile', `${__dirname}/${filename}`)
    .field('_locale', 'enUS')
    .expect(200)
  return body
}

const removeArticleAttachment = async (machine, articleId, cb) => {
  const response = await machine.request.get(`/api/articles/${articleId}`)
  await pAll(_.map(response.body._attachments, attach => {
    return async () => {
      await machine.request.delete(`/api/articles/${articleId}/attachments/${attach._id}`)
    }
  }), {concurrency: 1})
}

const articleSchema = {
  schema: [
    {
      field: 'string',
      input: 'string',
      unique: true,
      localised: false
    },
    {
      field: 'file',
      input: 'file',
      localised: false
    },
    {
      field: 'localisedFile',
      input: 'file',
      localised: true
    }
  ],
  locales: ['enUS', 'zhCN'],
  type: 'normal'
}

// create master node
before(async () => {
  let cms = new CMS({
    data: path.join(__dirname, 'master'),
    config: path.join(__dirname, 'master.json'),
    resources: path.join(__dirname, 'resources'),
    netPort: MASTER_NET_PORT,
    apiVersion: 2,
    disableJwtLogin: false,
    auth: { secret: 'auth.jwt.secret' },
    sync: {
      resources: [
        'articles'
      ]
    },
    mode: 'normal'
  })
  master = {
    cms,
    request: request(MASTER_URL)
  }
  cms.resource('articles', articleSchema)
  await cms.bootstrap()
  await Q.ninvoke(cms, 'allow', 'anonymous', 'articles')
  await Q.ninvoke(cms, 'allow', 'anonymous', '_sync')
  await Q.ninvoke(cms.express(), 'listen', MASTER_HTTP_PORT)
})

// create slave node

before(async () => {
  let cms = new CMS({
    data: path.join(__dirname, 'slave'),
    config: path.join(__dirname, 'slave.json'),
    resources: path.join(__dirname, 'resources'),
    netPort: SLAVE_NET_PORT,
    disableJwtLogin: false,
    auth: { secret: 'auth.jwt.secret' },
    apiVersion: 2,
    sync: {
      resources: [
        'articles'
      ]
    },
    mode: 'normal'
  })
  slave = {
    cms,
    request: request(SLAVE_URL)
  }
  cms.resource('articles', articleSchema)
  await cms.bootstrap()
  await Q.ninvoke(cms, 'allow', 'anonymous', 'articles')
  await Q.ninvoke(cms, 'allow', 'anonymous', '_sync')
  await Q.ninvoke(cms.express(), 'listen', SLAVE_HTTP_PORT)
})

// populate master with content

const masterToken = 'master-token'
const slaveToken = 'slave-token'

before(async () => {
  await createRecord(master, '_sync', {
    allows: ['read', 'write'],
    local:
    {
      token: masterToken,
      url: MASTER_URL
    },
    remote:
    {
      token: slaveToken,
      url: SLAVE_URL
    }
  })
  article = await createRecord(master, 'articles', {string: 'first'})
  await uploadArticleAttachment(master, article._id, '_large.png')
  await createRecord(master, 'articles', {string: 'second'})
  await createRecord(master, 'articles', {string: 'third'})
  await createRecord(slave, '_sync', {
    allows: ['read', 'write'],
    local: {
      token: slaveToken,
      url: SLAVE_URL
    },
    remote:
    {
      token: masterToken,
      url: MASTER_URL
    }
  })
})

after(async () => {
  await remove(
    path.join(__dirname, 'master'),
    path.join(__dirname, 'master.json'),
    path.join(__dirname, 'slave'),
    path.join(__dirname, 'slave.json'),
    path.join(__dirname, '_large_copy.png'),
    path.join(__dirname, 'tmp')
  )
})

it('should not return data with wrong token', async () => {
  let response = await master.request.get('/sync/articles?token=wrong-token')
    .expect(500)
  response.body.error.should.equal('token is not match')
})

it('should get master sync data', async () => {
  let response = await master.request.get(`/sync/articles?token=${masterToken}`)
    .expect(200)
  let articles = response.body
  articles.should.have.length(3)
  pushData = articles
})

it('should push sync data to slave', async () => {
  let response
  response = await slave.request.put(`/sync/articles?token=${slaveToken}`)
    .send(pushData)
    .expect(200)
  await delay(1000)
  response = await slave.request.get(`/sync/articles?token=${slaveToken}`)
    .expect(200)
  response.body.should.have.length(3)
  const remoteArticle = _.find(response.body, {string: article.string})
  remoteArticle._attachments[0]._filename.should.equal('_large.png')
})

it('should update master aricle recod attachment and sync to slave', async () => {
  await removeArticleAttachment(master, article._id)
  await uploadArticleAttachment(master, article._id, '_small.jpg')
  await slave.request.post('/sync/articles/from/remote/to/local')
    .auth('localAdmin', 'localAdmin')
    .expect(200)
  await delay(1000 * 2)
  const response = await slave.request.get(`/sync/articles?token=${slaveToken}`)
    .expect(200)
  response.body.should.have.length(3)
  const remoteArticle = _.find(response.body, {string: article.string})
  remoteArticle._attachments.should.be.an('array').of.length(1)
  remoteArticle._attachments[0]._filename.should.equal('_small.jpg')
})

it('should sync master aricle recod localised attachment and sync to slave', async () => {
  await uploadArticleLocalisedAttachment(master, article._id, '_small.jpg')
  await slave.request.post('/sync/articles/from/remote/to/local')
    .auth('localAdmin', 'localAdmin')
    .expect(200)
  await delay(1000 * 2)
  const response = await slave.request.get(`/sync/articles?token=${slaveToken}`)
    .expect(200)
  response.body.should.have.length(3)
  const remoteArticle = _.find(response.body, {string: article.string})
  remoteArticle._attachments.should.be.an('array').of.length(2)
  remoteArticle._attachments[1]._name.should.equal('localisedFile')
  remoteArticle._attachments[1]._filename.should.equal('_small.jpg')
  assert.deepEqual(remoteArticle._attachments[1]._fields, { _locale: 'enUS' })
})
