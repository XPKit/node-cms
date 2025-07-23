
const request = require('supertest')
const chai = require('chai')
const expect = chai.expect
const jwt = require('jsonwebtoken')
const serverUrl = 'http://localhost:9990'

describe('Authentication Plugin API', () => {
  it('should login successfully with correct credentials and set JWT cookie', async () => {
    const res = await request(serverUrl)
      .post('/admin/login')
      .send({ username: 'localAdmin', password: 'localAdmin' })
    expect(res.status).to.equal(200)
    expect(res.text).to.equal('success')
    // Check for JWT cookie
    const cookies = res.headers['set-cookie'] || []
    const jwtCookie = cookies.find(c => c.startsWith('nodeCmsJwt='))
    expect(jwtCookie, 'JWT cookie should be set').to.exist
    // Optionally, decode and check the JWT
    const token = jwtCookie && jwtCookie.split('=')[1].split(';')[0]
    expect(token, 'JWT token should exist').to.exist
    // Can't verify secret here, but can check it decodes to an object
    const decoded = jwt.decode(token)
    expect(decoded).to.be.an('object')
    expect(decoded).to.have.property('username', 'localAdmin')
  })

  it('should fail login with incorrect credentials', async () => {
    const res = await request(serverUrl)
      .post('/admin/login')
      .send({ username: 'localAdmin', password: 'wrongPassword' })
    expect(res.status).to.equal(500)
    expect(res.text).to.equal('Username and password not match')
    // Should not set JWT cookie
    const cookies = res.headers['set-cookie'] || []
    const jwtCookie = cookies.find(c => c.startsWith('nodeCmsJwt='))
    expect(jwtCookie).to.not.exist
  })
})
