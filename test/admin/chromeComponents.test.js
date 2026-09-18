import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// The chrome around the record editor: the nav bar, the multiselect page and the websocket banner
// that says another session has changed something.
vi.mock('@s/TranslateService', () => ({ default: { get: (key, params) => (params ? `${key}:${JSON.stringify(params)}` : key), locale: 'enUS' } }))
const cache = vi.fn(async () => [{ title: 'My CMS', logo: [{ url: '/logo.png' }] }])
vi.mock('@s/ResourceService', () => ({ default: { cache, get: vi.fn(() => []), getSchema: vi.fn() } }))
const deletes = []
vi.mock('@s/RequestService', () => ({ default: { delete: vi.fn(async url => deletes.push(url)), post: vi.fn(), put: vi.fn(), get: vi.fn() } }))
vi.mock('@s/NotificationsService', () => ({ default: { send: vi.fn(), sendOmnibarDisplayStatus: vi.fn() } }))
vi.mock('@s/LoginService', () => ({ default: { events: { on: vi.fn() }, user: {} } }))
vi.mock('@s/FieldSelectorService', () => ({ default: { events: { on: vi.fn(), off: vi.fn() }, highlightParagraph: vi.fn() } }))

const { default: NavBar } = await import('@c/NavBar.vue')
const { default: MultiselectPage } = await import('@c/MultiselectPage.vue')
const { default: UpdatesNotifier } = await import('@c/UpdatesNotifier.vue')

const mountIt = (component, props = {}) => mount(component, {
  props,
  shallow: true,
  global: { mocks: { $filters: { translate: key => key }, $loading: { start: vi.fn(), stop: vi.fn() } } }
})

describe('NavBar', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the logo the settings resource carries, and falls back to the bundled one', async () => {
    const bar = mountIt(NavBar)
    await bar.vm.$nextTick()
    expect(bar.vm.getLogo()).to.equal('/logo.png')
    expect(bar.vm.getDefaultLogo()).to.be.a('string')
  })

  it('puts the configured title into the browser tab', async () => {
    const bar = mountIt(NavBar)
    await bar.vm.$nextTick()
    expect(bar.vm.hasLogoOrTitle()).to.be.ok
    expect(window.document.title).to.equal('My CMS')
  })

  it('says it has neither when the settings resource is empty', async () => {
    cache.mockResolvedValueOnce([])
    const bar = mountIt(NavBar)
    await bar.vm.$nextTick()
    expect(bar.vm.getLogo()).to.equal(false)
    expect(bar.vm.hasLogoOrTitle()).to.equal(false)
  })

  it('survives a settings resource it cannot read', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    cache.mockRejectedValueOnce(new Error('no'))
    const bar = mountIt(NavBar)
    await bar.vm.$nextTick()
    expect(error).toHaveBeenCalled()
    expect(bar.vm.getLogo()).to.equal(false)
  })

  it('names the selected item by its display name, translated, or its name', () => {
    expect(mountIt(NavBar, { selectedItem: { displayname: 'TL_ARTICLES', name: 'articles' } }).vm.getSelectedItemName()).to.equal('TL_ARTICLES')
    expect(mountIt(NavBar, { selectedItem: { name: 'articles' } }).vm.getSelectedItemName()).to.equal('articles')
  })
})

describe('MultiselectPage', () => {
  beforeEach(() => { deletes.length = 0; vi.clearAllMocks() })

  const page = (props = {}) => mountIt(MultiselectPage, { resource: { title: 'articles', schema: [] }, multiselectItems: [], ...props })

  it('notices when the list has been scrolled to the bottom, with room to spare', () => {
    const view = page()
    view.vm.onScroll({ target: { scrollTop: 0, clientHeight: 100, scrollHeight: 500 } })
    expect(view.vm.scrolledToBottom).to.equal(false)
    view.vm.onScroll({ target: { scrollTop: 360, clientHeight: 100, scrollHeight: 500 } })
    expect(view.vm.scrolledToBottom).to.equal(true)
  })

  it('drops one item from the selection and announces the rest', () => {
    const items = [{ _id: 'a' }, { _id: 'b' }]
    const view = page({ multiselectItems: items })
    view.vm.deselectItem({ _id: 'a' })
    expect(view.emitted('changeMultiselectItems')[0][0]).to.deep.equal([{ _id: 'b' }])
  })

  it('deletes every selected record once the confirmation is accepted', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    const view = page({ multiselectItems: [{ _id: 'a' }, { _id: 'b' }] })
    await view.vm.onClickDelete()
    expect(deletes).to.deep.equal(['../api/articles/a', '../api/articles/b'])
    expect(view.emitted('updateRecordList')).to.have.length(1)
    expect(view.emitted('cancel')).to.have.length(1)
  })

  it('deletes nothing when the confirmation is declined', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))
    const view = page({ multiselectItems: [{ _id: 'a' }] })
    await view.vm.onClickDelete()
    expect(deletes).to.deep.equal([])
    expect(view.emitted('cancel')).to.equal(undefined)
  })

  it('carries on through a record it cannot delete, and still finishes', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { default: RequestService } = await import('@s/RequestService')
    RequestService.delete.mockRejectedValueOnce(new Error('locked'))
    const view = page({ multiselectItems: [{ _id: 'a' }, { _id: 'b' }] })
    await view.vm.onClickDelete()
    expect(deletes).to.deep.equal(['../api/articles/b'])
    expect(view.emitted('cancel')).to.have.length(1)
  })
})

describe('UpdatesNotifier', () => {
  beforeEach(() => {
    vi.stubGlobal('WebSocket', class { constructor () { this.readyState = 0 } close () {} send () {} })
  })

  const notifier = (props = {}) => mountIt(UpdatesNotifier, { selectedResource: {}, selectedRecord: false, ...props })

  it('describes an update to the record on screen differently from one elsewhere', async () => {
    const view = notifier({ selectedRecord: { _id: 'a1' } })
    view.vm.receivedUpdate = { data: { _id: 'a1' } }
    expect([view.vm.recordOrResource(), view.vm.getTitle(), view.vm.getDescription()])
      .to.deep.equal(['RECORD', 'TL_WS_UPDATES_RECORD_TITLE', 'TL_WS_UPDATES_RECORD_DESCRIPTION'])

    view.vm.receivedUpdate = { data: { _id: 'other' } }
    expect([view.vm.recordOrResource(), view.vm.getTitle()]).to.deep.equal(['RESOURCE', 'TL_WS_UPDATES_RESOURCE_TITLE'])
  })

  // The two defaults differ on purpose - '?' against '??' - so an update carrying no id and a
  // screen showing no record are not mistaken for each other.
  it('does not call an update about nothing the same record as no record', () => {
    expect(notifier().vm.isSameRecord()).to.equal(false)
  })

  it('reports which of the three connection states it is in', () => {
    const view = notifier()
    expect(view.vm.getConnectionStatus()).to.equal('TL_WS_UPDATES_RECONNECTING')
    view.vm.isConnected = true
    expect(view.vm.getConnectionStatus()).to.equal('TL_WS_UPDATES_CONNECTED')
    view.vm.isConnecting = true
    expect(view.vm.getConnectionStatus()).to.equal('TL_WS_UPDATES_CONNECTING')
  })

  it('asks for a reload naming the record that changed, then forgets the update', () => {
    const view = notifier()
    view.vm.receivedUpdate = { data: { _id: 'a1' } }
    view.vm.reloadResource()
    expect(view.emitted('reloadResource')[0]).to.deep.equal(['a1'])
    expect(view.vm.receivedUpdate).to.equal(false)
  })
})
