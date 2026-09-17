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
