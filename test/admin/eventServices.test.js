import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
vi.mock('@s/RequestService', () => ({ default: { get: (...args) => get(...args) } }))

const { default: DialogService } = await import('@s/DialogService')
const { default: NotificationsService } = await import('@s/NotificationsService')
const { default: FieldSelectorService } = await import('@s/FieldSelectorService')
const { default: LoadingService } = await import('@s/LoadingService')
const { default: ConfigService } = await import('@s/ConfigService')
const { default: Loading } = await import('../../src/modules/Loading')

// These are the admin's message bus: a tiny-emitter each, with the component on the other end.
// What is worth pinning is the event name and payload, because a typo in either is silent.
describe('event services', () => {
  const captured = (service, event) => {
    const calls = []
    service.events.on(event, (...args) => calls.push(args))
    return calls
  }

  it('DialogService announces editing state, show and confirm separately', () => {
    const dialog = captured(DialogService, 'dialog')
    const show = captured(DialogService, 'dialog:show')
    const confirm = captured(DialogService, 'dialog:confirm')
    DialogService.send(true)
    DialogService.show({ title: 'Title' })
    DialogService.confirm({ event: 'selectRecord' })
    expect(dialog).to.deep.equal([[true]])
    expect(show).to.deep.equal([[{ title: 'Title' }]])
    expect(confirm).to.deep.equal([[{ event: 'selectRecord' }]])
  })

  it('NotificationsService defaults a notification to success', () => {
    const calls = captured(NotificationsService, 'notification')
    NotificationsService.send('Saved')
    NotificationsService.send('Broke', 'error')
    expect(calls).to.deep.equal([[{ message: 'Saved', type: 'success' }], [{ message: 'Broke', type: 'error' }]])
  })

  it('NotificationsService reports omnibar visibility on its own channel', () => {
    const calls = captured(NotificationsService, 'omnibar-display-status')
    NotificationsService.sendOmnibarDisplayStatus(true)
    expect(calls).to.deep.equal([[true]])
  })

  it('FieldSelectorService carries the field and the paragraph coordinates', () => {
    const select = captured(FieldSelectorService, 'select')
    const highlight = captured(FieldSelectorService, 'highlight-paragraph')
    FieldSelectorService.select({ field: 'title' })
    FieldSelectorService.highlightParagraph(2, 5)
    expect(select).to.deep.equal([[{ field: 'title' }]])
    expect(highlight).to.deep.equal([[2, 5]])
  })
})

describe('LoadingService', () => {
  beforeEach(() => {
    LoadingService.list = []
  })

  // Overlapping requests are the normal case, so the spinner has to count rather than toggle.
  it('stays on until the last outstanding name has stopped', () => {
    const states = []
    LoadingService.events.on('has-loading', value => states.push(value))
    LoadingService.start('resources')
    LoadingService.start('records')
    LoadingService.stop('resources')
    expect(states).to.deep.equal([true, true, true])
    LoadingService.stop('records')
    expect(states).to.deep.equal([true, true, true, false])
  })

  it('ignores a stop for something that never started', () => {
    const states = []
    LoadingService.events.on('has-loading', value => states.push(value))
    LoadingService.stop('never-started')
    expect(states).to.deep.equal([false])
    expect(LoadingService.list).to.deep.equal([])
  })
})

describe('ConfigService', () => {
  beforeEach(() => {
    get.mockReset()
    ConfigService.config = {}
  })

  it('keeps what the server sent', async () => {
    get.mockResolvedValue({ disableAnonymous: true })
    await ConfigService.init()
    expect(ConfigService.config).to.deep.equal({ disableAnonymous: true })
    expect(get.mock.calls[0][0]).to.contain('config')
  })

  // The admin has to render even with no config, so a failure here is logged and swallowed.
  it('logs and leaves the config alone when the request fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    get.mockRejectedValue(new Error('offline'))
    await ConfigService.init()
    expect(ConfigService.config).to.deep.equal({})
    expect(error).toHaveBeenCalled()
  })
})

describe('Loading plugin', () => {
  it('exposes the loading service as $loading on every component', () => {
    const app = { config: { globalProperties: {} } }
    Loading.install(app, { some: 'option' })
    expect(app.config.globalProperties.$loading).to.equal(LoadingService)
    expect(Loading.params).to.deep.equal({ some: 'option' })
  })
})
