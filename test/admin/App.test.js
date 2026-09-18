import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// The admin shell: grouping resources and plugins for the sidebar, the unsaved-changes guard that
// stands between a click and losing an edit, and the notification snackbar.
vi.mock('@s/TranslateService', () => ({ default: { get: key => key, locale: 'enUS', init: vi.fn(async () => ({})) } }))
vi.mock('@s/ConfigService', () => ({ default: { config: {}, init: vi.fn(async () => ({})) } }))
vi.mock('@s/ResourceService', () => ({ default: { get: vi.fn(() => []), cache: vi.fn(async () => []), schemas: [], init: vi.fn(async () => ({})) } }))
vi.mock('@s/RequestService', () => ({ default: { get: vi.fn(async () => ({})), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))
vi.mock('@s/LoginService', () => ({ default: { events: { on: vi.fn(), off: vi.fn() }, user: { theme: 'light' }, init: vi.fn(), getPlugins: vi.fn(async () => []), onLogout: vi.fn(), logout: vi.fn(), getStatus: vi.fn(async () => ({ username: 'localAdmin', group: 'admins' })) } }))
vi.mock('@s/NotificationsService', () => ({ default: { send: vi.fn(), sendOmnibarDisplayStatus: vi.fn(), events: { on: vi.fn(), off: vi.fn() } } }))
vi.mock('@s/FieldSelectorService', () => ({ default: { events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() }, highlightParagraph: vi.fn() } }))
vi.mock('@s/LoadingService', () => ({ default: { events: { on: vi.fn(), off: vi.fn() } } }))

const { default: App } = await import('@c/App.vue')
const { default: ConfigService } = await import('@s/ConfigService')

const app = () => mount(App, {
  shallow: true,
  global: {
    stubs: { RecycleScroller: { template: '<div />' } },
    mocks: { $filters: { translate: key => key }, $loading: { start: vi.fn(), stop: vi.fn() }, $vuetify: { theme: { dark: false } } }
  }
}).vm

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ConfigService.config = {}
    // `events` included because App subscribes to it on mount and unsubscribes on unmount;
    // without it the mount throws, which vitest reports as an unhandled rejection and which makes
    // the whole run exit non-zero even though every assertion passes.
    window.DialogService = { send: vi.fn(), show: vi.fn(), confirm: vi.fn(), events: { on: vi.fn(), off: vi.fn() } }
  })

  describe('grouping the sidebar', () => {
    it('keeps every resource, grouped or not, and puts the ungrouped under others', () => {
      const view = app()
      view.resourceList = [{ title: 'articles', group: 'Content' }, { title: 'loose' }]
      const groups = view.groupedList
      const others = groups.find(group => group.name === 'TL_OTHERS')
      const content = groups.find(group => group.name === 'Content')
      expect(content.list.map(item => item.title)).to.deep.equal(['articles'])
      expect(others.list.map(item => item.title)).to.deep.equal(['loose'])
    })

    // Plugins come off `window.plugins`, filtered by what the user's group is allowed and by the
    // list the server said this admin may show.
    it('marks every plugin as one and files them under their own heading', () => {
      vi.stubGlobal('plugins', [{ title: 'sync', displayname: 'Sync', pluginComponent: 'SyncResource' }])
      const view = app()
      view.resourceList = []
      view.allowedPlugins = ['Sync']
      const plugins = view.groupedList.find(group => group.name === 'TL_PLUGINS')
      expect(plugins.list.map(item => item.type)).to.deep.equal(['plugin'])
    })

    it('hides a plugin this admin was not allowed', () => {
      vi.stubGlobal('plugins', [{ title: 'sync', displayname: 'Sync' }])
      const view = app()
      view.resourceList = []
      view.allowedPlugins = []
      // The heading disappears with its contents rather than sitting there empty.
      expect(view.groupedList.find(group => group.name === 'TL_PLUGINS')).to.equal(undefined)
    })
  })

  describe('the theme', () => {
    it('follows vuetify, unless the config has turned dark mode off', () => {
      expect(app().getTheme()).to.equal('light')
      ConfigService.config = { disableDarkMode: true }
      expect(app().getTheme()).to.equal('light')
    })
  })

  describe('the toolbar title', () => {
    it('prefers the title for the current locale, then a plain one, then nothing', () => {
      ConfigService.config = { toolbarTitle: { enUS: 'My CMS' } }
      const localised = app()
      localised.setToolbarTitle()
      expect(localised.toolbarTitle).to.equal('My CMS')

      ConfigService.config = { toolbarTitle: 'Plain' }
      const plain = app()
      plain.setToolbarTitle()
      expect(plain.toolbarTitle).to.equal('Plain')

      ConfigService.config = {}
      const none = app()
      none.setToolbarTitle()
      expect(none.toolbarTitle).to.equal(false)
    })
  })

  describe('notifications', () => {
    it('shows a notification and classes it by its type', () => {
      const view = app()
      view.onGetNotification({ message: 'saved', type: 'success' })
      expect(view.showSnackBar).to.equal(true)
      expect(view.getNotificationClass()).to.equal('notification-success')
      view.resetNotification()
      expect(view.showSnackBar).to.equal(false)
    })
  })

  describe('the unsaved-changes guard', () => {
    it('asks before leaving a record with unsaved changes, and switches once forced', () => {
      const view = app()
      view.onGetRecordEdition(true)
      const other = { _id: 'r2' }
      view.selectRecord(other)
      expect(window.DialogService.show).toHaveBeenCalled()
      expect(view.selectedRecord).to.equal(null)

      // Asserted on the id rather than the object: what the component holds is a reactive proxy
      // of it, which is never identical to the object the test created.
      view.selectRecord(other, true)
      expect(view.selectedRecord._id).to.equal('r2')
    })

    it('switches straight away when nothing is being edited', () => {
      const view = app()
      const record = { _id: 'r1' }
      view.selectRecord(record)
      expect(view.selectedRecord._id).to.equal('r1')
      expect(window.DialogService.show).not.toHaveBeenCalled()
    })

    it('does not ask when the record clicked is the one already open', () => {
      const view = app()
      const record = { _id: 'r1' }
      view.selectRecord(record)
      view.onGetRecordEdition(true)
      view.selectRecord(view.selectedRecord)
      expect(window.DialogService.show).not.toHaveBeenCalled()
    })

    it('guards entering multiselect the same way', () => {
      const view = app()
      view.onGetRecordEdition(true)
      view.onSelectMultiselect(true)
      expect(window.DialogService.show).toHaveBeenCalled()
      expect(view.multiselect).to.equal(false)
    })

    it('clears the open record when multiselect is entered for real', () => {
      const view = app()
      view.selectedRecord = { _id: 'r1' }
      view.onSelectMultiselect(true)
      expect(view.multiselect).to.equal(true)
      expect(view.selectedRecord).to.equal(null)
    })
  })

  describe('the dialog itself', () => {
    it('forgets the question when it is cancelled', () => {
      const view = app()
      view.recordDialog = { event: 'selectRecord' }
      view.displayDialog = true
      view.cancelDialog()
      expect([view.recordDialog, view.displayDialog]).to.deep.equal([false, false])
    })

    it('hands the question back to the service when it is confirmed', () => {
      const view = app()
      const question = { event: 'selectRecord' }
      view.recordDialog = question
      view.confirmDialog()
      expect(window.DialogService.confirm).toHaveBeenCalledWith(question)
    })
  })
})
