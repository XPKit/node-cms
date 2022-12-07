const _ = require('lodash')
const path = require('path')
const request = require('supertest')
const Helper = require('../../helper')
const helper = Helper.getInstance()
const chai = require('chai')
const should = chai.should()

exports.suite = () => {
  let user = false
  let article = null
  let attachment = null
  const userInfo = {
    username: 'localAdmin',
    password: 'localAdmin'
  }
  // allow anonymous read access (articles)
  before(async () => {
    const group = await helper.cms.groups.find({name: 'anonymous'})
    group.read.push('articles')
    await helper.cms.groups.update(group._id, {read: group.read})
  })

  it('should allow anonymous bulk read access', async () => {
    return await helper.getRequest('/api/articles', 200, false, true)
  })

  it(`shouldn't allow anonymous write access`, async () => {
    await request(helper.MASTER_URL)
      .post('/api/articles')
      .send({ hello: 'unauthorized request' })
      .expect(401)
  })

  it(`shouldn't allow anonymous read write to attachments`, async () => {
    await request(helper.MASTER_URL)
      .post('/api/articles/123/attachments')
      .send('hello')
      .expect(401)
  })

  it(`shouldn't allow anonymous update access`, async () => {
    await request(helper.MASTER_URL)
      .put('/api/articles/123')
      .send({ hello: 'unauthorized request' })
      .expect(401)
  })

  it(`shouldn't allow anonymous delete access`, async () => {
    await request(helper.MASTER_URL)
      .del('/api/articles/123')
      .expect(401)
  })

  it(`shouldn't allow anonymous delete access to attachments`, async () => {
    await request(helper.MASTER_URL)
      .del('/api/articles/123/attachments/123')
      .expect(401)
  })

  it('should return no user info', async () => {
    const user = await helper.getRequest(`/admin/login`, 200)
    user.should.be.an('object')
    _.keys(user).should.have.lengthOf(0)
  })

  it('should refuse login with incorrect credentials', async () => {
    await helper.login({
      username: 'incorrect',
      password: 'incorrect'
    }, 401)
    // console.warn(`incorrect credentials = `, user)
  })

  it('should accept login with correct credentials', async () => {
    user = await helper.login(userInfo)
    // console.warn(`correct credentials = `, user)
    user.username.should.equal('localAdmin')
    user.group.name.should.equal('admins')
    user.token.should.be.a('string')
  })

  it('should accept login with correct credentials', async () => {
    user = await helper.login(userInfo)
    // console.warn(`correct credentials = `, user)
    user.username.should.equal('localAdmin')
    user.group.name.should.equal('admins')
    user.token.should.be.a('string')
  })

  it('should allow to create article after log in', async () => {
    // TODO: hugo - refactor
    const {body} = await request(helper.MASTER_URL)
      .post('/api/articles')
      .send({title: 'testing ACL'})
      .expect(200)
    article = body
  })

  // TODO: hugo - when the article is created, logout to then test anonymous read access

  it('should allow anonymous read access', async () => {
    await helper.getRequest(`/api/articles/${article._id}`, 200, false, true)
  })

  it('should allow anonymous read access to attachments', async () => {
    await helper.getRequest(`/api/articles/${article._id}/attachments/${attachment._id}`, 200, 'image/png', true)
  })

  it('should allow to add an attachment on the created article', async () => {
    const retreivedAttachment = await request(helper.MASTER_URL)
      .post(`/api/articles/${article._id}/attachments`)
      .auth('localAdmin', 'localAdmin')
      .attach('file', path.join(__dirname, '../../', '_large.png'))
      .expect(200)
    attachment = retreivedAttachment.body
  })
}
