const request = require('supertest')
const chai = require('chai')
const expect = chai.expect
const serverUrl = 'http://localhost:9990'

describe('Database Operations via API', () => {
  let createdIds = []

  afterEach(async () => {
    // Clean up all created records
    for (const id of createdIds) {
      await request(serverUrl)
        .delete(`/api/articles/${id}`)
        .auth('localAdmin', 'localAdmin')
    }
    createdIds = []
  })

  describe('JSON Store Operations', () => {
    it('should create and retrieve a record', async () => {
      const createRes = await request(serverUrl)
        .post('/api/articles')
        .auth('localAdmin', 'localAdmin')
        .send({ title: 'DB Test Record', content: 'Test content' })
      expect(createRes.status).to.equal(200)
      expect(createRes.body).to.have.property('_id')
      createdIds.push(createRes.body._id)
      const getRes = await request(serverUrl)
        .get(`/api/articles/${createRes.body._id}`)
        .auth('localAdmin', 'localAdmin')
      expect(getRes.status).to.equal(200)
      expect(getRes.body.title).to.equal('DB Test Record')
    })

    it('should update a record', async () => {
      const createRes = await request(serverUrl)
        .post('/api/articles')
        .auth('localAdmin', 'localAdmin')
        .send({ title: 'Original' })
      createdIds.push(createRes.body._id)
      const updateRes = await request(serverUrl)
        .put(`/api/articles/${createRes.body._id}`)
        .auth('localAdmin', 'localAdmin')
        .send({ title: 'Updated' })
      expect(updateRes.status).to.equal(200)
      expect(updateRes.body.title).to.equal('Updated')
    })

    it('should delete a record', async () => {
      const createRes = await request(serverUrl)
        .post('/api/articles')
        .auth('localAdmin', 'localAdmin')
        .send({ title: 'To Delete' })
      const id = createRes.body._id
      const deleteRes = await request(serverUrl)
        .delete(`/api/articles/${id}`)
        .auth('localAdmin', 'localAdmin')
      expect(deleteRes.status).to.equal(200)
      const getRes = await request(serverUrl)
        .get(`/api/articles/${id}`)
        .auth('localAdmin', 'localAdmin')
      expect(getRes.status).to.equal(200)
      expect(getRes.body).to.be.null
    })

    it('should query records with filters', async () => {
      const res1 = await request(serverUrl)
        .post('/api/articles')
        .auth('localAdmin', 'localAdmin')
        .send({ title: 'TypeA', category: 'tech' })
      const res2 = await request(serverUrl)
        .post('/api/articles')
        .auth('localAdmin', 'localAdmin')
        .send({ title: 'TypeB', category: 'sports' })
      createdIds.push(res1.body._id, res2.body._id)
      const queryRes = await request(serverUrl)
        .get('/api/articles')
        .query({ query: JSON.stringify({ category: 'tech' }) })
        .auth('localAdmin', 'localAdmin')
      expect(queryRes.status).to.equal(200)
      const techArticles = queryRes.body.filter(a => a.category === 'tech')
      expect(techArticles.length).to.be.at.least(1)
    })
  })

  describe('File Store Operations (Attachments)', () => {
    let recordId

    beforeEach(async () => {
      const res = await request(serverUrl)
        .post('/api/articles')
        .auth('localAdmin', 'localAdmin')
        .send({ title: 'File Store Test' })
      recordId = res.body._id
      createdIds.push(recordId)
    })

    it('should write and read a file', async () => {
      const uploadRes = await request(serverUrl)
        .post(`/api/articles/${recordId}/attachments`)
        .auth('localAdmin', 'localAdmin')
        .attach('file', 'package.json')
      expect(uploadRes.status).to.equal(200)
      expect(uploadRes.body).to.have.property('_id')
      const downloadRes = await request(serverUrl)
        .get(`/api/articles/${recordId}/attachments/${uploadRes.body._id}`)
        .auth('localAdmin', 'localAdmin')
      expect(downloadRes.status).to.equal(200)
      expect(downloadRes.headers['content-type']).to.be.a('string')
    })

    it('should delete a file', async () => {
      const uploadRes = await request(serverUrl)
        .post(`/api/articles/${recordId}/attachments`)
        .auth('localAdmin', 'localAdmin')
        .attach('file', 'package.json')
      const attachmentId = uploadRes.body._id
      const deleteRes = await request(serverUrl)
        .delete(`/api/articles/${recordId}/attachments/${attachmentId}`)
        .auth('localAdmin', 'localAdmin')
      expect(deleteRes.status).to.equal(200)
      const getRes = await request(serverUrl)
        .get(`/api/articles/${recordId}/attachments/${attachmentId}`)
        .auth('localAdmin', 'localAdmin')
      expect(getRes.status).to.equal(404)
    })
  })
})
