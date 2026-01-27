const request = require('supertest')
const chai = require('chai')
const expect = chai.expect
const serverUrl = 'http://localhost:9990'

describe('Helpers - Query Filtering', () => {
  let createdIds = []

  before(async () => {
    // Create test data with different properties
    const res1 = await request(serverUrl)
      .post('/api/articles')
      .auth('localAdmin', 'localAdmin')
      .send({ title: 'Alice Article', category: 'tech' })
    createdIds.push(res1.body._id)

    const res2 = await request(serverUrl)
      .post('/api/articles')
      .auth('localAdmin', 'localAdmin')
      .send({ title: 'Bob Article', category: 'tech' })
    createdIds.push(res2.body._id)

    const res3 = await request(serverUrl)
      .post('/api/articles')
      .auth('localAdmin', 'localAdmin')
      .send({ title: 'Charlie Article', category: 'sports' })
    createdIds.push(res3.body._id)
  })

  after(async () => {
    // Clean up
    for (const id of createdIds) {
      await request(serverUrl)
        .delete(`/api/articles/${id}`)
        .auth('localAdmin', 'localAdmin')
    }
    createdIds = []
  })

  it('should filter results based on a simple query', async () => {
    const res = await request(serverUrl)
      .get('/api/articles')
      .query({ query: JSON.stringify({ title: 'Bob Article' }) })
      .auth('localAdmin', 'localAdmin')

    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('array')
    const bobArticles = res.body.filter(a => a.title === 'Bob Article')
    expect(bobArticles.length).to.be.at.least(1)
  })

  it('should filter results with a regex query', async () => {
    const res = await request(serverUrl)
      .get('/api/articles')
      .query({ query: JSON.stringify({ title: { '$regex': 'li' } }) })
      .auth('localAdmin', 'localAdmin')

    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('array')
    const filtered = res.body.filter(a => a.title && (a.title.includes('li') || a.title.includes('Li')))
    expect(filtered.length).to.be.at.least(2) // Alice and Charlie
  })

  it('should handle pagination', async () => {
    const res = await request(serverUrl)
      .get('/api/articles')
      .query({ page: 0, limit: 1 })
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('array')
    expect(res.body.length).to.be.at.most(1)
    expect(res.body[0].title).to.equal('Alice Article')
  })
})
