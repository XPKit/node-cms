/* //eslint-disable no-unused-expressions */

const CMS = require('../')
const chai = require('chai')
const _ = require('lodash')
const fs = require('fs-extra')
const Q = require('q')
const request = require('supertest')
const queue = require('queue-async')
const path = require('path')
const md5File = require('md5-file')

const should = chai.should()

const MASTER_HTTP_PORT = 8002
const MASTER_URL = `http://localhost:${MASTER_HTTP_PORT}`

let cms = null

const DB = path.join(__dirname, 'data')
const CONFIG = path.join(__dirname, 'cms.json')

const remove = (...files) => {
  _.each(files, file => {
    fs.removeSync(file)
  })
}

const compareChecksum = async (srcFile, distFile) => {
  const hex = await md5File(`${__dirname}/${srcFile}`)
  hex.should.have.length.above(0)

  const origin = await md5File(`${__dirname}/${distFile}`)
  hex.should.equal(origin)
}

before(() => remove(
  DB,
  CONFIG,
  `${__dirname}/_large_copy.png`,
  `${__dirname}/_large_copy2.png`
))

after(() => remove(
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
    dbEngine: {
      type: 'mongodb',
      url: 'localhost/node-cms'
    }
  }

  try {
    console.warn(`before !`)
    cms = new CMS(options)
    console.warn(`after !`)
  } catch (error) {
    throw error
  }

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

  await Q.ninvoke(cms.express(), 'listen', MASTER_HTTP_PORT)
  await Q.ninvoke(cms, 'bootstrap')
})

before(() => {
  return Q.ninvoke(cms, 'allow', 'anonymous', ['pages', 'querytest'])
})

