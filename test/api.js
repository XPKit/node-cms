/* // eslint-disable no-unused-expressions */

const CMS = require('../')
const chai = require('chai')
const _ = require('lodash')
const Q = require('q')
const request = require('supertest')
const path = require('path')
const Helper = require('./helper')

const should = chai.should()
const helper = Helper.getInstance(8001, true)
let cms = null
const DB = path.join(__dirname, 'data')
const CONFIG = path.join(__dirname, 'cms.json')

before(() => helper.removeFiles(
  DB,
  CONFIG,
  `${__dirname}/_large_copy.png`,
  `${__dirname}/_large_copy2.png`
))

after(() => helper.removeFiles(
  DB,
  CONFIG,
  `${__dirname}/resources`,
  `${__dirname}/_large_copy.png`,
  `${__dirname}/_large_copy2.png`
))

before(async () => {
  cms = new CMS({data: DB, config: CONFIG, autoload: true})
  cms.resource('articles',
    // acl:
    //   'hello': '1111' # give 'hello' user full access to 'articles' resource
    //   '*': '0100'     # give anonymous users only read access to 'articles' resource
    {filterUnpublished: true})

  cms.resource('pages', {
    // acl:
    //   '*': '1111'   # full access to everyone, for test purposes
    schema: [
      { field: 'title', input: 'string', required: true },
      { field: 'content', input: 'string', required: true },
      { field: 'category', input: 'string', required: true, localised: false },
      { field: 'author.name', input: 'string', required: true, localised: false }
    ],
    locales: [ // enable localisation support
      'enUS',
      'ruRU',
      'zhCN'
    ]
  })
  cms.resource('querytest')
  await Q.ninvoke(cms.express(), 'listen', helper.port)
  await Q.ninvoke(cms, 'bootstrap')
})

before(() => Q.ninvoke(cms, 'allow', 'anonymous', ['pages', 'querytest']))

before(async () => {
  helper.cms = cms
})

