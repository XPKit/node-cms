import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { markRaw } from 'vue'

// The record list down the middle of the admin: searching, sorting and multi-selecting. The search
// is the interesting part - it matches a record on its searchable fields, on its id, or on a sift
// query typed into the same box.
vi.mock('@s/TranslateService', () => ({ default: { get: key => key, locale: 'enUS' } }))
const send = vi.fn()
vi.mock('@s/NotificationsService', () => ({ default: { send, sendOmnibarDisplayStatus: vi.fn(), events: { on: vi.fn(), off: vi.fn() } } }))
vi.mock('@s/ResourceService', () => ({ default: { get: vi.fn(() => []), cache: vi.fn(async () => []) } }))

const { default: RecordList } = await import('@c/RecordList.vue')

const resource = (extra = {}) => ({ title: 'articles', schema: [{ field: 'title', searchable: true }], ...extra })
const mountList = (props = {}) => mount(RecordList, {
  props: { resource: resource(), list: [], ...props },
  shallow: true,
  global: {
    // RecycleScroller is given a stub that drops its slot: the default shallow stub still renders
    // the scoped slot, with no slot props, and the template destructures `{ item }` out of it.
    stubs: { RecycleScroller: { template: '<div />' } },
    mocks: { $filters: { translate: key => key }, $loading: { start: vi.fn(), stop: vi.fn() } }
  }
})

// markRaw, and not for tidiness: `filteredList` is a computed that stamps `_searchable` onto every
// record it reads, so with reactive records it invalidates itself and Vue aborts the render with
// 'Maximum recursive updates exceeded' - which vitest reports as an unhandled rejection and which
// makes the run exit non-zero. Keeping the records raw stops the mutation being tracked.
const records = [
  markRaw({ _id: 'r1', title: 'Alpha', _updatedAt: 3000, _updatedBy: 'admins~alice' }),
  markRaw({ _id: 'r2', title: 'beta', _updatedAt: 1000, _updatedBy: '~API' }),
  markRaw({ _id: 'r3', title: 'Gamma', _updatedAt: 2000 })
]

