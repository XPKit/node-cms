const chai = require('chai')
const should = chai.should()
const request = require('supertest')
const Helper = require('../helper')
const helper = Helper.getInstance()

exports.suite = () => {
  let page = null
  // it 'should test non localised resource vs localised resource'
  before(async () => {
    await helper.deleteAllRecords('pages')
  })
  it('should return an empty list of pages', async () => {
    const body = await helper.getRequest('/api/pages', 200, false, true)
    body.should.have.length(0)
  })

  it('should add a page when locale is specified', async () => {
    const {body} = await request(helper.MASTER_URL)
      .post('/api/pages?locale=enUS')
      .send({ title: 'Hello', content: 'World', category: '123', author: { name: 'Kong' } })
      .expect(200)
    page = body
    should.exist(page._id)
    page.enUS.title.should.equal('Hello')
    page.enUS.content.should.equal('World')
    page.author.name.should.equal('Kong')
    page.category.should.equal('123')
    page._createdAt.should.equal(page._updatedAt)
  })
}