describe('HTTP', async () => {
  describe('Resource', async () => {
    let article = null
    it('should return an empty list of articles', async () => {
      const body = await helper.getRequest('/api/articles')
      body.should.be.an('Array')
      body.should.have.length(0)
    })

    it('should create one article', async () => {
      const {body} = await request(helper.MASTER_URL)
        .post('/api/articles')
        .auth('localAdmin', 'localAdmin')
        .send({title: 'Hello World!'})
        .expect(200)
      article = body
      article.should.be.an('object')
      article._id.should.be.a('string')
      article._createdAt.should.be.a('number')
      article._updatedAt.should.be.a('number')
      article._createdAt.should.equal(article._updatedAt)
      should.not.exist(article._publishedAt)
      article.title.should.equal('Hello World!')
      article._attachments.should.be.an('array')
      article._attachments.should.have.length(0)
    })

    it('should find one article using _id', async () => {
      const {body} = await request(helper.MASTER_URL)
        .get(`/api/articles/${article._id}?unpublished=true`)
        .auth('localAdmin', 'localAdmin')
        .expect(200)
      body.should.deep.equal(_.extend({_local: true}, article))
    })

    it('should first article using empty query', async () => {
      const body = await helper.getRequest('/api/articles?unpublished=true&query={}')
      body.should.be.an('array')
      body[0].should.deep.equal(_.extend({_local: true}, article))
    })

    it('should find one article using query', async () => {
      const body = await helper.getRequest(`/api/articles?unpublished=true&query=${JSON.stringify({title: 'Hello World!'})}`)
      body.should.be.an('array')
      body[0].should.deep.equal(_.extend({_local: true}, article))
    })

    // it 'should not reflect new article in published list', (done) ->
    //   return request(helper.MASTER_URL)
    //     .get('/api/articles')
    //     .auth('localAdmin', 'localAdmin')
    //     .end (error, response) ->
    //       should.not.exist error    //
    //       docs = JSON.parse response.text
    //       docs.should.have.length 0
    //       do done

    it('should reflect new article in the list when "unpublished" is set', async () => {
      const body = await helper.getRequest('/api/articles?unpublished=true')
      body.should.have.length(1)
      const doc = body[0]
      doc._id.should.equal(article._id)
    })

    it('should reflect article in published list when "_publishedAt" is set', async () => {
      const publishedAt = Date.now()
      article._publishedAt = publishedAt
      const {body} = await request(helper.MASTER_URL)
        .put(`/api/articles/${article._id}`)
        .auth('localAdmin', 'localAdmin')
        .send(article)
        .expect(200)
      body._id.should.equal(article._id)
      body._publishedAt.should.equal(publishedAt)
      const articles = await helper.getRequest('/api/articles')
      articles.should.have.length(1)
    })

    it('should update existing article', async () => {
      const {body} = await request(helper.MASTER_URL)
        .put(`/api/articles/${article._id}`)
        .send({content: 'Some text', array: [1, 2, 3]})
        .auth('localAdmin', 'localAdmin')
        .expect(200)
      body._id.should.equal(article._id)
      body._createdAt.should.equal(article._createdAt)
      body._updatedAt.should.not.equal(article._updatedAt)
      should.exist(body.title)
      should.exist(body.content)
      should.exist(body.array)
      body.title.should.equal(article.title)
      body.content.should.equal('Some text')
    })

    it('should update existing article to remove some array element', async () => {
      const {body} = await request(helper.MASTER_URL)
        .put(`/api/articles/${article._id}`)
        .send({array: [1]})
        .auth('localAdmin', 'localAdmin')
        .expect(200)
      body._id.should.equal(article._id)
      body._createdAt.should.equal(article._createdAt)
      body._updatedAt.should.not.equal(article._updatedAt)
      should.exist(body.title)
      should.exist(body.array)
      body.array.should.deep.equal([1])
    })

    it('should delete existing article', async () => {
      const {body} = await request(helper.MASTER_URL)
        .del(`/api/articles/${article._id}`)
        .auth('localAdmin', 'localAdmin')
        .expect(200)
      body.should.equal(true)
    })

    it('should reflect deletions in the list', async () => {
      const body = await helper.getRequest('/api/articles?unpublished=true')
      body.should.have.length(0)
    })
  })

  describe('Pagination', async () => {
    let seeds = []
    before(async () => {
      seeds = await helper.createDummyRecords('/api/comments', 10)
    })

    it('should reflect changes when "limit" and "page" are set', async () => {
      let body = await helper.getRequest('/api/comments?unpublished=true&limit=5&page=1')
      body.should.have.length(5)
      body.should.deep.equal(_.map(seeds.slice(0, 5), article => _.extend({_local: true}, article)))
      body = await helper.getRequest('/api/comments?unpublished=true&limit=5&page=2')
      body.should.have.length(5)
      body.should.deep.equal(_.map(seeds.slice(5, 10), article => _.extend({_local: true}, article)))
    })

    it('should return all record when "limit" are not set', async () => {
      const body = await helper.getRequest('/api/comments?unpublished=true')
      body.should.have.length(10)
      body.should.deep.equal(_.map(seeds, article => _.extend({_local: true}, article)))
    })
  })

  helper.importTests('Attachment', './unit/attachmentsTests')
  helper.importTests('Access Control List', './unit/accessControlListTests')
  helper.importTests('Localisation', './unit/localisationTests')
  helper.importTests('Query language', './unit/queryLanguageTests')
  helper.importTests('JS', './unit/jsTests')

  describe('ResolveDependency', async () => {
    let comments = []
    let article = null
    let commentNested = null
    let articleNested = null
    before(async () => {
      const data = await helper.createRecordsForDependencyTests(cms)
      comments = data.comments
      article = data.article
      commentNested = data.commentNested
      articleNested = data.articleNested
    })

    it('should return object with dependency defined by list', async () => {
      const api = cms.api()
      const result = await api('articles', 'comments').list({_id: article._id})
      article = _.first(result)
      article.comment.should.deep.equal(_.first(comments))
      article.comments.should.deep.equal(comments)
    })

    it('should return object with dependency defined by find', async () => {
      const api = cms.api()
      const result = await api('articles', 'comments').find(article._id)
      article = result
      article.comment.should.deep.equal(_.first(comments))
      article.comments.should.deep.equal(comments)
    })

    it('should return nested object with dependency defined by find', async () => {
      const api = cms.api()
      const result = await api('articles', 'comments', 'authors').find(articleNested._id)
      articleNested = result
      articleNested.comment.should.deep.equal(commentNested)
    })

    return it('should return object with dependency defined by list with one more records', async () => {
      const api = cms.api()
      let results = await api('articles', 'comments').list()
      const numberOfRecords = results.length
      await request(helper.MASTER_URL)
        .post('/api/articles')
        .auth('localAdmin', 'localAdmin')
        .send({ content: 'test' })
        .expect(200)
      results = await api('articles', 'comments').list()
      results.length.should.equal(numberOfRecords + 1)
    })
  })
})
