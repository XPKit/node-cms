import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// The ctrl-/ search over resources and fields. What is worth pinning is which list it searches,
// which icon a result gets, and what selecting one does - switch resource, or focus a field.
vi.mock('@s/TranslateService', () => ({ default: { get: key => key, locale: 'enUS' } }))
const emit = vi.fn()
vi.mock('@s/FieldSelectorService', () => ({ default: { events: { on: vi.fn(), off: vi.fn(), emit }, highlightParagraph: vi.fn() } }))
const sendOmnibarDisplayStatus = vi.fn()
vi.mock('@s/NotificationsService', () => ({ default: { send: vi.fn(), sendOmnibarDisplayStatus, events: { on: vi.fn(), off: vi.fn() } } }))
vi.mock('@s/ResourceService', () => ({ default: { get: vi.fn(() => []), cache: vi.fn(async () => []) } }))

const { default: Omnibar } = await import('@c/Omnibar.vue')

const mountBar = (props = {}) => mount(Omnibar, {
  props: { groupedList: [], selectedItem: {}, ...props },
  shallow: true,
  global: { mocks: { $filters: { translate: key => key }, $loading: { start: vi.fn(), stop: vi.fn() } } }
})

describe('Omnibar', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('what it searches', () => {
    it('searches resources and fields together by default', () => {
      const bar = mountBar()
      bar.vm.resourcesList = [{ type: 'resource' }]
      bar.vm.fieldsList = [{ type: 'field' }]
      expect(bar.vm.getDataForSearch()).to.have.length(2)
    })

    it('narrows to one kind when a mode is chosen', () => {
      const bar = mountBar()
      bar.vm.resourcesList = [{ type: 'resource' }]
      bar.vm.fieldsList = [{ type: 'field' }, { type: 'field' }]
      bar.vm.setSearchMode('resource')
      expect(bar.vm.getDataForSearch()).to.have.length(1)
      bar.vm.setSearchMode('field')
      expect(bar.vm.getDataForSearch()).to.have.length(2)
    })

    it('clears what was typed when the mode changes, so results cannot outlive it', () => {
      const bar = mountBar()
      bar.vm.search = 'something'
      bar.vm.setSearchMode('field')
      expect(bar.vm.search).to.equal('')
    })
  })

  describe('showing a result', () => {
    it('gives a resource a package icon and a field a cursor', () => {
      const { vm } = mountBar()
      expect([vm.getIcon('resource'), vm.getIcon('field')]).to.deep.equal(['$package', '$cursorText'])
    })

    it('reads the type off the result while searching everything, and off the mode otherwise', () => {
      const bar = mountBar()
      expect(bar.vm.getIconForResult({ type: 'field' })).to.equal('$cursorText')
      bar.vm.setSearchMode('resource')
      expect(bar.vm.getIconForResult({ type: 'field' })).to.equal('$package')
    })

    it('highlights the characters the fuzzy match landed on', () => {
      const { vm } = mountBar()
      expect(vm.isCharHighlighted({ _indexes: { 0: 2, 1: 5 } }, 5)).to.equal(true)
      expect(vm.isCharHighlighted({ _indexes: { 0: 2 } }, 4)).to.equal(false)
    })

    it('knows a result that belongs to the resource already on screen', () => {
      const bar = mountBar({ selectedItem: { displayname: 'Articles' } })
      expect(bar.vm.isResultInCurrentResource([{ target: 'Articles.title' }])).to.equal(true)
      expect(bar.vm.isResultInCurrentResource([{ target: 'Cities.name' }])).to.equal(false)
    })
  })

  describe('choosing a result', () => {
    it('switches resource when the result belongs to another one', () => {
      const selectResourceCallback = vi.fn()
      vi.spyOn(console, 'info').mockImplementation(() => {})
      const bar = mountBar({ selectResourceCallback })
      const cities = { type: 'resource', title: 'cities' }
      bar.vm.results = [cities]
      bar.vm.selectResult(0)
      expect(selectResourceCallback).toHaveBeenCalledWith(cities)
    })

    it('focuses the field when the result is already in the resource on screen', () => {
      const current = { type: 'resource', title: 'articles' }
      const bar = mountBar({ selectedItem: current })
      bar.vm.results = [{ type: 'field', field: 'title', resource: bar.vm.selectedItem }]
      bar.vm.selectResult(0)
      expect(emit).toHaveBeenCalledWith('select', { type: 'field', field: 'title' })
    })

    it('does nothing at all when there is no result at that position', () => {
      const bar = mountBar()
      bar.vm.results = []
      bar.vm.selectResult(0)
      expect(emit).not.toHaveBeenCalled()
      expect(sendOmnibarDisplayStatus).not.toHaveBeenCalled()
    })

    it('closes itself once a result has been taken', () => {
      const bar = mountBar({ selectResourceCallback: vi.fn() })
      vi.spyOn(console, 'info').mockImplementation(() => {})
      bar.vm.results = [{ type: 'resource', title: 'cities' }]
      bar.vm.showOmnibar = true
      bar.vm.selectResult(0)
      expect(bar.vm.showOmnibar).to.equal(false)
      expect(sendOmnibarDisplayStatus).toHaveBeenCalledWith(false)
    })
  })

  describe('opening and closing', () => {
    it('tells the rest of the admin it is open, so their shortcuts stand down', () => {
      const bar = mountBar()
      bar.vm.showHideOmnibar(false)
      expect(sendOmnibarDisplayStatus).toHaveBeenCalledWith(false)
      expect(bar.vm.showOmnibar).to.equal(false)
    })

    it('offers only the opening chord while closed, and the full set once open', () => {
      const bar = mountBar()
      expect(bar.vm.getShortcuts()).to.deep.equal({ open: ['ctrl', 'p'] })

      bar.vm.showOmnibar = true
      expect(bar.vm.getShortcuts()).to.deep.equal({
        esc: ['esc'],
        open: ['ctrl', 'p'],
        'arrow-up': ['arrowup'],
        'arrow-down': ['arrowdown'],
        enter: ['enter'],
        all: ['shift', 'a'],
        resource: ['shift', 'r'],
        field: ['shift', 'f']
      })
    })

    it('notices when the results have been scrolled to the bottom', () => {
      const bar = mountBar()
      bar.vm.onScroll({ target: { scrollTop: 400, clientHeight: 100, scrollHeight: 500 } })
      expect(bar.vm.scrolledToBottom).to.equal(true)
    })
  })
})
