/* //eslint-disable no-unused-expressions */

const CMS = require('..')
const chai = require('chai')
const _ = require('lodash')
const { promisify } = require('util')
const request = require('supertest')
const path = require('path')
const Helper = require('./helper')

// Helper function to promisify methods
function promisifyMethod(obj, method) {
  return promisify(obj[method].bind(obj))
}

const should = chai.should()
const helper = Helper.getInstance(8004, true)

let cms = null
const DB = path.join(__dirname, 'data')
const baseConfig = require(path.join(__dirname, '../cms.json'))
const CONFIG = path.join(__dirname, 'cms.json')

const resourcesToClean = ['articles', 'authors', 'comments', 'pages', 'querytest']

before(() => helper.removeFiles(
  DB,
  CONFIG,
  `${__dirname}/_large_copy.png`,
  `${__dirname}/_large_copy2.png`
))

// eslint-disable-next-line no-undef
after(() => helper.removeFiles(
  DB,
  CONFIG,
  `${__dirname}/resources`,
  `${__dirname}/_large_copy.png`,
  `${__dirname}/_large_copy2.png`
))

before(async () => {
  let options = {
    data: DB,
    config: CONFIG,
    autoload: true,
    apiVersion: 2,
    mid: 'lajgdwf0',
    disableJwtLogin: false,
    disableAuthentication: true,
    auth: { secret: 'auth.jwt.secret' },
    dbEngine: {
      type: 'xpkit',
      url: `${process.env.XPKIT_HOST || 'localhost'}/node-cms`
    },
    xptoolkit: _.get(baseConfig, 'xptoolkit', false)
  }

  cms = new CMS(options)

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

  await promisifyMethod(cms.express(), 'listen')(helper.port)
  await cms.bootstrap()
})

before(() => {
  return promisifyMethod(cms, 'allow')('anonymous', ['pages', 'querytest'])
})

before(async () => {
  helper.cms = cms
})

describe('HTTP', async () => {
  before(async () => {
    await Promise.all(_.map(resourcesToClean, async (resource) =>
      await helper.deleteAllRecords('articles')
    ))
  })
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
        .send({name: 'article1', title: 'Hello World!'})
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
      body._id.should.equal(article._id)
      body._publishedAt.should.equal(false)
      should.exist(body._xpkitId)
      should.exist(body.created)
      should.exist(body.last_modified)
      article = body
      // body.should.deep.equal(_.extend({_local: true}, article))
    })

    it('should first article using empty query', async () => {
      const {body} = await request(helper.MASTER_URL)
        .get('/api/articles?unpublished=true&query={}')
        .auth('localAdmin', 'localAdmin')
        .expect(200)
      body.should.be.an('array')
      body[0].should.deep.equal(_.extend({_local: true}, article))
    })

    it('should find one article using query', async () => {
      const {body} = await request(helper.MASTER_URL)
        .get(`/api/articles?unpublished=true&query=${JSON.stringify({title: 'Hello World!'})}`)
        .auth('localAdmin', 'localAdmin')
        .expect(200)
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
      const publishedAt = +new Date()
      article._publishedAt = publishedAt
      const {body} = await request(helper.MASTER_URL)
        .put(`/api/articles/${article._id}`)
        .auth('localAdmin', 'localAdmin')
        .send(article)
        .expect(200)
      body._id.should.equal(article._id)
      body._publishedAt.should.equal(publishedAt)
      const result = await helper.getRequest('/api/articles')
      result.should.have.length(1)
    })

    it('should update existing article', async () => {
      const {body} = await request(helper.MASTER_URL)
        .put(`/api/articles/${article._id}`)
        .send({content: 'Some text'})
        .auth('localAdmin', 'localAdmin')
        .expect(200)
      body._id.should.equal(article._id)
      body._createdAt.should.equal(article._createdAt)
      body._updatedAt.should.not.equal(article._updatedAt)
      should.exist(body.title)
      should.exist(body.content)
      body.title.should.equal(article.title)
      body.content.should.equal('Some text')
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
    let ids = []
    let returnedIds = []
    before(async () => {
      await helper.deleteAllRecords('comments')
    })

    before(async () => {
      seeds = await helper.createDummyRecords('/api/comments', 10, { name: 'comment-[INDEX]', content: '[INDEX]' })
    })

    it('should reflect changes when "limit" and "page" are set', async () => {
      seeds = _.orderBy(seeds, ['name'], ['asc'])
      const body = await helper.getRequest('/api/comments?unpublished=true&limit=5&page=1&x__order_by=name__asc')
      body.should.have.length(5)
      ids = _.map(seeds.slice(0, 5), '_id')
      returnedIds = _.map(body, '_id')
      returnedIds.should.deep.equal(ids)
      const commentsFound = await helper.getRequest('/api/comments?unpublished=true&limit=5&page=2&x__order_by=name__asc')
      commentsFound.should.have.length(5)
      ids = _.map(seeds.slice(5, 10), '_id')
      _.map(commentsFound, '_id').should.deep.equal(ids)
    })

    it('should reture all record when "limit" are not set', async () => {
      const body = await helper.getRequest('/api/comments?unpublished=true')
      body.should.have.length(10)
      ids = _.map(seeds, '_id')
      _.map(body, '_id').should.deep.equal(ids)
    })
  })

  helper.importTests('Attachment', './unit/tests/attachments')
  helper.importTests('Access Control List', './unit/tests/accessControlList')
  helper.importTests('Localisation', './unit/tests/localisation')
  helper.importTests('Query language', './unit/tests/queryLanguage')
  helper.importTests('JS', './unit/tests/js')

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
      const results = await api('articles', 'comments').list({_id: article._id})
      article = _.first(results)
      // console.warn(`ARTICLE `, article)
      // console.warn(`COMMENTS `, comments)
      article.comment._id.should.equal(_.get(_.first(comments), '_id', false))
      const lastComment = _.last(article.comments)
      lastComment._id.should.equal(_.get(_.last(comments), '_id', false))
      // article.comments.should.deep.equal(_.rest(comments))
    })

    it('should return object with dependency defined by find', async () => {
      const api = cms.api()
      const result = await api('articles', 'comments').find(article._id)
      article = result
      article.comment._id.should.equal(_.get(_.first(comments), '_id', false))
      const lastComment = _.last(article.comments)
      lastComment._id.should.equal(_.get(_.last(comments), '_id', false))
    })

    it('should return nested object with dependency defined by find', async () => {
      const api = cms.api()
      const result = await api('articles', 'comments', 'authors').find(articleNested._id)
      articleNested = result
      articleNested.comment._id.should.equal(commentNested._id)
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
