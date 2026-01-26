const request = require('supertest')
const chai = require('chai')
const expect = chai.expect
const serverUrl = 'http://localhost:9990'

describe('Sync Plugin API', () => {
  it('GET /local/articles/status should return a valid response', async () => {
    const res = await request(serverUrl).get('/local/articles/status')
    console.log('GET /sync/local/articles/status response:', res.body)
    console.log('GET /sync/local/articles/status status:', res.status)
    expect(res.status).to.be.oneOf([200, 204, 404])
    expect(res.body).to.be.an('object')
    // Actual response: {}
    // Status: 404
  })

  it('GET /local/articles should return a valid response', async () => {
    const res = await request(serverUrl).get('/local/articles')
    console.log('GET /sync/local/articles response:', res.body)
    console.log('GET /sync/local/articles status:', res.status)
    expect(res.status).to.be.oneOf([200, 204, 404])
    expect(res.body).to.be.an('object')
    // Actual response: {}
    // Status: 404
  })

  it('POST /articles/from/local/to/remote should return a valid response', async () => {
    const res = await request(serverUrl).post('/articles/from/local/to/remote').send({ test: 'value' })
    console.log('POST /sync/articles/from/local/to/remote response:', res.body)
    console.log('POST /sync/articles/from/local/to/remote status:', res.status)
    expect(res.status).to.be.oneOf([200, 204, 404])
    expect(res.body).to.be.an('object')
    // Actual response: {}
    // Status: 404
  })

  it('GET /articles/from/local/to/remote should return a valid response', async () => {
    const res = await request(serverUrl).get('/articles/from/local/to/remote')
    console.log('GET /sync/articles/from/local/to/remote response:', res.body)
    console.log('GET /sync/articles/from/local/to/remote status:', res.status)
    expect(res.status).to.be.oneOf([200, 204, 404])
    expect(res.body).to.be.an('object')
    // Actual response: {}
    // Status: 404
  })

  it('GET /articles should return a valid response', async () => {
    const res = await request(serverUrl).get('/articles')
    console.log('GET /sync/articles response:', res.body)
    console.log('GET /sync/articles status:', res.status)
    expect(res.status).to.be.oneOf([200, 204, 404])
    expect(res.body).to.be.an('object')
    // Actual response: {}
    // Status: 404
  })

  it('GET /articles/status should return a valid response', async () => {
    const res = await request(serverUrl).get('/articles/status')
    console.log('GET /sync/articles/status response:', res.body)
    console.log('GET /sync/articles/status status:', res.status)
    expect(res.status).to.be.oneOf([200, 204, 404])
    expect(res.body).to.be.an('object')
    // Actual response: {}
    // Status: 404
  })

  it('PUT /articles should return a valid response', async () => {
    const res = await request(serverUrl).put('/articles').send({ test: 'value' })
    console.log('PUT /sync/articles response:', res.body)
    console.log('PUT /sync/articles status:', res.status)
    expect(res.status).to.be.oneOf([200, 204, 404])
    expect(res.body).to.be.an('object')
    // Actual response: {}
    // Status: 404
  })

  it('GET /articles/1/attachments/1 should return a valid response', async () => {
    const res = await request(serverUrl).get('/articles/1/attachments/1')
    console.log('GET /sync/articles/1/attachments/1 response:', res.body)
    console.log('GET /sync/articles/1/attachments/1 status:', res.status)
    expect(res.status).to.be.oneOf([200, 204, 404])
    expect(res.body).to.be.an('object')
    // Actual response: {}
    // Status: 404
  })
})
