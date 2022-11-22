const fs = require('fs-extra')
const _ = require('lodash')
const request = require('supertest')
const md5File = require('md5-file')
const crypto = require('crypto')

class Helper {
  constructor (port) {
    this.port = port
    this.MASTER_URL = `http://localhost:${this.port}`
    this.cms = false
  }

  importTests (name, path) {
    describe(name, async () => {
      await require(path).suite()
    })
  }

  removeFiles (...files) {
    _.each(files, file => {
      fs.removeSync(file)
    })
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
          _.set(content, 'key', _.replace(_.get(customContent, 'key', undefined), /\[INDEX\]/g, i))
        })
        console.warn(`TODO: hugo - createDummyRecords - content will be:`, content)
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

  async getRequest (url, expect = false, contentType = false, noAuth = false) {
    contentType = contentType || 'application/json; charset=utf-8'
    expect = expect || 200
    if (noAuth) {
      const {body} = await request(this.MASTER_URL)
        .get(url)
        .expect('Content-Type', contentType)
        .expect(expect)
      return body
    }
    const {body} = await request(this.MASTER_URL)
      .get(url)
      .auth('localAdmin', 'localAdmin')
      .expect('Content-Type', contentType)
      .expect(expect)
    return body
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
      this.id = crypto.randomUUID()
      this.self = new Helper(port)
    }
    return this.self
  }
}
