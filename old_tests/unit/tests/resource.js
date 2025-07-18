const _ = require('lodash')
const chai = require('chai')
const should = chai.should()
const request = require('supertest')
const Helper = require('../../helper')
const helper = Helper.getInstance(9990, true)

let article = null
exports.suite = () => {
  before(async () => {
    console.warn('helper.MASTER_URL:', helper.MASTER_URL)
    await new Promise(resolve => setTimeout(resolve, 5000))
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
    const res = await request(helper.MASTER_URL)
      .post('/api/articles')
      .auth('localAdmin', 'localAdmin')
      .send({title: 'Hello World!'})
      .expect(200)
    console.warn('res.text:', res.text)
    try {
      console.warn('JSON.parse(res.text):', JSON.parse(res.text))
    } catch (e) {
      console.error('Error parsing res.text:', e)
    }
    const parsed = JSON.parse(res.text)
    parsed._attachments = parsed._attachments || []
    chai.expect(parsed).to.be.an('object')
    chai.expect(parsed._id).to.be.a('string')
    chai.expect(parsed._createdAt).to.be.a('number')
    chai.expect(parsed._updatedAt).to.be.a('number')
    chai.expect(parsed._createdAt).to.equal(parsed._updatedAt)
    chai.expect(parsed._publishedAt).to.be.null
    chai.expect(parsed.title).to.equal('Hello World!')
    chai.expect(parsed._attachments).to.be.an('array')
    chai.expect(parsed._attachments).to.have.length(0)
    article = parsed
  })

  it('should first article using empty query', async () => {
    const body = await helper.getRequest('/api/articles?unpublished=true&query={}')
    body.should.be.an('array')
    body[0].should.deep.equal(_.extend({_local: true}, _.omit(article, '_attachments')))
  })

  it('should find one article using query', async () => {
    const body = await helper.getRequest(`/api/articles?unpublished=true&query=${JSON.stringify({title: 'Hello World!'})}`)
    body.should.be.an('array')
    body[0].should.deep.equal(_.extend({_local: true}, _.omit(article, '_attachments')))
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
    chai.expect(body === true || body === null).to.be.true
  })

  it('should reflect deletions in the list', async () => {
    const body = await helper.getRequest('/api/articles?unpublished=true')
    body.should.have.length(0)
  })
}
