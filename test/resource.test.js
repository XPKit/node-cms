const request = require('supertest')
const chai = require('chai')
const expect = chai.expect
const serverUrl = 'http://localhost:9990'

const login = async () => {
  const res = await request(serverUrl)
    .post('/admin/login')
    .send({ username: 'localAdmin', password: 'localAdmin' })
  return res.headers['set-cookie'] || []
}

describe('Resource API - CRUD Operations', () => {
  let createdId
  afterEach(async () => {
    // Clean up any created articles
    if (createdId) {
      await request(serverUrl)
        .delete(`/api/articles/${createdId}`)
        .auth('localAdmin', 'localAdmin')
      createdId = null
    }
  })

  it('should list all resources', async () => {
    const cookies = await login()
    const res = await request(serverUrl).get('/resources')
      .auth('localAdmin', 'localAdmin').set('Cookie', [...cookies])
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('array')
    res.body.forEach(resource => {
      expect(resource).to.have.property('name').that.is.a('string')
      expect(resource).to.have.property('type').that.is.a('string')
      expect(resource).to.have.property('schema').that.is.an('array')
      expect(resource).to.have.property('title').that.is.a('string')
      expect(resource).to.have.property('mid').that.is.a('string')
    })
  })

  it('should create a new record', async () => {
    const res = await request(serverUrl)
      .post('/api/articles')
      .auth('localAdmin', 'localAdmin')
      .send({ title: 'Test Title', body: 'Test Body' })
    expect(res.status).to.equal(200)
    expect(res.body).to.have.property('_id')
    expect(res.body.title).to.equal('Test Title')
    expect(res.body.body).to.equal('Test Body')
    createdId = res.body._id
  })

  it('should find a record by ID', async () => {
    const createRes = await request(serverUrl)
      .post('/api/articles')
      .auth('localAdmin', 'localAdmin')
      .send({ title: 'Find Me' })
    createdId = createRes.body._id
    const res = await request(serverUrl)
      .get(`/api/articles/${createdId}`)
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    expect(res.body._id).to.equal(createdId)
    expect(res.body.title).to.equal('Find Me')
  })

  it('should return a list of records', async () => {
    const res1 = await request(serverUrl)
      .post('/api/articles')
      .auth('localAdmin', 'localAdmin')
      .send({ title: 'Record 1' })
    const res2 = await request(serverUrl)
      .post('/api/articles')
      .auth('localAdmin', 'localAdmin')
      .send({ title: 'Record 2' })
    const listRes = await request(serverUrl)
      .get('/api/articles')
      .auth('localAdmin', 'localAdmin')
    expect(listRes.status).to.equal(200)
    expect(listRes.body).to.be.an('array')
    expect(listRes.body.length).to.be.at.least(2)
    // Clean up
    await request(serverUrl).delete(`/api/articles/${res1.body._id}`).auth('localAdmin', 'localAdmin')
    await request(serverUrl).delete(`/api/articles/${res2.body._id}`).auth('localAdmin', 'localAdmin')
  })

  it('should update a record', async () => {
    const createRes = await request(serverUrl)
      .post('/api/articles')
      .auth('localAdmin', 'localAdmin')
      .send({ title: 'Original Title' })
    createdId = createRes.body._id
    const updateRes = await request(serverUrl)
      .put(`/api/articles/${createdId}`)
      .auth('localAdmin', 'localAdmin')
      .send({ title: 'Updated Title' })
    expect(updateRes.status).to.equal(200)
    expect(updateRes.body.title).to.equal('Updated Title')
    const getRes = await request(serverUrl)
      .get(`/api/articles/${createdId}`)
      .auth('localAdmin', 'localAdmin')
    expect(getRes.body.title).to.equal('Updated Title')
  })

  it('should remove a record', async () => {
    const createRes = await request(serverUrl)
      .post('/api/articles')
      .auth('localAdmin', 'localAdmin')
      .send({ title: 'To Be Deleted' })
    const id = createRes.body._id
    const deleteRes = await request(serverUrl)
      .delete(`/api/articles/${id}`)
      .auth('localAdmin', 'localAdmin')
    expect(deleteRes.status).to.equal(200)
    const getRes = await request(serverUrl)
      .get(`/api/articles/${id}`)
      .auth('localAdmin', 'localAdmin')
    expect(getRes.body).to.equal(null)
  })

  it('should return null for non-existent record', async () => {
    const res = await request(serverUrl)
      .get('/api/articles/nonexistentid123')
      .auth('localAdmin', 'localAdmin')
    expect(res.body).to.equal(null)
  })
})

describe('Resource API - Attachments', () => {
  let recordId
  let attachmentId

  beforeEach(async () => {
    const res = await request(serverUrl)
      .post('/api/articles')
      .auth('localAdmin', 'localAdmin')
      .send({ title: 'Attachment Test' })
    recordId = res.body._id
  })

  afterEach(async () => {
    if (recordId) {
      await request(serverUrl)
        .delete(`/api/articles/${recordId}`)
        .auth('localAdmin', 'localAdmin')
      recordId = null
    }
  })

  it('should create an attachment', async () => {
    const res = await request(serverUrl)
      .post(`/api/articles/${recordId}/attachments`)
      .auth('localAdmin', 'localAdmin')
      .attach('file', 'package.json')
    expect(res.status).to.equal(200)
    expect(res.body).to.have.property('_id')
    expect(res.body).to.have.property('_filename')
    attachmentId = res.body._id
    const getRes = await request(serverUrl)
      .get(`/api/articles/${recordId}`)
      .auth('localAdmin', 'localAdmin')
    expect(getRes.body.file).to.be.an('array')
    expect(getRes.body.file.length).to.be.at.least(1)
  })

  it('should find an attachment', async () => {
    const createRes = await request(serverUrl)
      .post(`/api/articles/${recordId}/attachments`)
      .auth('localAdmin', 'localAdmin')
      .attach('file', './test/man.jpg')
    attachmentId = createRes.body._id
    const res = await request(serverUrl)
      .get(`/api/articles/${recordId}/attachments/${attachmentId}`)
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    expect(res.headers['content-type']).to.be.a('string')
  })

  it('should update an attachment', async () => {
    const createRes = await request(serverUrl)
      .post(`/api/articles/${recordId}/attachments`)
      .auth('localAdmin', 'localAdmin')
      .attach('file', 'package.json')
    attachmentId = createRes.body._id
    const res = await request(serverUrl)
      .put(`/api/articles/${recordId}/attachments/${attachmentId}`)
      .auth('localAdmin', 'localAdmin')
      .send({ _fields: { caption: 'Updated caption' } })
    expect(res.status).to.equal(200)
  })

  it('should remove an attachment', async () => {
    const createRes = await request(serverUrl)
      .post(`/api/articles/${recordId}/attachments`)
      .auth('localAdmin', 'localAdmin')
      .attach('file', 'package.json')
    attachmentId = createRes.body._id
    const deleteRes = await request(serverUrl)
      .delete(`/api/articles/${recordId}/attachments/${attachmentId}`)
      .auth('localAdmin', 'localAdmin')
    expect(deleteRes.status).to.equal(200)
    const getRes = await request(serverUrl)
      .get(`/api/articles/${recordId}`)
      .auth('localAdmin', 'localAdmin')
    const attachment = getRes.body.file ? getRes.body.file.find({_id: attachmentId}) : undefined
    expect(attachment).to.be.undefined
  })
})
