import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// The record editor. These cover the pure helpers it is built from - what counts as a value, what
// counts as a changed attachment, and how it decides the form is dirty - rather than the save
// choreography, which is mostly the server's.
vi.mock('@s/TranslateService', () => ({ default: { get: (key, params) => (params ? `${key}:${JSON.stringify(params)}` : key), locale: 'enUS' } }))
vi.mock('@s/NotificationsService', () => ({ default: { send: vi.fn(), sendOmnibarDisplayStatus: vi.fn(), events: { on: vi.fn(), off: vi.fn() } } }))
vi.mock('@s/ResourceService', () => ({ default: { get: vi.fn(() => []), cache: vi.fn(async () => []) } }))
vi.mock('@s/RequestService', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))
vi.mock('@s/FieldSelectorService', () => ({ default: { events: { on: vi.fn(), off: vi.fn() }, highlightParagraph: vi.fn() } }))
vi.mock('@s/SchemaService', () => ({ default: { getSchemaFields: vi.fn(() => []), getNestedGroups: vi.fn(() => []) } }))
vi.mock('@s/LoginService', () => ({ default: { events: { on: vi.fn(), off: vi.fn() }, user: { theme: 'light' } } }))

const { default: RecordEditor } = await import('@c/RecordEditor.vue')

const resource = (extra = {}) => ({ title: 'articles', schema: [{ field: 'title' }], locales: ['enUS', 'zhCN'], ...extra })
const editor = (props = {}) => mount(RecordEditor, {
  props: { resource: resource(), record: {}, ...props },
  shallow: true,
  global: {
    stubs: { RecycleScroller: { template: '<div />' } },
    mocks: { $filters: { translate: key => key }, $loading: { start: vi.fn(), stop: vi.fn() }, $vuetify: { theme: { dark: false, global: { name: 'light' } } } }
  }
}).vm

