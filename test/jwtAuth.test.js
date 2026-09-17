const request = require('supertest')
const chai = require('chai')
const _ = require('lodash')
const expect = chai.expect
const serverUrl = 'http://localhost:9990'
const auth = ['localAdmin', 'localAdmin']

// Regression coverage for #88: the JWT is the admin's actual credential, but nothing mounted
// cookie-parser in this configuration, so req.cookies never existed and every request fell back to
// the express session.
describe('JWT authentication', () => {
  let jwtCookie
  let token
  let sessionCookie
  let createdId

  const cookie = (cookies, name) => {
    const found = _.find(cookies, item => _.startsWith(item, `${name}=`))
    return found ? _.first(found.split(';')) : false
  }

  before(async () => {
    const res = await request(serverUrl)
      .post('/admin/login')
      .send({ username: _.first(auth), password: _.last(auth) })
    expect(res.status, 'login').to.equal(200)
    jwtCookie = cookie(res.headers['set-cookie'], 'nodeCmsJwt')
    sessionCookie = cookie(res.headers['set-cookie'], 'connect.sid')
    expect(jwtCookie, 'login set a nodeCmsJwt cookie').to.be.a('string')
    token = _.last(jwtCookie.split('='))
    const created = await request(serverUrl)
      .post('/api/regions')
      .auth(...auth)
      .send({ key: 'jwt-auth-test', name: { en: 'JWT auth test' } })
    expect(created.status, 'seed record').to.equal(200)
    createdId = created.body._id
  })

  after(async () => {
    if (createdId) {
      await request(serverUrl).delete(`/api/regions/${createdId}`).auth(...auth)
    }
  })

  it('authorises a read with the nodeCmsJwt cookie alone', async () => {
    const res = await request(serverUrl).get('/api/regions').set('Cookie', jwtCookie)
    expect(res.status).to.equal(200)
    expect(_.map(res.body, 'key')).to.include('jwt-auth-test')
  })

  it('authorises a read with the x-access-token header alone', async () => {
    const res = await request(serverUrl).get('/api/regions').set('x-access-token', token)
    expect(res.status).to.equal(200)
    expect(_.map(res.body, 'key')).to.include('jwt-auth-test')
  })

  it('serves the admin, not the login page, for a request holding only the cookie', async () => {
    const res = await request(serverUrl).get('/admin/').set('Cookie', jwtCookie)
    expect(res.status).to.equal(200)
    expect(res.text).to.contain('<title>node-cms</title>')
  })

  it('leaves the logged-in session intact after an authorised read', async () => {
    const both = [jwtCookie, sessionCookie].join('; ')
    const read = await request(serverUrl).get('/api/regions').set('Cookie', both)
    expect(read.status, 'read').to.equal(200)
    const status = await request(serverUrl).get('/admin/login').set('Cookie', both)
    expect(status.status, 'status').to.equal(200)
    expect(_.get(status.body, 'username'), 'still logged in').to.equal(_.first(auth))
  })
})
