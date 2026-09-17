const request = require('supertest')
const chai = require('chai')
const _ = require('lodash')
const expect = chai.expect
const serverUrl = 'http://localhost:9990'
const auth = ['localAdmin', 'localAdmin']
const token = 'sync-test-token'

// Every route in the sync plugin runs behind checkToken or checkEnvironmentToken, and every handler
// used to be registered unbound, so `this` was undefined and the guards threw before they could
// answer. The suite that would have caught it asserted `oneOf([200, 204, 404])`, which a crash
// satisfies, so these assert what each route actually returns instead.
describe('Sync Plugin API', () => {
  const probe = async (path, query = {}) => {
    return request(serverUrl).get(path).query(query).auth(...auth)
  }

  it('rejects a request with no token', async () => {
    const res = await probe('/sync/articles')
    expect(res.status).to.equal(500)
    expect(_.get(res.body, 'error', false), 'a guard answered, rather than a handler crashing').to.equal('token is not match')
  })

  it('rejects a request with the wrong token', async () => {
    const res = await probe('/sync/articles', { token: 'not-the-token' })
    expect(res.status).to.equal(500)
    expect(_.get(res.body, 'error', false)).to.equal('token is not match')
  })

  it('rejects a resource the sync config does not list', async () => {
    const res = await probe('/sync/countries', { token })
    expect(res.status).to.equal(500)
    expect(_.get(res.body, 'error', false)).to.contain('countries')
  })

  // The listing hands back normalised records for the sync protocol rather than stored ones, so this
  // asserts that it tracks the resource rather than pinning a shape this test should not own.
  it('lists a synced resource, and follows it as records are added', async () => {
    const before = await probe('/sync/articles', { token })
    expect(before.status).to.equal(200)
    expect(before.body).to.be.an('array')
    const created = await request(serverUrl)
      .post('/api/articles')
      .auth(...auth)
      .send({ title: 'Sync listing test' })
    expect(created.status, 'seed').to.equal(200)
    try {
      const after = await probe('/sync/articles', { token })
      expect(after.status).to.equal(200)
      expect(after.body.length, 'one more record than before').to.equal(before.body.length + 1)
    } finally {
      await request(serverUrl).delete(`/api/articles/${created.body._id}`).auth(...auth)
    }
  })

  it('reports the sync status of a resource', async () => {
    const res = await probe('/sync/articles/status', { token })
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('status')
  })
})
