const chai = require('chai')
const expect = chai.expect
const Authentication = require('../../lib/plugins/authentication')

// The two guards that decide whether a request is authenticated. #88 was a hole in both: the token
// only counted when it arrived as a cookie, and a session an anonymous request had already written
// to blocked it from being read at all.
describe('authentication guards', () => {
  let auth

  before(() => {
    const resource = () => ({ before () {}, after () {} })
    const cms = {
      _app: { use () {}, get () {}, post () {} },
      options: {},
      resource: () => resource(),
      bootstrapFunctions: [],
      _resourceNames: []
    }
    auth = new Authentication(cms, { auth: { secret: 'a-secret-long-enough-to-pass-the-check' } }, null)
  })

  describe('getTokenFromReq', () => {
    const req = (extra) => ({ body: {}, query: {}, headers: {}, ...extra })

    it('accepts the token from every channel it advertises', () => {
      expect(auth.getTokenFromReq(req({ body: { token: 'BODY' } })), 'body').to.equal('BODY')
      expect(auth.getTokenFromReq(req({ query: { token: 'QUERY' } })), 'query').to.equal('QUERY')
      expect(auth.getTokenFromReq(req({ headers: { 'x-access-token': 'HEADER' } })), 'header').to.equal('HEADER')
      expect(auth.getTokenFromReq(req({ session: { nodeCmsJwt: 'SESSION' } })), 'session').to.equal('SESSION')
      expect(auth.getTokenFromReq(req({ cookies: { nodeCmsJwt: 'COOKIE' } })), 'cookie').to.equal('COOKIE')
    })

    it('prefers an explicit token over the one the session is carrying', () => {
      const carrying = req({ headers: { 'x-access-token': 'HEADER' }, session: { nodeCmsJwt: 'SESSION' }, cookies: { nodeCmsJwt: 'COOKIE' } })
      expect(auth.getTokenFromReq(carrying)).to.equal('HEADER')
    })

    it('reports no token rather than throwing when a request carries none', () => {
      expect(auth.getTokenFromReq(req())).to.equal(false)
    })
  })

  describe('checkSessionData', () => {
    const session = (extra) => ({
      session: {
        nodeCmsJwt: 'a-token',
        nodeCmsUser: { username: 'localAdmin', group: { _id: 'g1' }, expiredAt: Date.now() + 60000 },
        ...extra
      }
    })

    it('accepts a session holding a token, a user, a group and a future expiry', () => {
      expect(() => auth.checkSessionData(session())).to.not.throw()
    })

    it('names what is missing', () => {
      expect(() => auth.checkSessionData({})).to.throw('session not found')
      expect(() => auth.checkSessionData(session({ nodeCmsJwt: false }))).to.throw('jwt not found')
      expect(() => auth.checkSessionData(session({ nodeCmsUser: false }))).to.throw('user not found')
      expect(() => auth.checkSessionData(session({ nodeCmsUser: { username: 'x' } }))).to.throw('user group not found')
    })

    it('rejects an expiry that is missing, unusable or past', () => {
      const withExpiry = (expiredAt) => session({ nodeCmsUser: { username: 'x', group: { _id: 'g1' }, expiredAt } })
      expect(() => auth.checkSessionData(withExpiry(undefined))).to.throw('expiredAt is not a number')
      expect(() => auth.checkSessionData(withExpiry(`${Date.now() + 60000}`))).to.throw('expiredAt is not a number')
      expect(() => auth.checkSessionData(withExpiry(Date.now() - 1))).to.throw('jwt expired')
    })
  })
})
