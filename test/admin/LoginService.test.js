import { beforeEach, describe, expect, it, vi } from 'vitest'

// #87: logged out, /admin/login answers {}, and the uptime lookup fell back to the current time,
// which is always newer than the one in the cookie. Every other poll therefore decided the server
// had restarted and reloaded the page, wiping whatever had been typed into the login form.
const responses = []
vi.mock('@s/RequestService', () => ({
  default: {
    get: vi.fn(async () => responses.shift()),
    post: vi.fn(async () => ({}))
  }
}))

const { default: LoginService } = await import('@s/LoginService')
const { default: VueCookies } = await import('vue-cookies')

describe('LoginService.getStatus', () => {
  const user = { username: 'localAdmin', group: 'admins', uptime: 1000 }
  let reloads

  beforeEach(() => {
    responses.length = 0
    reloads = 0
    LoginService.user = null
    VueCookies.remove('uptime')
    vi.spyOn(window.location, 'reload').mockImplementation(() => {
      reloads += 1
    })
  })

  it('remembers the server boot time the first time it sees one', async () => {
    responses.push(user)
    await LoginService.getStatus()
    expect(VueCookies.get('uptime')).to.equal('1000')
    expect(reloads).to.equal(0)
  })

  it('reloads once when the server reports a newer boot time', async () => {
    responses.push(user, { ...user, uptime: 2000 })
    await LoginService.getStatus()
    await LoginService.getStatus()
    expect(reloads).to.equal(1)
  })

  it('stays put while the boot time is unchanged', async () => {
    responses.push(user, { ...user }, { ...user })
    await LoginService.getStatus()
    await LoginService.getStatus()
    await LoginService.getStatus()
    expect(reloads).to.equal(0)
  })

  // The regression itself. Logged out, every poll answers {}: the first used to store the current
  // time as the server's boot time, and the next one read its own clock as proof of a restart.
  it('does not reload, or store anything, while logged out', async () => {
    responses.push({}, {}, {})
    await LoginService.getStatus()
    await LoginService.getStatus()
    await LoginService.getStatus()
    expect(reloads, 'a logged-out poll is not a restart').to.equal(0)
    expect(VueCookies.get('uptime'), 'nothing worth remembering was in the response').to.equal(null)
  })

  it('logs out when a session disappears from under it', async () => {
    responses.push(user, {})
    await LoginService.getStatus()
    await LoginService.getStatus()
    expect(LoginService.user, 'the logged-in user was dropped').to.equal(null)
  })

  it('ignores an unusable boot time rather than guessing', async () => {
    responses.push(user, { ...user, uptime: 'soon' })
    await LoginService.getStatus()
    await LoginService.getStatus()
    expect(reloads).to.equal(0)
  })
})

// The rest of the service: everything getStatus does not touch. The mocked RequestService.get
// above answers from the same `responses` queue, so a case says what the server replied and then
// asserts what the service did with it.
const { default: RequestService } = await import('@s/RequestService')

describe('LoginService', () => {
  let reloads

  beforeEach(() => {
    responses.length = 0
    reloads = 0
    LoginService.user = null
    LoginService.logoutCallbackList = []
    vi.clearAllMocks()
    vi.spyOn(window.location, 'reload').mockImplementation(() => { reloads += 1 })
  })

  describe('getPlugins', () => {
    it('returns the plugins of the group the user belongs to', async () => {
      LoginService.user = { username: 'someone', group: 'editors' }
      responses.push([{ name: 'admins', plugins: ['sync'] }, { name: 'editors', plugins: ['import'] }])
      expect(await LoginService.getPlugins()).to.deep.equal(['import'])
    })

    it('returns nothing for a user whose group is not among them', async () => {
      LoginService.user = { username: 'someone', group: 'nobody' }
      responses.push([{ name: 'admins', plugins: ['sync'] }])
      expect(await LoginService.getPlugins()).to.deep.equal([])
    })
  })

  describe('checkStatus', () => {
    it('logs out when the session has gone and there was a user before', async () => {
      LoginService.user = { username: 'someone' }
      responses.push({}, {})
      await LoginService.checkStatus()
      expect(LoginService.user).to.equal(null)
      expect(RequestService.get.mock.calls.map(call => call[0])).to.include('/logout')
    })

    it('does nothing when there was no user to begin with', async () => {
      responses.push({})
      await LoginService.checkStatus()
      expect(RequestService.get.mock.calls.map(call => call[0])).to.not.include('/logout')
    })
  })

  describe('logout', () => {
    it('drops the user, tells the server, reloads, and runs the callbacks', async () => {
      const onLogout = vi.fn()
      LoginService.onLogout(onLogout)
      LoginService.user = { username: 'someone' }
      responses.push({})
      await LoginService.logout()
      expect(LoginService.user).to.equal(null)
      expect(RequestService.get).toHaveBeenCalledWith('/logout')
      expect(reloads).to.equal(1)
      expect(onLogout).toHaveBeenCalledOnce()
    })

    it('still runs the callbacks when the server cannot be reached', async () => {
      const onLogout = vi.fn()
      LoginService.onLogout(onLogout)
      vi.spyOn(console, 'error').mockImplementation(() => {})
      RequestService.get.mockRejectedValueOnce(new Error('offline'))
      await LoginService.logout()
      expect(LoginService.user).to.equal(null)
      expect(onLogout).toHaveBeenCalledOnce()
      expect(reloads).to.equal(0)
    })
  })

  describe('changeTheme', () => {
    it('announces the new theme before asking the server for it', async () => {
      const heard = []
      LoginService.events.on('changed-theme', theme => heard.push(theme))
      LoginService.user = { theme: 'dark' }
      responses.push({})
      // Asserting the return value, not just the user: everything after the request sits inside
      // one try/catch, so a throw in the body-class line below would be swallowed and the theme on
      // the user would still look right. Only the returned value proves the whole path ran.
      expect(await LoginService.changeTheme()).to.equal('light')
      expect(heard).to.deep.equal(['light'])
      expect(RequestService.get).toHaveBeenCalledWith('/changeTheme/light')
      expect(LoginService.user.theme).to.equal('light')
      expect(document.body.classList.toString()).to.contain('v-theme--light')
    })

    it('goes back to dark from light, and treats an unknown theme as dark', async () => {
      LoginService.user = { theme: 'light' }
      responses.push({})
      await LoginService.changeTheme()
      expect(LoginService.user.theme).to.equal('dark')
      LoginService.user = {}
      responses.push({})
      await LoginService.changeTheme()
      expect(LoginService.user.theme).to.equal('light')
    })
  })

  describe('checkPermission', () => {
    it('answers whether the user group carries the module', () => {
      LoginService.user = { group: { modules: ['articles', 'cities'] } }
      expect(LoginService.checkPermission('articles')).to.equal(true)
      expect(LoginService.checkPermission('users')).to.equal(false)
    })

    // Worth knowing rather than a defect to fix here: there is no guard, so asking before a user
    // is loaded throws rather than answering false. Every caller today asks from a rendered admin,
    // which cannot render without one.
    it('throws when asked before anyone has logged in', () => {
      LoginService.user = null
      expect(() => LoginService.checkPermission('articles')).to.throw(TypeError)
    })
  })
})
