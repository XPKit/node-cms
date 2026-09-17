const request = require('supertest')
const chai = require('chai')
const expect = chai.expect
const serverUrl = 'http://localhost:9990'

// The Google Sheets side of this plugin needs oauth credentials, and the XLSX side needs a populated
// cache per resource, so neither happy path can run unattended. What is checked here is that the
// routes are mounted and that a bad request is answered rather than crashing the handler: every one
// of these was registered unbound, so `this` was undefined and each threw a TypeError on the way in.
describe('Import Plugin API', () => {
  const post = async (path, attach) => {
    const req = request(serverUrl).post(path).auth('localAdmin', 'localAdmin')
    return attach ? req.attach('xlsx', attach) : req
  }

  it('mounts its routes', async () => {
    for (const path of ['/import/status', '/import/execute']) {
      const res = await request(serverUrl).get(path).auth('localAdmin', 'localAdmin')
      expect(res.status, `${path} is routed somewhere`).to.not.equal(404)
    }
  })

  // Unlike the sync plugin this one has no JSON error handler of its own - it hands errors to
  // express's default, which answers with HTML - so there is no body worth asserting here.
  it('answers a malformed XLSX with an error status', async () => {
    const res = await post('/import/statusXlsx', __filename)
    expect(res.status).to.equal(500)
  })

  it('answers a missing file with an error status', async () => {
    const res = await post('/import/statusXlsx')
    expect(res.status).to.equal(500)
  })
})
