const request = require('supertest')
const path = require('path')
const fs = require('fs-extra')
const Helper = require('../../helper')
const helper = Helper.getInstance()

exports.suite = () => {
  let article = null
  let attachment = null

  before(async () => {
    const {body} = await request(helper.MASTER_URL)
      .post('/api/articles')
      .send({title: 'Book'})
      .auth('localAdmin', 'localAdmin')
      .expect(200)
    article = body
  })

  it('should upload a new attachment', async () => {
    const {body} = await request(helper.MASTER_URL)
      .post(`/api/articles/${article._id}/attachments`)
      .attach('file', path.join(__dirname, '../../', '_large.png'))
      .auth('localAdmin', 'localAdmin')
      .expect(200)
    attachment = body
    attachment._id.should.be.a('string')
    attachment._filename.should.equal('_large.png')
    attachment._contentType.should.equal('image/png')
    attachment._fields.should.be.an('object')
    attachment._createdAt.should.be.a('number')
    attachment._updatedAt.should.be.a('number')
    attachment._createdAt.should.equal(attachment._updatedAt)
  })

  it('should be able to retrieve attachment immediately', async () => {
    const {body} = await request(helper.MASTER_URL)
      .post(`/api/articles/${article._id}/attachments`)
      .attach('file', path.join(__dirname, '../../', '_large.png'))
      .auth('localAdmin', 'localAdmin')
      .expect(200)
    const result = await helper.getRequest(`/api/articles/${article._id}/attachments/${body._id}`, 200, 'image/png')
    fs.writeFileSync(path.join(__dirname, '../../', '_large_copy2.png'), result)
    return helper.compareChecksum('_large.png', '_large_copy2.png')
  })

  it('should upload a new attachment and have locale specified', async () => {
    const {body} = await request(helper.MASTER_URL)
      .post(`/api/articles/${article._id}/attachments`)
      .auth('localAdmin', 'localAdmin')
      .field('_locale', 'enUS')
      .attach('file', path.join(__dirname, '../../', '_large.png'))
      .expect(200)
    body._id.should.be.a('string')
    body._filename.should.equal('_large.png')
    body._contentType.should.equal('image/png')
    body._fields.should.be.an('object')
    body._fields._locale.should.equal('enUS')
    body._createdAt.should.be.a('number')
    body._updatedAt.should.be.a('number')
    body._createdAt.should.equal(body._updatedAt)
  })

  it('should download a new attachment', async () => {
    const body = await helper.getRequest(`/api/articles/${article._id}/attachments/${attachment._id}`, 200, 'image/png')
    fs.writeFileSync(path.join(__dirname, '../../', '_large_copy.png'), body)
    return helper.compareChecksum('_large.png', '_large_copy.png')
  })

  it('should yield an error when wrong record id is specified', async () => {
    await helper.getRequest(`/api/articles/${article._id}/attachments`, 404, 'text/html; charset=utf-8')
  })

  it('should yield an error when attachment with this id is not found in record', async () => {
    await helper.getRequest(`/api/articles/${article._id}/attachments/123`, 404)
  })

  it('should delete an attachment', async () => {
    const {body} = await request(helper.MASTER_URL)
      .del(`/api/articles/${article._id}/attachments/${attachment._id}`)
      .auth('localAdmin', 'localAdmin')
      .expect(200)
    body.should.equal(true)
  })

  it('should remove attachment link from parent document', async () => {
    const body = await helper.getRequest(`/api/articles/${article._id}`)
    body._attachments.should.have.length(2)
  })

  return it('should remove document with attachment', async () => {
    await request(helper.MASTER_URL)
      .post(`/api/articles/${article._id}/attachments`)
      .auth('localAdmin', 'localAdmin')
      .field('_locale', 'enUS')
      .attach('file', path.join(__dirname, '../../', '_large.png'))
      .expect(200)
    const {body} = await request(helper.MASTER_URL)
      .del(`/api/articles/${article._id}`)
      .auth('localAdmin', 'localAdmin')
      .expect(200)
    body.should.equal(true)
  })
}
