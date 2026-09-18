import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// The pillbox field. Its own work is splitting comma-separated input into separate tags, both when
// the value changes and when a list is pasted in, and copying a tag to the clipboard.
vi.mock('@s/FieldSelectorService', () => ({ default: { highlightParagraph: vi.fn() } }))
const send = vi.fn()
vi.mock('@s/NotificationsService', () => ({ default: { send, sendOmnibarDisplayStatus: vi.fn() } }))

const { default: CustomInputTag } = await import('@c/fields/CustomInputTag.vue')

const mountField = (schema = {}, model = {}) =>
  mount(CustomInputTag, { props: { schema: { model: 'tags', ...schema }, model }, shallow: true })

const pasteOf = (text) => ({ preventDefault: vi.fn(), clipboardData: { getData: () => text } })

describe('CustomInputTag', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('splitting what it is given', () => {
    it('splits a comma-separated entry into separate tags and trims them', () => {
      const { vm } = mountField()
      expect(vm.processCommaSeparatedValues(['one, two ,three'])).to.deep.equal(['one', 'two', 'three'])
    })

    it('drops the empties a trailing or doubled comma leaves behind', () => {
      const { vm } = mountField()
      expect(vm.processCommaSeparatedValues(['one,,two,'])).to.deep.equal(['one', 'two'])
    })

    it('removes duplicates across the whole list, not only within one entry', () => {
      const { vm } = mountField()
      expect(vm.processCommaSeparatedValues(['one,two', 'two', 'three'])).to.deep.equal(['one', 'two', 'three'])
    })

    it('passes anything that is not a list straight back', () => {
      const { vm } = mountField()
      expect(vm.processCommaSeparatedValues('one,two')).to.equal('one,two')
      expect(vm.processCommaSeparatedValues(undefined)).to.equal(undefined)
    })

    it('leaves entries that are not strings alone', () => {
      const { vm } = mountField()
      expect(vm.processCommaSeparatedValues(['one', 2, null])).to.deep.equal(['one', 2, null])
    })
  })

  describe('pasting', () => {
    it('splits a pasted list and adds it to what is already there', () => {
      const field = mountField({}, { tags: ['kept'] })
      field.vm.onPaste(pasteOf('one, two'))
      expect(field.emitted('input')[0]).to.deep.equal([['kept', 'one', 'two'], 'tags'])
    })

    it('adds a paste with no comma as a single tag', () => {
      const field = mountField({}, { tags: ['kept'] })
      field.vm.onPaste(pasteOf('  one  '))
      expect(field.emitted('input')[0]).to.deep.equal([['kept', 'one'], 'tags'])
    })

    it('ignores a tag that is already present, and an empty paste', () => {
      const field = mountField({}, { tags: ['kept'] })
      field.vm.onPaste(pasteOf('kept'))
      field.vm.onPaste(pasteOf('   '))
      expect(field.emitted('input')).to.equal(undefined)
    })

    it('takes over from the browser so the raw text is never inserted', () => {
      const field = mountField({}, { tags: [] })
      const event = pasteOf('one')
      field.vm.onPaste(event)
      expect(event.preventDefault).toHaveBeenCalledOnce()
    })
  })

  // #116: the rule vuetify runs as you type. The validator is given the field's schema, and the
  // message it returns is what the rule reports - it used to be coerced to `true`, a pass.
  describe('validating inline', () => {
    it('fails an empty required field and passes an empty optional one', () => {
      expect(mountField({ required: true }).vm.validateField('')).to.equal(false)
      expect(mountField().vm.validateField('')).to.equal(true)
    })

    it('reports what the validator says, with the schema it was given', () => {
      const validator = vi.fn(() => 'TL_SOMETHING_WRONG')
      const field = mountField({ validator })
      expect(field.vm.validateField(['a'])).to.equal('TL_SOMETHING_WRONG')
      expect(validator).toHaveBeenCalledWith(['a'], field.vm.schema, field.vm.model)
    })
  })

  describe('copying', () => {
    it('writes the tag to the clipboard and says so', async () => {
      const writeText = vi.fn()
      vi.stubGlobal('navigator', { clipboard: { writeText } })
      vi.spyOn(console, 'info').mockImplementation(() => {})
      mountField().vm.copyToClipboard('a tag')
      expect(writeText).toHaveBeenCalledWith('a tag')
      expect(send).toHaveBeenCalledWith('Value has been copied.', 'success')
    })
  })

  // This overrides AbstractField.onChangeData, which assigns to _value and so writes the record.
  // The override only emits - which is enough, because RecordEditor.updateFields does
  // `_.set(editingRecord, model, value)` on every input event. The record the field was handed is
  // not what is written; the editor's copy is. Worth pinning, because it is the one field that
  // takes that route and a future change to AbstractField would not affect it.
  describe('changing the value', () => {
    it('emits the split value, leaving the write to the editor above it', () => {
      const model = { tags: ['before'] }
      const field = mountField({}, model)
      field.vm.onChangeData(['one,two'])
      expect(field.emitted('input')[0]).to.deep.equal([['one', 'two'], 'tags'])
      expect(model.tags).to.deep.equal(['before'])
    })
  })
})
