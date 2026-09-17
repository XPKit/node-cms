import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// Driving this form from a browser is how the admin bugs in #87 and #88 were found, and the thing
// that cost the most time was not knowing when the submit button is live: it stays inert until both
// fields have a value, so a click landing a moment early does nothing at all and says nothing.
const posts = []
vi.mock('@s/RequestService', () => ({
  default: {
    get: vi.fn(async () => ({})),
    post: vi.fn(async (url, body) => {
      posts.push({ url, body })
      return {}
    })
  }
}))
vi.mock('@s/LoginService', () => ({ default: { init: vi.fn() } }))
vi.mock('@s/ConfigService', () => ({ default: { init: vi.fn(async () => ({})) } }))
vi.mock('@s/TranslateService', () => ({ default: { init: vi.fn(async () => ({})) } }))
vi.mock('@s/LoadingService', () => ({ default: { events: { on: vi.fn(), off: vi.fn() } } }))

const { default: LoginApp } = await import('@c/LoginApp.vue')

describe('LoginApp', () => {
  // mounted() waits on the config and translation services before it renders the form at all.
  const mountForm = async () => {
    const wrapper = mount(LoginApp, {
      global: {
        stubs: { 'v-app': { template: '<div><slot /></div>' }, loading: true },
        mocks: { $filters: { translate: key => key }, $loading: { start: vi.fn(), stop: vi.fn() } }
      }
    })
    await vi.waitUntil(() => wrapper.find('form').exists(), { timeout: 2000 })
    return wrapper
  }

  const fill = async (wrapper, username, password) => {
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue(username)
    await inputs[1].setValue(password)
  }

  beforeEach(() => {
    posts.length = 0
    vi.spyOn(window.location, 'reload').mockImplementation(() => {})
  })

  it('holds the submit button inert until both fields have a value', async () => {
    const wrapper = await mountForm()
    expect(wrapper.find('.login-btn-wrapper').classes(), 'empty').to.include('disabled')
    await fill(wrapper, 'localAdmin', '')
    expect(wrapper.find('.login-btn-wrapper').classes(), 'username only').to.include('disabled')
    await fill(wrapper, 'localAdmin', 'localAdmin')
    expect(wrapper.find('.login-btn-wrapper').classes(), 'both filled').to.not.include('disabled')
  })

  it('posts the credentials when the form is submitted', async () => {
    const wrapper = await mountForm()
    await fill(wrapper, 'localAdmin', 'a-password')
    await wrapper.find('form').trigger('submit')
    expect(posts).to.have.lengthOf(1)
    expect(posts[0].url).to.contain('login')
    expect(posts[0].body).to.deep.equal({ username: 'localAdmin', password: 'a-password' })
  })

  it('posts nothing when a field is still empty', async () => {
    const wrapper = await mountForm()
    await fill(wrapper, 'localAdmin', '')
    await wrapper.find('form').trigger('submit')
    expect(posts, 'submitting an incomplete form is a no-op').to.be.empty
  })

  it('shows the failure message when the credentials are refused', async () => {
    const RequestService = (await import('@s/RequestService')).default
    RequestService.post.mockRejectedValueOnce(new Error('nope'))
    const wrapper = await mountForm()
    await fill(wrapper, 'localAdmin', 'wrong')
    await wrapper.find('form').trigger('submit')
    await vi.waitUntil(() => wrapper.find('.error-message').exists(), { timeout: 2000 })
    expect(wrapper.find('.error-message').text()).to.equal('TL_LOGIN_FAIL')
  })
})