describe('RecordEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.DialogService = { send: vi.fn(), show: vi.fn() }
  })

  describe('what the button says', () => {
    it('offers to create a record with no id, and to update one that has it', () => {
      const view = editor()
      expect(view.getActionText()).to.equal('TL_CREATE')
      view.editingRecord = { _id: 'r1' }
      expect(view.getActionText()).to.equal('TL_UPDATE')
    })
  })

  describe('reading a field value', () => {
    it('gives a pillbox an empty list and a json field an empty object rather than nothing', () => {
      const view = editor()
      expect(view.fieldValueOrDefault({ input: 'pillbox' }, undefined)).to.deep.equal([])
      expect(view.fieldValueOrDefault({ input: 'json' }, undefined)).to.deep.equal({})
      expect(view.fieldValueOrDefault({ input: 'string' }, undefined)).to.equal(undefined)
    })

    it('keeps a value that is already there', () => {
      expect(editor().fieldValueOrDefault({ input: 'pillbox' }, ['one'])).to.deep.equal(['one'])
    })

    it('copies an object so editing it cannot reach back into the saved record', () => {
      const view = editor()
      const original = { nested: { deep: true } }
      const clone = view.cloneValue({ input: 'json' }, original)
      clone.nested.deep = false
      expect(original.nested.deep).to.equal(true)
    })

    it('passes a primitive straight through, there being nothing to copy', () => {
      expect(editor().cloneValue({ input: 'string' }, 'a title')).to.equal('a title')
    })
  })

  describe('attachments', () => {
    it('strips the marker the file field adds while an attachment is only in the browser', () => {
      const cleaned = editor().cleanAttachments([{ _id: 'x1', _isAttachment: true }])
      expect(cleaned).to.deep.equal([{ _id: 'x1' }])
    })

    it('drops a duplicate id unless asked to keep it', () => {
      const view = editor()
      const two = [{ _id: 'x1' }, { _id: 'x1' }]
      expect(view.cleanAttachments(two)).to.have.length(1)
      expect(view.cleanAttachments([{ _id: 'x1' }, { _id: 'x1' }], false)).to.have.length(2)
    })

    it('counts an attachment as changed when it is renamed, reordered or cropped', () => {
      const view = editor()
      expect(view.attachmentWasUpdated({ _name: 'photo' }, { _name: 'other' })).to.equal(true)
      expect(view.attachmentWasUpdated({ _payload: { index: 0 } }, { _payload: { index: 1 } })).to.equal(true)
      expect(view.attachmentWasUpdated({ _name: 'photo' }, { _name: 'photo', cropOptions: { updated: true } })).to.equal(true)
      expect(view.attachmentWasUpdated({ _name: 'photo' }, { _name: 'photo' })).to.equal(false)
    })

    it('picks out only the attachments whose crop has moved', () => {
      const attachments = [{ _id: 'a', cropOptions: { updated: true } }, { _id: 'b' }, { _id: 'c', cropOptions: {} }]
      expect(editor().getUpdatedAttachments(attachments).map(a => a._id)).to.deep.equal(['a'])
    })
  })

  describe('knowing it is dirty', () => {
    it('marks the fields that differ from the saved record and announces the form is dirty', () => {
      const view = editor({ record: { title: 'saved' } })
      view.editingRecord = { title: 'edited' }
      view.originalFieldList = [{ model: 'title' }]
      view.checkDirty()
      expect(view.originalFieldList[0].labelClasses).to.equal('dirty')
      expect(window.DialogService.send).toHaveBeenCalledWith(true)
    })

    it('says the form is clean when nothing differs, and clears the marks', () => {
      const view = editor({ record: { title: 'same' } })
      view.editingRecord = { title: 'same' }
      view.originalFieldList = [{ model: 'title', labelClasses: 'dirty' }]
      view.checkDirty()
      expect(view.originalFieldList[0].labelClasses).to.equal('')
      expect(window.DialogService.send).toHaveBeenCalledWith(false)
    })

    it('drops every mark when asked', () => {
      const view = editor()
      view.originalFieldList = [{ model: 'title', labelClasses: 'dirty' }]
      view.removeDirtyFlags()
      expect('labelClasses' in view.originalFieldList[0]).to.equal(false)
    })
  })

  describe('writing a field change into the record being edited', () => {
    it('sets the value at the model path', () => {
      const view = editor()
      view.editingRecord = {}
      view.updateFields('a title', 'title.enUS')
      expect(view.editingRecord).to.deep.equal({ title: { enUS: 'a title' } })
    })

    it('writes nothing when no model was named, rather than guessing', () => {
      const view = editor()
      view.editingRecord = { untouched: true }
      view.updateFields('a title', undefined)
      view.updateFields('a title', '')
      expect(view.editingRecord).to.deep.equal({ untouched: true })
    })
  })

  describe('locales', () => {
    it('names a locale through the translator', () => {
      expect(editor().getLocaleTranslation('zhCN')).to.equal('TL_ZHCN')
    })

    it('splits the locale off a localised model, and leaves a plain one whole', () => {
      const view = editor()
      expect(view.getKeyLocale({ model: 'title.enUS', localised: true })).to.deep.equal({ key: 'title', locale: 'enUS' })
      expect(view.getKeyLocale({ model: 'title' })).to.deep.equal({ key: 'title' })
    })
  })

  it('notices when the form has been scrolled to the bottom', () => {
    const view = editor()
    view.onScroll({ target: { scrollTop: 0, clientHeight: 100, scrollHeight: 500 } })
    expect(view.scrolledToBottom).to.equal(false)
    view.onScroll({ target: { scrollTop: 400, clientHeight: 100, scrollHeight: 500 } })
    expect(view.scrolledToBottom).to.equal(true)
  })

  // Dead code, kept pinned rather than filed: nothing calls this, and it builds `locale.name`
  // while every other model path in the admin is `name.locale` - the same reversal as #108. If it
  // is ever wired up, it will be wired up backwards.
  it('builds an attachment model backwards, but nothing calls it', () => {
    const view = editor()
    expect(view.getAttachmentModel({ _name: 'photo', _fields: { locale: 'enUS' } })).to.equal('enUS.photo')
    expect(view.getAttachmentModel({ _name: 'photo' })).to.equal('photo')
  })
})
