const _ = require('lodash')
const path = require('path')
const request = require('supertest')
const Helper = require('../../helper')
const helper = Helper.getInstance()
const chai = require('chai')
const should = chai.should()

exports.suite = () => {
  let user = false
  let jwtToken = false
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
    return await helper.getRequest('/api/articles')
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
    user = await helper.getRequest(`/admin/login`, 200)
    user.should.be.an('object')
    should.not.exist(user.token)
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
    const data = await helper.login(userInfo)
    // console.warn(`correct credentials = `, user)
    data.user.username.should.equal('localAdmin')
    data.user.group.name.should.equal('admins')
    data.user.token.should.be.a('string')
    user = data.user
    jwtToken = data.cookie
  })

  it('should allow to create article after log in', async () => {
    const {body} = await request(helper.MASTER_URL)
      .post('/api/articles')
      .set('Cookie', [jwtToken])
      .send({title: 'testing ACL'})
      .expect(200)
    article = body
  })

  it('should allow to create article with basic auth', async () => {
    const {body} = await request(helper.MASTER_URL)
      .post('/api/articles')
      .auth('localAdmin', 'localAdmin')
      .send({title: 'testing ACL'})
      .expect(200)
    article = body
  })

  it('should allow anonymous read access', async () => {
    await helper.getRequest(`/api/articles/${article._id}`, 200)
  })

  it('should allow to add an attachment on the created article', async () => {
    const retreivedAttachment = await request(helper.MASTER_URL)
      .post(`/api/articles/${article._id}/attachments`)
      .set('Cookie', [jwtToken])
      .attach('file', path.join(__dirname, '../../', '_large.png'))
      .expect(200)
    attachment = retreivedAttachment.body
  })

  it('should allow anonymous read access to attachments', async () => {
    await helper.getRequest(`/api/articles/${article._id}/attachments/${attachment._id}`, 200, 'image/png')
  })

  it('should log out user', async () => {
    await helper.getRequest(`/admin/logout`)
  })

  it('should return no user info after logout', async () => {
    user = await helper.getRequest(`/admin/login`, 200)
    user.should.be.an('object')
    should.not.exist(user.token)
    _.keys(user).should.have.lengthOf(0)
  })
}
