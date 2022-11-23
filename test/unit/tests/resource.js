const _ = require('lodash')
const chai = require('chai')
const should = chai.should()
const request = require('supertest')
const Helper = require('../../helper')
const helper = Helper.getInstance()

exports.suite = () => {
  let article = null
  before(async () => {
    const articles = await helper.getRequest('/api/articles')
    for (const article of articles) {
      await request(helper.MASTER_URL)
        .del(`/api/articles/${article._id}`)
        .auth('localAdmin', 'localAdmin')
    }
  })

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
}