describe('HTTP', () => {
  describe('Resource', () => {
    let article = null

    it('should return an empty list of articles', () => {
      return request(MASTER_URL)
        .get('/api/articles')
        .auth('localAdmin', 'localAdmin')
        .expect(200)
        .then(({body}) => {
          body.should.be.an('Array')
          body.should.have.length(0)
        })
    })

    it('should create one article', () => {
      return request(MASTER_URL)
        .post('/api/articles')
        .auth('localAdmin', 'localAdmin')
        .send({title: 'Hello World!'})
        .expect(200)
        .then(({body}) => {
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
    })

    it('should find one article using _id', () => {
      return request(MASTER_URL)
        .get(`/api/articles/${article._id}?unpublished=true`)
        .auth('localAdmin', 'localAdmin')
        .expect(200)
        .then(({body}) => {
          body.should.deep.equal(_.extend({_local: true}, article))
        })
    })

    it('should first article using empty query', () => {
      return request(MASTER_URL)
        .get('/api/articles?unpublished=true&query={}')
        .auth('localAdmin', 'localAdmin')
        .expect(200)
        .then(({body}) => {
          body.should.be.an('array')
          body[0].should.deep.equal(_.extend({_local: true}, article))
        })
    })

    it('should find one article using query', () => {
      return request(MASTER_URL)
        .get(`/api/articles?unpublished=true&query=${JSON.stringify({title: 'Hello World!'})}`)
        .auth('localAdmin', 'localAdmin')
        .expect(200)
        .then(({body}) => {
          body.should.be.an('array')
          body[0].should.deep.equal(_.extend({_local: true}, article))
        })
    })

    // it 'should not reflect new article in published list', (done) ->
    //   return request(MASTER_URL)
    //     .get('/api/articles')
    //     .auth('localAdmin', 'localAdmin')
    //     .end (error, response) ->
    //       should.not.exist error    //
    //       docs = JSON.parse response.text
    //       docs.should.have.length 0
    //       do done

    it('should reflect new article in the list when "unpublished" is set', () => {
      return request(MASTER_URL)
        .get('/api/articles?unpublished=true')
        .auth('localAdmin', 'localAdmin')
        .expect(200)
        .then(({body}) => {
          body.should.have.length(1)
          const doc = body[0]
          doc._id.should.equal(article._id)
        })
    })

    it('should reflect article in published list when "_publishedAt" is set', () => {
      const publishedAt = Date.now()
      article._publishedAt = publishedAt
      return request(MASTER_URL)
        .put(`/api/articles/${article._id}`)
        .auth('localAdmin', 'localAdmin')
        .send(article)
        .expect(200)
        .then(({body}) => {
          body._id.should.equal(article._id)
          body._publishedAt.should.equal(publishedAt)
          return request(MASTER_URL)
            .get('/api/articles')
            .auth('localAdmin', 'localAdmin')
            .expect(200)
            .then(({body}) => {
              body.should.have.length(1)
            })
        })
    })

    it('should update existing article', () => {
      return request(MASTER_URL)
        .put(`/api/articles/${article._id}`)
        .send({content: 'Some text'})
        .auth('localAdmin', 'localAdmin')
        .expect(200)
        .then(({body}) => {
          body._id.should.equal(article._id)
          body._createdAt.should.equal(article._createdAt)
          body._updatedAt.should.not.equal(article._updatedAt)
          should.exist(body.title)
          should.exist(body.content)
          body.title.should.equal(article.title)
          body.content.should.equal('Some text')
        })
    })

    it('should delete existing article', () => {
      return request(MASTER_URL)
        .del(`/api/articles/${article._id}`)
        .auth('localAdmin', 'localAdmin')
        .expect(200)
        .then(({body}) => {
          body.should.equal(true)
        })
    })

    it('should reflect deletions in the list', () => {
      return request(MASTER_URL)
        .get('/api/articles?unpublished=true')
        .auth('localAdmin', 'localAdmin')
        .expect(200)
        .then(({body}) => {
          body.should.have.length(0)
        })
    })
  })

  describe('Pagination', () => {
    const seeds = []

    before(() => {
      let funcs = _.map(_.range(1003), index => {
        return () => request(MASTER_URL)
          .post('/api/comments')
          .auth('localAdmin', 'localAdmin')
          .set('Content-Type', 'application/json')
          .send({ content: index })
          .expect(200)
          .then(({body}) => {
            seeds.push(body)
          })
      })
      return funcs.reduce(Q.when, Q())
    })

    it('should reflect changes when "limit" and "page" are set', () => {
      return request(MASTER_URL)
        .get('/api/comments?unpublished=true&limit=10&page=1')
        .auth('localAdmin', 'localAdmin')
        .expect(200)
        .then(({body}) => {
          body.should.have.length(10)
          body.should.deep.equal(_.map(seeds.slice(0, 10), article => _.extend({_local: true}, article)))
          return request(MASTER_URL)
            .get('/api/comments?unpublished=true&limit=10&page=10')
            .auth('localAdmin', 'localAdmin')
            .expect(200)
            .then(({body}) => {
              body.should.have.length(10)
              body.should.deep.equal(_.map(seeds.slice(90, 100), article => _.extend({_local: true}, article)))
            })
        })
    })

    it('should reture all record when "limit" are not set', () => {
      return request(MASTER_URL)
        .get('/api/comments?unpublished=true')
        .auth('localAdmin', 'localAdmin')
        .expect(200)
        .then(({body}) => {
          body.should.have.length(1003)
          body.should.deep.equal(_.map(seeds, article => _.extend({_local: true}, article)))
        })
    })
  })

  describe('Attachment', () => {
    let article = null
    let attachment = null

    before(() => {
      return request(MASTER_URL)
        .post('/api/articles')
        .send({title: 'Book'})
        .auth('localAdmin', 'localAdmin')
        .expect(200)
        .then(({body}) => {
          article = body
        })
    })

    it('should upload a new attachment', () => {
      return request(MASTER_URL)
        .post(`/api/articles/${article._id}/attachments`)
        .attach('file', `${__dirname}/_large.png`)
        .auth('localAdmin', 'localAdmin')
        .expect(200)
        .then(({body}) => {
          attachment = body
          attachment._id.should.be.a('string')
          attachment._filename.should.equal('_large.png')
          attachment._contentType.should.equal('image/png')
          attachment._fields.should.be.an('object')
          attachment._createdAt.should.be.a('number')
          attachment._updatedAt.should.be.a('number')
          attachment._createdAt.should.equal(attachment._updatedAt)
        })
    })

    it('should be able to retrieve attachment immediately', () => {
      return request(MASTER_URL)
        .post(`/api/articles/${article._id}/attachments`)
        .attach('file', `${__dirname}/_large.png`)
        .auth('localAdmin', 'localAdmin')
        .expect(200)
        .then(({body}) => {
          return request(MASTER_URL)
            .get(`/api/articles/${article._id}/attachments/${body._id}`)
            .auth('localAdmin', 'localAdmin')
            .expect(200)
            .then(({body}) => {
              fs.writeFileSync(`${__dirname}/_large_copy2.png`, body)
              return compareChecksum('_large.png', '_large_copy2.png')
            })
        })
    })

    it('should upload a new attachment and have locale specified', () => {
      return request(MASTER_URL)
        .post(`/api/articles/${article._id}/attachments`)
        .auth('localAdmin', 'localAdmin')
        .field('_locale', 'enUS')
        .attach('file', `${__dirname}/_large.png`)

        .expect(200)
        .then(({body}) => {
          body._id.should.be.a('string')
          body._filename.should.equal('_large.png')
          body._contentType.should.equal('image/png')
          body._fields.should.be.an('object')
          body._fields._locale.should.equal('enUS')
          body._createdAt.should.be.a('number')
          body._updatedAt.should.be.a('number')
          body._createdAt.should.equal(body._updatedAt)
        })
    })

    it('should download a new attachment', () => {
      return request(MASTER_URL)
        .get(`/api/articles/${article._id}/attachments/${attachment._id}`)
        .auth('localAdmin', 'localAdmin')
        .expect('Content-Type', 'image/png')
        .expect(200)
        .then(({body}) => {
          fs.writeFileSync(`${__dirname}/_large_copy.png`, body)
          return compareChecksum('_large.png', '_large_copy.png')
        })
    })

    it('should yield an error when wrong record id is specified', () => {
      return request(MASTER_URL)
        .get(`/api/articles/${article._id}/attachments`)
        .auth('localAdmin', 'localAdmin')
        .expect(404)
    })

    it('should yield an error when attachment with this id is not found in record', () => {
      return request(MASTER_URL)
        .get(`/api/articles/${article._id}/attachments/123`)
        .auth('localAdmin', 'localAdmin')
        .expect(404)
    })

    it('should delete an attachment', () => {
      return request(MASTER_URL)
        .del(`/api/articles/${article._id}/attachments/${attachment._id}`)
        .auth('localAdmin', 'localAdmin')
        .expect(200)
        .then(({body}) => {
          body.should.equal(true)
        })
    })

    it('should remove attachment link from parent document', () => {
      return request(MASTER_URL)
        .get(`/api/articles/${article._id}`)
        .auth('localAdmin', 'localAdmin')
        .expect(200)
        .then(({body}) => {
          body._attachments.should.have.length(2)
        })
    })

    return it('should remove document with attachment', () => {
      return request(MASTER_URL)
        .post(`/api/articles/${article._id}/attachments`)
        .auth('localAdmin', 'localAdmin')
        .field('_locale', 'enUS')
        .attach('file', `${__dirname}/_large.png`)
        .expect(200)
        .then(({body}) => {
          return request(MASTER_URL)
            .del(`/api/articles/${article._id}`)
            .auth('localAdmin', 'localAdmin')
            .expect(200)
            .then(({body}) => {
              body.should.equal(true)
            })
        })
    })
  })

  describe('Access Control List', () => {
    let article = null
    let attachment = null

    // allow anonymous read access (articles)

    before(() => {
      return Q.ninvoke(cms.groups, 'find', {name: 'anonymous'})
        .then(group => {
          group.read.push('articles')
          return Q.ninvoke(cms.groups, 'update', group._id, {read: group.read})
        })
    })

    before(() => {
      return request(MASTER_URL)
        .post('/api/articles')
        .auth('localAdmin', 'localAdmin')
        .send({title: 'testing ACL'})
        .expect(200)
        .then(({body}) => {
          article = body
          return request(MASTER_URL)
            .post(`/api/articles/${article._id}/attachments`)
            .auth('localAdmin', 'localAdmin')
            .attach('file', `${__dirname}/_large.png`)
            .expect(200)
            .then(({body}) => {
              attachment = body
            })
        })
    })

    it('should allow anonymous bulk read access', () => {
      return request(MASTER_URL)
        .get('/api/articles')
        .expect(200)
    })

    it('should allow anonymous read access', () => {
      return request(MASTER_URL)
        .get(`/api/articles/${article._id}`)
        .expect(200)
    })

    it('should allow anonymous read access to attachments', () => {
      return request(MASTER_URL)
        .get(`/api/articles/${article._id}/attachments/${attachment._id}`)
        .expect(200)
    })

    it(`shouldn't allow anonymous write access`, () => {
      return request(MASTER_URL)
        .post('/api/articles')
        .send({ hello: 'unauthorized request' })
        .expect(401)
    })

    it('shouldn\'t allow anonymous read write to attachments', () => {
      return request(MASTER_URL)
        .post('/api/articles/123/attachments')
        .send('hello')
        .expect(401)
    })

    it('shouldn\'t allow anonymous update access', () => {
      return request(MASTER_URL)
        .put('/api/articles/123')
        .send({ hello: 'unauthorized request' })
        .expect(401)
    })

    it('shouldn\'t allow anonymous delete access', () => {
      return request(MASTER_URL)
        .del('/api/articles/123')
        .expect(401)
    })

    return it('shouldn\'t allow anonymous delete access to attachments', () => {
      return request(MASTER_URL)
        .del('/api/articles/123/attachments/123')
        .expect(401)
    })
  })

  let page = null

  describe('Localisation', () => {
    // it 'should test non localised resource vs localised resource'

    it('should return an empty list of pages', () => {
      return request(MASTER_URL)
        .get('/api/pages')
        .expect(200)
        .then(({body}) => {
          body.should.have.length(0)
        })
    })

    return it('should add a page when locale is specified', () => {
      return request(MASTER_URL)
        .post('/api/pages?locale=enUS')
        .send({ title: 'Hello', content: 'World', category: '123', author: { name: 'Kong' } })
        .expect(200)
        .then(({body}) => {
          page = body
          should.exist(page._id)
          page.enUS.title.should.equal('Hello')
          page.enUS.content.should.equal('World')
          page.author.name.should.equal('Kong')
          page.category.should.equal('123')
          page._createdAt.should.equal(page._updatedAt)
        })
    })
  })

  describe('Query Language', () => {
    const runQuery = (query) => {
      return request(MASTER_URL)
        .get('/api/querytest')
        .query({ query: JSON.stringify(query), unpublished: true })
        .then(response => response)
    }

    before(() => {
      return request(MASTER_URL)
        .post('/api/querytest')
        .send({
          name: 'John',
          age: 36,
          hobbies: ['sports', 'music'],
          vitals: {
            weight: '100kg',
            height: '6ft',
            fingers: 10
          }
        })
        .expect(200)
    })

    it('should support $eq for equality', async () => {
      let response
      response = await runQuery({name: {$eq: 'Bill'}})
      response.body.should.have.length(0)
      response = await runQuery({name: {$eq: 'John'}})
      response.body.should.have.length(1)
    })

    it('should support $ne for inequality', async () => {
      let response
      response = await runQuery({name: {$ne: 'Bill'}})
      response.body.should.have.length(1)
      response = await runQuery({name: {$ne: 'John'}})
      response.body.should.have.length(0)
    })

    it('should support $lt for less than', async () => {
      let response
      response = await runQuery({age: {$lt: 36}})
      response.body.should.have.length(0)
      response = await runQuery({age: {$lt: 37}})
      response.body.should.have.length(1)
    })

    it('should support $lte for less than or equal', async () => {
      let response
      response = await runQuery({age: {$lte: 36}})
      response.body.should.have.length(1)
      response = await runQuery({age: {$lte: 35}})
      response.body.should.have.length(0)
    })

    it('should support $gt for greater than', async () => {
      let response
      response = await runQuery({age: {$gt: 36}})
      response.body.should.have.length(0)

      response = await runQuery({age: {$gt: 35}})
      response.body.should.have.length(1)
    })

    it('should support $gte for greater than or equal', async () => {
      let response
      response = await runQuery({age: {$gte: 36}})
      response.body.should.have.length(1)

      response = await runQuery({age: {$gte: 37}})
      response.body.should.have.length(0)
    })

    it('should support $all for match all rules in array', async () => {
      let response
      response = await runQuery({hobbies: {$all: ['sports', 'drugs']}})
      response.body.should.have.length(0)

      response = await runQuery({hobbies: {$all: ['sports', 'music']}})
      response.body.should.have.length(1)
    })

    it('should support $or for match any rules in array', async () => {
      let response
      response = await runQuery({$or: [{hobbies: 'sports'}, {hobies: 'drugs'}]})
      response.body.should.have.length(1)

      response = await runQuery({$or: [{hobbies: 'sports'}, {hobies: 'music'}]})
      response.body.should.have.length(1)

      response = await runQuery({$or: [{hobbies: 'drugs'}, {hobies: 'alcohol'}]})
      response.body.should.have.length(0)
    })

    it('should support $and for match all rules in object', async () => {
      let response
      response = await runQuery({$and: [{'vitals.weight': '100kg'}, {'vitals.height': '5ft'}]})
      response.body.should.have.length(0)

      response = await runQuery({$and: [{'vitals.weight': '100kg'}, {'vitals.height': '6ft'}]})
      response.body.should.have.length(1)
    })

    it('should support $or for match any rules in object', async () => {
      let response
      response = await runQuery({$or: [{'vitals.weight': '100kg'}, {'vitals.height': '5ft'}]})
      response.body.should.have.length(1)

      response = await runQuery({$or: [{'vitals.weight': '100kg'}, {'vitals.height': '6ft'}]})
      response.body.should.have.length(1)

      response = await runQuery({$or: [{'vitals.weight': '90kg'}, {'vitals.height': '7ft'}]})
      response.body.should.have.length(0)
    })

    it('should support query composition', async () => {
      let response
      response = await runQuery(({ name: { $eq: 'John' }, age: { $eq: 35 } }))
      response.body.should.have.length(0)

      response = await runQuery(({ name: { $eq: 'Bill' }, age: { $eq: 36 } }))
      response.body.should.have.length(0)

      response = await runQuery(({ name: { $eq: 'Bill' }, age: { $eq: 35 } }))
      response.body.should.have.length(0)

      response = await runQuery(({ name: { $eq: 'John' }, age: { $eq: 36 } }))
      response.body.should.have.length(1)
    })

    it('should support shorthand notation', async () => {
      let response
      response = await runQuery({name: 'John', age: 35})
      response.body.should.have.length(0)

      response = await runQuery({name: 'Bill', age: 36})
      response.body.should.have.length(0)

      response = await runQuery({name: 'Bill', age: 35})
      response.body.should.have.length(0)

      response = await runQuery({name: 'John', age: 36})
      response.body.should.have.length(1)
    })

    it('should support (dot)notation, namespacing', async () => {
      let response
      response = await runQuery({'vitals.weight': '100kg'})
      response.body.should.have.length(1)

      response = await runQuery({'vitals.weight': '100kg', 'vitals.fingers': {$lt: 10}})
      response.body.should.have.length(0)

      response = await runQuery({'vitals.weight': '100kg', 'vitals.fingers': {$gte: 4}})
      response.body.should.have.length(1)
    })
  })

  describe('JS', () => {
    let api = null

    it('should respond with an instance', () => {
      api = cms.api()
      return api.should.be.a('function')
    })

    it('should respond with a resource API', () => {
      const articles = api('articles')
      should.exist(articles.list)
      should.exist(articles.read)
      should.exist(articles.find)
      should.exist(articles.create)
      should.exist(articles.update)
      should.exist(articles.exists)
      should.exist(articles.remove)
      should.exist(articles.findAttachment)
      should.exist(articles.createAttachment)
      should.exist(articles.removeAttachment)
    })

    describe('Hooks', () => {
      it('should defined for resource', () => {
        const articles = api('articles')
        articles.use.should.be.a('function')
        articles.before.should.be.a('function')
        articles.beforeAll.should.be.a('function')
        articles.after.should.be.a('function')
        articles.afterAll.should.be.a('function')
      })
    })
  })

  describe('ResolveDependency', () => {
    const comments = []
    let article = null

    let authorNested = null
    let commentNested = null
    let articleNested = null
    before((done) => {
      const api = cms.api()
      const q = queue(1)

      q.defer(next => {
        api('authors').create({title: 'author-nested'}, (error, result) => {
          if (error) { next(error) }
          authorNested = result
          next()
        })
      })
      q.defer(next => {
        api('comments').create({title: 'comment-nested', author: authorNested._id}, (error, result) => {
          if (error) { next(error) }
          commentNested = result
          commentNested.author = authorNested
          next()
        })
      })

      q.defer(next => {
        api('articles').create({title: 'article-nested', comment: commentNested._id}, (error, result) => {
          if (error) { next(error) }
          articleNested = result
          next()
        })
      })

      _.each([1, 2, 3], id => {
        q.defer(next => {
          api('comments').create({title: `comment-${id}`}, (error, result) => {
            if (error) { next(error) }
            comments.push(_.extend(result))
            next()
          })
        })
      })
      q.defer(next => {
        const obj = {
          string: 'article01',
          comment: _.first(comments)._id,
          comments: _.pluck(_.rest(comments), '_id'),
          enUS: {
            localizedComment: _.first(comments)._id,
            localizedComments: _.pluck(_.rest(comments), '_id')
          }
        }

        api('articles').create(obj, (error, result) => {
          if (error) { next(error) }
          article = result
          next()
        })
      })
      q.awaitAll(error => {
        should.not.exist(error)
        setTimeout(done, 100)
      })
    })

    it('should return object with dependency defined by list', () => {
      const api = cms.api()

      return Q.ninvoke(api('articles', 'comments'), 'list', {_id: article._id})
        .then(result => {
          article = _.first(result)
          article.comment.should.deep.equal(_.first(comments))
          article.comments.should.deep.equal(_.rest(comments))
        })
    })

    it('should return object with dependency defined by find', () => {
      const api = cms.api()
      return Q.ninvoke(api('articles', 'comments'), 'find', article._id)
        .then(result => {
          article = result
          article.comment.should.deep.equal(_.first(comments))
          article.comments.should.deep.equal(_.rest(comments))
        })
    })

    it('should return nested object with dependency defined by find', () => {
      const api = cms.api()
      return Q.ninvoke(api('articles', 'comments', 'authors'), 'find', articleNested._id)
        .then(result => {
          articleNested = result
          articleNested.comment.should.deep.equal(commentNested)
        })
    })

    return it('should return object with dependency defined by list with one more records', () => {
      const api = cms.api()
      return Q.ninvoke(api('articles', 'comments'), 'list')
        .then(result => {
          const numberOfRecords = result.length
          return request(MASTER_URL)
            .post('/api/articles')
            .auth('localAdmin', 'localAdmin')
            .send({ content: 'test' })
            .expect(200)
            .then(({body}) => {
              return Q.ninvoke(api('articles', 'comments'), 'list')
                .then(result => {
                  result.length.should.equal(numberOfRecords + 1)
                })
            })
        })
    })
  })
})
