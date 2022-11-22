const path = require('path')
const request = require('supertest')
const Helper = require('../../helper')
const helper = Helper.getInstance()

exports.suite = () => {
  let article = null
  let attachment = null
  // allow anonymous read access (articles)
  before(async () => {
    const group = await helper.cms.groups.find({name: 'anonymous'})
    group.read.push('articles')
    await helper.cms.groups.update(group._id, {read: group.read})
  })

  before(async () => {
    const {body} = await request(helper.MASTER_URL)
      .post('/api/articles')
      .auth('localAdmin', 'localAdmin')
      .send({title: 'testing ACL'})
      .expect(200)
    article = body
    const retreivedAttachment = await request(helper.MASTER_URL)
      .post(`/api/articles/${article._id}/attachments`)
      .auth('localAdmin', 'localAdmin')
      .attach('file', path.join(__dirname, '../../', '_large.png'))
      .expect(200)
    attachment = retreivedAttachment.body
  })

  it('should allow anonymous bulk read access', async () => {
    return await helper.getRequest('/api/articles', 200, false, true)
  })

  it('should allow anonymous read access', async () => {
    await helper.getRequest(`/api/articles/${article._id}`, 200, false, true)
  })

  it('should allow anonymous read access to attachments', async () => {
    await helper.getRequest(`/api/articles/${article._id}/attachments/${attachment._id}`, 200, 'image/png', true)
  })

  it(`shouldn't allow anonymous write access`, async () => {
    await request(helper.MASTER_URL)
      .post('/api/articles')
      .send({ hello: 'unauthorized request' })
      .expect(401)
  })

  it('shouldn\'t allow anonymous read write to attachments', async () => {
    await request(helper.MASTER_URL)
      .post('/api/articles/123/attachments')
      .send('hello')
      .expect(401)
  })

  it('shouldn\'t allow anonymous update access', async () => {
    await request(helper.MASTER_URL)
      .put('/api/articles/123')
      .send({ hello: 'unauthorized request' })
      .expect(401)
  })

  it('shouldn\'t allow anonymous delete access', async () => {
    await request(helper.MASTER_URL)
      .del('/api/articles/123')
      .expect(401)
  })

  return it('shouldn\'t allow anonymous delete access to attachments', async () => {
    await request(helper.MASTER_URL)
      .del('/api/articles/123/attachments/123')
      .expect(401)
  })
}
