import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// The table view of a resource, and the generator that turns a schema into its columns.
vi.mock('@s/TranslateService', () => ({
  // Marked rather than passed through, so an assertion proves the translator was actually asked
  // instead of the component handing back the key it was given.
  default: { get: (key, params) => (params ? `translated(${key}):${JSON.stringify(params)}` : `translated(${key})`), locale: 'enUS' }
}))
vi.mock('@s/NotificationsService', () => ({ default: { send: vi.fn(), sendOmnibarDisplayStatus: vi.fn(), events: { on: vi.fn(), off: vi.fn() } } }))
vi.mock('@s/ResourceService', () => ({ default: { get: vi.fn(() => []), cache: vi.fn(async () => []) } }))
const deletes = []
vi.mock('@s/RequestService', () => ({ default: { delete: vi.fn(async url => deletes.push(url)), post: vi.fn(), put: vi.fn(), get: vi.fn() } }))
vi.mock('@s/FieldSelectorService', () => ({ default: { events: { on: vi.fn(), off: vi.fn() }, highlightParagraph: vi.fn() } }))

const { default: RecordTable } = await import('@c/RecordTable.vue')
const { default: VueTableGenerator } = await import('@c/VueTableGenerator.vue')

const mountIt = (component, props = {}) => mount(component, {
  props,
  shallow: true,
  global: {
    stubs: { RecycleScroller: { template: '<div />' } },
    mocks: { $filters: { translate: key => key }, $loading: { start: vi.fn(), stop: vi.fn() } }
  }
})

describe('RecordTable', () => {
  beforeEach(() => { deletes.length = 0; vi.clearAllMocks() })

  const resource = (extra = {}) => ({ title: 'articles', schema: [{ field: 'title', searchable: true }], ...extra })
  const table = (props = {}) => mountIt(RecordTable, { resource: resource(), recordList: [], ...props })

  describe('the options it reads off the resource', () => {
    it('pages by ten and shows the id and the update time unless told otherwise', () => {
      expect(table().vm.options).to.deep.equal({ paging: 10, displayId: true, displayUpdatedAt: true })
    })

    it('takes each option the resource overrides', () => {
      const overridden = table({ resource: resource({ options: { paging: 50, displayId: false, displayUpdatedAt: false } }) })
      expect(overridden.vm.options).to.deep.equal({ paging: 50, displayId: false, displayUpdatedAt: false })
    })
  })

  describe('naming and grouping', () => {
    it('titles a resource by its display name, translated, or its title', () => {
      expect(table().vm.getResourceTitle({ displayname: 'TL_ARTICLES', title: 'articles' })).to.equal('translated(TL_ARTICLES)')
      expect(table().vm.getResourceTitle({ title: 'articles' })).to.equal('articles')
    })

    // Note this reads the group off `resource`, where ResourceList reads it off `selectedItem`.
    it('matches the group of the resource on screen, and puts an ungrouped one under others', () => {
      const grouped = table({ resource: resource({ group: 'Content' }) })
      expect(grouped.vm.groupSelected({ name: 'Content' })).to.equal(true)
      expect(grouped.vm.groupSelected({ name: 'Settings' })).to.equal(false)
      expect(table().vm.groupSelected({ name: 'TL_OTHERS' })).to.equal(true)
    })
  })

  describe('confirming a delete', () => {
    it('asks a different question for one record and for a selection', () => {
      const confirm = vi.fn(() => true)
      vi.stubGlobal('confirm', confirm)
      const view = table()
      view.vm.askConfirmation()
      expect(confirm.mock.calls[0][0]).to.equal('translated(TL_ARE_YOU_SURE_TO_DELETE)')
      view.vm.askConfirmation(true)
      expect(confirm.mock.calls[1][0]).to.equal('translated(TL_ARE_YOU_SURE_TO_DELETE_SELECTED_RECORDS)')
    })

    // removeRecords works from `selectedRecords`, not from the record list, so a case that fills
    // only the list would pass with the deletion path broken - there would be nothing to delete.
    it('deletes every selected record once the question is accepted', async () => {
      vi.stubGlobal('confirm', vi.fn(() => true))
      const view = table()
      view.vm.selectedRecords = ['r1', 'r2']
      await view.vm.removeRecords()
      expect(deletes).to.deep.equal(['../api/articles/r1', '../api/articles/r2'])
    })

    it('leaves a real selection untouched when the question is declined', async () => {
      vi.stubGlobal('confirm', vi.fn(() => false))
      const view = table()
      view.vm.selectedRecords = ['r1', 'r2']
      await view.vm.removeRecords()
      expect(deletes).to.deep.equal([])
    })
  })

  describe('searching', () => {
    // The table filters a clone it takes when the resource loads, not the prop, so the clone is
    // what a case has to fill - the prop alone leaves it null.
    it('returns the whole list while the box is empty', () => {
      const view = table()
      view.vm.clonedRecordList = [{ _id: 'r1', title: 'Alpha' }]
      expect(view.vm.filteredList).to.have.length(1)
    })

    it('matches a value case-insensitively', () => {
      const view = table()
      // `doesMatch` ignores the term it is handed and reads `this.search` instead. Both of its
      // callers pass `this.search`, so it makes no difference today - but the argument is a lie.
      view.vm.search = 'alp'
      expect(view.vm.doesMatch('ignored', ['Alpha'])).to.equal('Alpha')
      view.vm.search = 'zzz'
      expect(view.vm.doesMatch('ignored', ['Alpha'])).to.equal(undefined)
    })
  })

  it('offers escape and its opening chord while the omnibar is closed, and nothing once it opens', () => {
    const view = table()
    expect(view.vm.getShortcuts()).to.deep.equal({ esc: ['esc'], open: ['ctrl', '/'] })
    view.vm.onGetOmnibarDisplayStatus(true)
    expect(view.vm.getShortcuts()).to.deep.equal({})
  })
})