describe('RecordList', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('describing a record', () => {
    it('shows who last touched it, keeping only the name', () => {
      const { vm } = mountList()
      expect(vm.getUpdatedBy({ _updatedBy: 'admins~alice' })).to.equal('alice')
      expect(vm.getUpdatedBy({ _updatedBy: '~API' })).to.equal('API')
      expect(vm.getUpdatedBy({})).to.equal('API')
    })

    it('says how long ago it changed', () => {
      const { vm } = mountList()
      expect(vm.getTimeAgo({ _updatedAt: Date.now() - 60 * 60 * 1000 })).to.contain('hour')
    })

    it('marks the search term inside a value it shows', () => {
      const list = mountList()
      list.vm.search = 'lph'
      expect(list.vm.renderBaseOnSearch('Alpha')).to.equal('A<strong>lph</strong>a')
    })

    it('leaves the value alone when nothing is being searched for', () => {
      expect(mountList().vm.renderBaseOnSearch('Alpha')).to.equal('Alpha')
    })
  })

  describe('counting', () => {
    it('reports how many records it holds and how many the resource allows', () => {
      const list = mountList({ list: records, resource: resource({ maxCount: 10 }) })
      expect([list.vm.listCount, list.vm.maxCount]).to.deep.equal([3, 10])
    })

    it('treats a resource with no cap as zero, meaning no cap', () => {
      expect(mountList().vm.maxCount).to.equal(0)
    })
  })

  describe('searching', () => {
    it('returns everything while the box is empty', () => {
      expect(mountList({ list: records }).vm.filteredList).to.have.length(3)
    })

    it('matches a searchable field, ignoring case, and says why it matched', () => {
      const list = mountList({ list: records })
      list.vm.search = 'ALPHA'
      const found = list.vm.filteredList
      expect(found.map(record => record._id)).to.deep.equal(['r1'])
      expect(found[0]._searchable).to.deep.equal({ id: false, keyFields: true, query: false })
    })

    it('matches a record id when no field matches', () => {
      const list = mountList({ list: records })
      list.vm.search = 'r2'
      const found = list.vm.filteredList
      expect(found.map(record => record._id)).to.deep.equal(['r2'])
      expect(found[0]._searchable.id).to.equal(true)
    })

    it('falls back to the first field of the schema when none is marked searchable', () => {
      const list = mountList({ list: records, resource: resource({ schema: [{ field: 'title' }] }) })
      list.vm.search = 'gamma'
      expect(list.vm.filteredList.map(record => record._id)).to.deep.equal(['r3'])
    })

    // Driven through the box rather than by setting `sift` and `query`: the watcher on `search` is
    // what recognises the `sift:` prefix and parses the rest as JSON5, and setting its results by
    // hand would leave a regression in that watcher invisible.
    it('filters by a sift query when one has been typed into the search box', async () => {
      const list = mountList({ list: records })
      list.vm.search = 'sift:{title: "beta"}'
      await list.vm.$nextTick()
      expect(list.vm.sift).to.deep.equal({ isQuery: true, isValid: true })
      const found = list.vm.filteredList
      expect(found.map(record => record._id)).to.deep.equal(['r2'])
      expect(found[0]._searchable.query).to.equal(true)
    })

    it('marks a sift query it cannot parse as invalid, and matches nothing on it', async () => {
      const list = mountList({ list: records })
      list.vm.search = 'sift:{not json5'
      await list.vm.$nextTick()
      expect(list.vm.sift.isValid).to.equal(false)
      expect(list.vm.query).to.deep.equal({})
    })
  })

  describe('sorting', () => {
    it('puts the most recently updated first by default', () => {
      const list = mountList({ list: records })
      list.vm.sortMode = '_updatedAt'
      expect(list.vm.filteredList.map(record => record._id)).to.deep.equal(['r1', 'r3', 'r2'])
    })

    it('sorts alphabetically without minding case', () => {
      const list = mountList({ list: records })
      list.vm.sortMode = 'alphabetical'
      expect(list.vm.filteredList.map(record => record.title)).to.deep.equal(['Alpha', 'beta', 'Gamma'])
    })

    it('remembers the sort the user picked', () => {
      const list = mountList()
      list.vm.onChangeSort('alphabetical')
      expect(list.vm.sortMode).to.equal('alphabetical')
    })
  })

  describe('selecting several', () => {
    it('adds every record, and none twice', () => {
      const list = mountList({ list: records })
      list.vm.onClickSelectAll()
      expect(list.vm.getSelectedRecordIds()).to.deep.equal(['r1', 'r3', 'r2'])
      list.vm.onClickSelectAll()
      expect(list.vm.getSelectedRecordIds()).to.have.length(3)
      expect(list.emitted('changeMultiselectItems')).to.have.length(2)
    })

    // With a search in force it must take the visible records only - an implementation reaching
    // for the whole list instead of `filteredList` would pass the case above and fail this one.
    it('adds only what the current filter shows', async () => {
      const list = mountList({ list: records })
      list.vm.search = 'Alpha'
      await list.vm.$nextTick()
      list.vm.onClickSelectAll()
      expect(list.vm.getSelectedRecordIds()).to.deep.equal(['r1'])
    })

    it('knows when everything on screen is selected', () => {
      const list = mountList({ list: records })
      expect(list.vm.allRecordsSelected()).to.equal(false)
      list.vm.onClickSelectAll()
      expect(list.vm.allRecordsSelected()).to.equal(true)
    })

    it('clears the selection', () => {
      const list = mountList({ list: records })
      list.vm.onClickDeselectAll()
      expect(list.emitted('changeMultiselectItems')[0][0]).to.deep.equal([])
    })

    it('empties the selection when the mode is toggled, and asks for the other mode', () => {
      const list = mountList({ list: records, multiselect: false })
      list.vm.onClickSelectAll()
      list.vm.toggleViewMode()
      expect(list.vm.localMultiselectItems).to.deep.equal([])
      expect(list.emitted('selectMultiselect')[0]).to.deep.equal([true])
    })
  })

  describe('the rest', () => {
    it('switches resource only when a different one was clicked', () => {
      const selectResourceCallback = vi.fn()
      const current = resource()
      const list = mountList({ resource: current, selectResourceCallback })
      list.vm.onResourceClick(list.vm.resource)
      expect(selectResourceCallback).not.toHaveBeenCalled()
      list.vm.onResourceClick({ title: 'cities' })
      expect(selectResourceCallback).toHaveBeenCalledOnce()
    })

    it('offers its shortcut only while the omnibar is closed', () => {
      const list = mountList()
      expect(list.vm.getShortcuts()).to.deep.equal({ open: ['ctrl', '/'] })
      list.vm.onGetOmnibarDisplayStatus(true)
      expect(list.vm.getShortcuts()).to.deep.equal({})
    })

    it('knows an unsaved record by the id it does not have yet', () => {
      expect(mountList({ selectedItem: { title: 'new' } }).vm.isCreatingNewRecord()).to.equal(true)
      expect(mountList({ selectedItem: { _id: 'r1' } }).vm.isCreatingNewRecord()).to.equal(false)
      expect(mountList({ selectedItem: false }).vm.isCreatingNewRecord()).to.equal(false)
    })

    // Dead code: nothing calls it, and `_.get` with a single argument returns undefined whatever
    // it is handed, so it could not work if anything did. Pinned because the PR says it is.
    it('has a getFirstKey that returns undefined however it is called', () => {
      const { vm } = mountList()
      expect(vm.getFirstKey([{ title: 'Alpha' }])).to.equal(undefined)
      expect(vm.getFirstKey(undefined)).to.equal(undefined)
    })

    it('copies an id and says so', () => {
      vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn() } })
      mountList().vm.copyIdToClipboard('r1')
      expect(send).toHaveBeenCalledWith('_id has been copied.')
    })
  })
})
