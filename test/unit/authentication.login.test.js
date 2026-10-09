const chai = require('chai')
const expect = chai.expect
const createDebug = require('debug')
const Authentication = require('../../lib/plugins/authentication')

// #127: the login handler logged the whole request body, so every attempt wrote the submitted
// password to stderr and to logs/logs.txt.
describe('onPostLogin', () => {
  let auth
  let previousNamespaces
  let previousEnv

  before(() => {
    // A DEBUG set in the environment can switch the logger off, and then the test would pass
    // without having seen a single line.
    previousEnv = process.env.DEBUG
    previousNamespaces = createDebug.disable()
    createDebug.enable('node-cms:*')
    const resource = () => ({ before () {}, after () {} })
    const cms = {
      _app: { use () {}, get () {}, post () {} },
      options: {},
      resource: () => resource(),
      bootstrapFunctions: [],
      _resourceNames: []
    }
    auth = new Authentication(cms, { auth: { secret: 'a-secret-long-enough-to-pass-the-check' } }, null)
    auth.authenticateJwt = async () => ({ error: { code: 401, message: 'wrong credentials' } })
  })

  after(() => {
    createDebug.enable(previousNamespaces)
    // enable() also writes the filter to process.env.DEBUG; put back what was there.
    if (previousEnv === undefined) {
      delete process.env.DEBUG
    } else {
      process.env.DEBUG = previousEnv
    }
  })

  // Every logger line goes through process.stderr.write, so capturing it captures what was logged.
  const captureStderr = async (fn) => {
    const write = process.stderr.write
    let captured = ''
    process.stderr.write = (chunk) => {
      captured += chunk
      return true
    }
    try {
      await fn()
    } finally {
      process.stderr.write = write
    }
    return captured
  }

  it('never logs the submitted password', async () => {
    const password = 'do-not-log-this-password'
    const res = { status () { return this }, json () { return this } }
    const logged = await captureStderr(() => auth.onPostLogin({ body: { username: 'localAdmin', password } }, res))
    expect(logged, 'the capture saw the handler log').to.contain('POST /admin/login called')
    expect(logged).to.not.contain(password)
  })
})
