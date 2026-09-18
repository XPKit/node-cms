import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// The four small shared mixins. AbstractField and FileInputField carry enough behaviour to have
// their own files; these are a handful of lines each and were the last of src/mixins at 0%.
const handlers = {}
const loginService = { events: { on: vi.fn((event, cb) => { handlers[event] = cb }) }, user: {} }
const send = vi.fn()
const sendOmnibarDisplayStatus = vi.fn()

vi.mock('@s/LoginService', () => ({ default: loginService }))
vi.mock('@s/NotificationsService', () => ({ default: { send, sendOmnibarDisplayStatus } }))

const { default: FieldTheme } = await import('@m/FieldTheme')
const { default: Notification } = await import('@m/Notification')
const { default: DragList } = await import('@m/DragList')
const { default: customJavaScript } = await import('@m/CustomHighlight')

const host = (mixin) => mount({ mixins: [mixin], template: '<div />' })

describe('FieldTheme', () => {
  beforeEach(() => { loginService.user = {} })

  it('takes the theme from the signed-in user, defaulting to light', () => {
    expect(host(FieldTheme).vm.theme).to.equal('light')
    loginService.user = { theme: 'dark' }
    expect(host(FieldTheme).vm.theme).to.equal('dark')
  })

  it('follows the theme when it changes after mount', async () => {
    const component = host(FieldTheme)
    handlers['changed-theme']('dark')
    await component.vm.$nextTick()
    expect(component.vm.theme).to.equal('dark')
  })
})

describe('Notification', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends the message on and logs it at the matching level', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    host(Notification).vm.notify('careful', 'warn')
    expect(send).toHaveBeenCalledWith('careful', 'warn')
    expect(warn).toHaveBeenCalledWith('careful')
  })

  it('defaults to success, which console has no method for, so it logs as info', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    host(Notification).vm.notify('done')
    expect(send).toHaveBeenCalledWith('done', 'success')
    expect(info).toHaveBeenCalledWith('done')
  })

  it('passes the omnibar status straight through', () => {
    host(Notification).vm.sendOmnibarDisplayStatus(true)
    expect(sendOmnibarDisplayStatus).toHaveBeenCalledWith(true)
  })
})

describe('DragList', () => {
  it('keys a row by filename and the first identifier the record carries', () => {
    const { vm } = host(DragList)
    expect(vm.getKey({ _filename: 'a.png', _id: 'id1', _size: 9 })).to.equal('a.png-id1')
    expect(vm.getKey({ _filename: 'a.png', _createdAt: 123, _size: 9 })).to.equal('a.png-123')
    expect(vm.getKey({ _filename: 'a.png', _md5sum: 'abc' })).to.equal('a.png-abc')
    expect(vm.getKey({ _filename: 'a.png', _size: 9 })).to.equal('a.png-9')
  })

  it('gives each list its own key so two lists cannot collide', () => {
    expect(host(DragList).vm.key).to.not.equal(host(DragList).vm.key)
  })
})

describe('CustomHighlight', () => {
  it('puts its own operator, variable and keyword rules ahead of the javascript ones', async () => {
    const { default: hljs } = await import('highlight.js/lib/core')
    const language = customJavaScript(hljs)
    expect(language.contains.slice(0, 3).map(rule => rule.className)).to.deep.equal(['operator', 'variable', 'keyword'])
  })

  it('matches the operators and the lodash underscore it was added for', async () => {
    const { default: hljs } = await import('highlight.js/lib/core')
    const [operator, variable] = customJavaScript(hljs).contains
    expect(operator.match.test('===')).to.equal(true)
    expect(variable.match.test('_')).to.equal(true)
  })
})
