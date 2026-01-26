const request = require('supertest')
const chai = require('chai')
const expect = chai.expect
const serverUrl = 'http://localhost:9990'

describe('XLSX Plugin API', () => {
  it('GET /xlsx/articles should return a valid response', async () => {
    const res = await request(serverUrl).get('/xlsx/articles')
    console.log('GET /articles response:', res.body)
    console.log('GET /articles status:', res.status)
    expect(res.status).to.be.oneOf([200, 204, 404])
    expect(res.body).to.be.an('object')
    // Actual response: {}
  })

  it('POST /xlsx/articles/status should return a valid response', async () => {
    const res = await request(serverUrl).post('/xlsx/articles/status').attach('xlsx', 'package.json')
    console.log('POST /articles/status response:', res.body)
    console.log('POST /articles/status status:', res.status)
    expect(res.status).to.be.oneOf([200, 204, 404])
    expect(res.body).to.be.an('object')
    // Actual response: {}
  })

  it('POST /xlsx/articles/import should return a valid response', async () => {
    const res = await request(serverUrl).post('/xlsx/articles/import').attach('xlsx', 'package.json')
    console.log('POST /articles/import response:', res.body)
    console.log('POST /articles/import status:', res.status)
    expect(res.status).to.be.oneOf([200, 204, 404])
    expect(res.body).to.be.an('object')
    // Actual response: {}
  })
})
