const fs = require('fs-extra')
const _ = require('lodash')
const path = require('path')
const request = require('supertest')
const md5File = require('md5-file')
const crypto = require('crypto')
const uuid = require('uuid/v4')

class Helper {
  constructor (port) {
    this.port = port
    this.MASTER_URL = `http://localhost:${this.port}`
    this.cms = false

    // For replication unit tests
    this.master = null
    this.slave = null
    this.article = null
    this.article2 = null
  }

  importTests (name, path) {
    describe(name, async () => {
      await require(path).suite()
    })
  }

  async login (user, expect = 200) {
    const {body, headers} = await request(this.MASTER_URL)
      .post('/admin/login')
      .send(user)
      .expect(expect)
    return {user: body, cookie: _.get(headers, 'set-cookie')}
  }

  async logout (user, expect = 200) {
    console.warn(`Helper logout`)
    await request(this.MASTER_URL)
      .get('/admin/logout')
      .expect(expect)
  }

  removeFiles (...files) {
    _.each(files, file => {
      fs.removeSync(file)
    })
  }

  async createArticle (machine, content) {
    const {body} = await machine.request.post('/api/articles')
      .send(content)
      .expect(200)
    return body
  }

  async uploadArticleAttachment (machine, articleId, filename) {
    const {body} = await machine.request.post(`/api/articles/${articleId}/attachments`)
      .attach('file', path.join(__dirname, filename))
      .expect(200)
    return body
  }

  async compareChecksumForArticle (machine, articleId, attachment, filename) {
    const tmpPath = path.join(__dirname, 'tmp')
    const filePath = path.join(__dirname, filename)
    const {body} = await machine.request
      .get(`/api/articles/${articleId}/attachments/${attachment._id}`)
      .expect(200)
      .expect('Content-Type', attachment._contentType)
    fs.writeFileSync(tmpPath, body)
    let hex = await md5File(tmpPath)
    hex.should.have.length.above(0)
    let origin = await md5File(filePath)
    hex.should.equal(origin)
  }

  async compareChecksum (srcFile, distFile) {
    const hex = await md5File(`${__dirname}/${srcFile}`)
    hex.should.have.length.above(0)
    const origin = await md5File(`${__dirname}/${distFile}`)
    hex.should.equal(origin)
  }

  async createDummyRecords (url, numberOfRecords, customContent = false) {
    const createdRecords = []
    for (let i = 1; i <= numberOfRecords; i++) {
      let content = customContent ? {} : {content: i}
      if (customContent) {
        _.each(customContent, (val, key) => {
          _.set(content, key, _.replace(val, /\[INDEX\]/g, i))
        })
      }
      const {body} = await request(this.MASTER_URL)
        .post(url)
        .auth('localAdmin', 'localAdmin')
        .set('Content-Type', 'application/json')
        .send(content)
        .expect(200)
      createdRecords.push(body)
    }
    return createdRecords
  }

  async createRecordsForDependencyTests (cms) {
    const api = cms.api()

    const resourcesToDelete = ['authors', 'articles', 'comments']
    for (let i = 0; i < resourcesToDelete.length; i++) {
      await this.deleteAllRecords(resourcesToDelete[i])
    }
    const comments = []
    const authorNested = await api('authors').create({title: 'author-nested'})
    const commentNested = await api('comments').create({title: 'comment-nested', author: authorNested._id})
    commentNested.author = authorNested
    const articleNested = await api('articles').create({title: 'article-nested', comment: commentNested._id})
    for (let i = 1; i <= 3; i++) {
      const result = await api('comments').create({title: `comment-${i}`})
      comments.push(_.extend(result))
    }
    const commentsIds = _.map(comments, '_id')
    const obj = {
      string: 'article01',
      comment: _.first(commentsIds),
      comments: commentsIds,
      enUS: {
        localizedComment: _.first(commentsIds),
        localizedComments: commentsIds
      }
    }
    const article = await api('articles').create(obj)
    return {article, articleNested, comments, commentNested}
  }

  async runQuery (query, wantedLength = -1) {
    const {body} = await request(this.MASTER_URL)
      .get('/api/querytest')
      .query({ query: JSON.stringify(query), unpublished: true })
    if (wantedLength !== -1) {
      return body.should.have.length(wantedLength)
    }
    return body
  }

  async getRequest (url, expect = 200, contentType = false, basicAuth = true, jwtToken = false) {
    contentType = contentType || 'application/json; charset=utf-8'
    if (!jwtToken && !basicAuth) {
      const {body} = await request(this.MASTER_URL)
        .get(url)
        .expect('Content-Type', contentType)
        .expect(expect)
      return body
    }
    if (jwtToken) {
      const {body} = await request(this.MASTER_URL)
        .get(url)
        .set('Cookie', [jwtToken])
        .expect('Content-Type', contentType)
        .expect(expect)
      return body
    } else if (basicAuth) {
      const {body} = await request(this.MASTER_URL)
        .get(url)
        .auth('localAdmin', 'localAdmin')
        .expect('Content-Type', contentType)
        .expect(expect)
      return body
    }
  }

  async deleteAllRecords (resource) {
    const {body} = await request(this.MASTER_URL)
      .get(`/api/${resource}`)
      .auth('localAdmin', 'localAdmin')
    const recordsToDelete = body
    for (let index = 0; index < recordsToDelete.length; index++) {
      await request(this.MASTER_URL)
        .del(`/api/${resource}/${recordsToDelete[index]._id}`)
        .auth('localAdmin', 'localAdmin')
    }
  }
}

module.exports = {
  self: null,
  id: null,
  getInstance (port, forceInit = false) {
    if (this.self === null || forceInit) {
      if (_.isFunction(crypto.randomUUID)) {
        this.id = crypto.randomUUID()
      } else {
        this.id = uuid()
      }
      this.self = new Helper(port)
    }
    return this.self
  }
}