describe('VueTableGenerator', () => {
  const generator = (schema, resource = { locales: ['enUS', 'zhCN'] }) =>
    mountIt(VueTableGenerator, { schema, resource, items: [] }).vm

  // Asserted on a snapshot of the order taken before mounting, not on the array that was passed
  // in: schemaFields mutates the fields it walks and returns that same array, so comparing the two
  // compares the result with itself and could not notice a reordering or a dropped column.
  it('keeps the columns in schema order when no field asks for an index', () => {
    const fields = [{ model: 'title', originalModel: 'title' }, { model: 'body', originalModel: 'body' }]
    const orderBefore = fields.map(field => field.model)
    expect(generator({ fields: fields.map(field => ({ ...field })) }).schemaFields.map(field => field.model))
      .to.deep.equal(orderBefore)
  })

  it('orders the columns by the index each field declares', () => {
    const fields = [
      { model: 'body', originalModel: 'body', options: { index: 2 } },
      { model: 'title', originalModel: 'title', options: { index: 1 } }
    ]
    expect(generator({ fields }).schemaFields.map(field => field.model)).to.deep.equal(['title', 'body'])
  })

  // A field marked `breakdown` becomes one column per locale, labelled with the locale, so a
  // translator can see every language side by side.
  it('breaks a localised field into one column per locale', () => {
    const fields = [{ model: 'title.enUS', originalModel: 'title', localised: true, options: { index: 1, breakdown: true } }]
    const columns = generator({ fields }).schemaFields
    expect(columns.map(column => column.model)).to.deep.equal(['title.enUS', 'title.zhCN'])
    expect(columns[1].label).to.equal('translated(title) (translated(TL_ZHCN))')
  })

  it('disables every column, since the table only shows them', () => {
    const fields = [{ model: 'title', originalModel: 'title', options: { index: 1 } }]
    expect(generator({ fields }).schemaFields[0].disabled).to.equal(true)
  })
})
