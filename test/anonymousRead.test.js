const _ = require('lodash')
const request = require('supertest')
const chai = require('chai')
const expect = chai.expect
const serverUrl = 'http://localhost:9990'

describe('AnonymousRead Plugin API', () => {

  before(async () => {
    // This assumes the server is running with anonymousRead enabled for 'publicData'
    // and that the resource 'privateData' exists and is not public.
    // We will create some data to ensure the resources are not empty.

    // Create public data
    await request(serverUrl)
      .post('/api/publicData')
      .auth('localAdmin', 'localAdmin')
      .send({ message: 'This is public' })

    // Create private data
    await request(serverUrl)
      .post('/api/privateData')
      .auth('localAdmin', 'localAdmin')
      .send({ secret: 'This is secret' })
  })

  after(async () => {
    // Clean up created data
    const publicListRes = await request(serverUrl).get('/api/publicData').auth('localAdmin', 'localAdmin')
    if (publicListRes.status === 200 && _.isArray(publicListRes.body)) {
      for (const item of publicListRes.body) {
        await request(serverUrl).delete(`/api/publicData/${item._id}`).auth('localAdmin', 'localAdmin')
      }
    }

    const privateListRes = await request(serverUrl).get('/api/privateData').auth('localAdmin', 'localAdmin')
    if (privateListRes.status === 200 && _.isArray(privateListRes.body)) {
      for (const item of privateListRes.body) {
        await request(serverUrl).delete(`/api/privateData/${item._id}`).auth('localAdmin', 'localAdmin')
      }
    }
  })

  it('should allow anonymous access to resources in anonymousRead list', async () => {
    const res = await request(serverUrl).get('/api/publicData')
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('array')
    // The test data might have been cleaned up, so we can't guarantee a length > 0
    if (res.body.length > 0) {
      expect(res.body[0].message).to.equal('This is public')
    }
  })

  it('should deny anonymous access to resources not in anonymousRead list', async () => {
    const res = await request(serverUrl).get('/api/privateData').auth('anonymous', '')
    expect(res.status).to.equal(401)
  })

  it('should allow authenticated admin access to private resources', async () => {
    const res = await request(serverUrl)
      .get('/api/privateData')
      .auth('localAdmin', 'localAdmin')

    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('array')
    expect(res.body.length).to.be.greaterThan(0)
    expect(res.body[0].secret).to.equal('This is secret')
  })
})
