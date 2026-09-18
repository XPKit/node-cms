import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// The rich-text field. tiptap is stubbed to a minimal editor, because what is worth testing is the
// component's own validation and toolbar decisions, not the editor's behaviour.
const highlightParagraph = vi.fn()
vi.mock('@s/FieldSelectorService', () => ({ default: { highlightParagraph } }))

let html = ''
const editor = {
  getHTML: () => html,
  commands: { setContent: vi.fn() },
  on: vi.fn(),
  destroy: vi.fn(),
  isActive: () => false,
  can: () => ({ chain: () => ({ focus: () => ({ toggleBold: () => ({ run: () => true }) }) }) })
}
// `new Editor(...)`, so the stub has to be constructible - a constructor returning an object hands
// that object back, which keeps every instance pointing at the one stub above. The options are
// kept rather than discarded: `onUpdate` is where the component does its own work, and a stub that
// drops it would stay green if the field stopped emitting, writing or revalidating on a keystroke.
let editorOptions = null
vi.mock('@tiptap/vue-3', () => ({
  Editor: class { constructor (options) { editorOptions = options; return editor } },
  EditorContent: { name: 'EditorContent', template: '<div />' }
}))
vi.mock('@tiptap/starter-kit', () => ({ default: { configure: () => ({}) } }))
vi.mock('@tiptap/extension-superscript', () => ({ default: {} }))
vi.mock('@tiptap/extension-code-block-lowlight', () => ({ default: { configure: () => ({}) } }))
vi.mock('lowlight', () => ({ createLowlight: () => ({ register: vi.fn() }) }))

const { default: Wysiwyg } = await import('@c/fields/Wysiwyg.vue')

const mountField = (schema = {}, model = {}, props = {}) =>
  mount(Wysiwyg, {
    props: { schema: { model: 'body', ...schema }, model, ...props },
    shallow: true,
    global: { mocks: { $filters: { translate: key => key }, $vuetify: { theme: { dark: false } } } }
  })

describe('Wysiwyg', () => {
  describe('reading the editor', () => {
    it('reports the markup the editor holds, and nothing before it exists', () => {
      html = '<p>Some text</p>'
      expect(mountField().vm.getVal()).to.equal('<p>Some text</p>')
    })
  })

  describe('validation', () => {
    // #116: the key was `T_FIELD_IS_REQUIRED`, one letter short of the `TL_` prefix every other
    // key uses and in neither translation file, and the template renders the result raw. The
    // translation is what is asserted here; with no dictionary loaded it comes back as the key.
    it('reports a required empty field with the message the rest of the admin uses', () => {
      html = ''
      expect(mountField({ required: true }).vm.validateField()).to.equal('TL_FIELD_IS_REQUIRED')
      html = '<p></p>'
      expect(mountField({ required: true }).vm.validateField()).to.equal('TL_FIELD_IS_REQUIRED')
    })

    it('accepts a required field that has content', () => {
      html = '<p>Something</p>'
      expect(mountField({ required: true }).vm.validateField()).to.equal('')
    })

    // The template shows wysiwygError only when it has a length, so every branch here has to end
    // in a string. The validator branch used to hand back a boolean - `true.length` is undefined -
    // and a failure displayed nothing at all (#116).
    it('answers the validator branch in strings, so the template can show what it says', () => {
      html = '<p>Something</p>'
      expect(mountField({ validator: () => 'TL_SOMETHING_WRONG' }).vm.validateField()).to.equal('TL_SOMETHING_WRONG')
      expect(mountField({ validator: () => true }).vm.validateField()).to.equal('')
      // A validator that fails without a message still has to say something, or the field goes red
      // with nothing next to it.
      expect(mountField({ validator: () => false }).vm.validateField()).to.equal('TL_INVALID_FORMAT')
    })

    it('hands the validator the schema, not the model path', () => {
      html = '<p>Something</p>'
      const validator = vi.fn(() => true)
      const field = mountField({ validator }, { body: '<p>Something</p>' })
      field.vm.validateField()
      expect(validator).toHaveBeenCalledWith('<p>Something</p>', field.vm.schema, field.vm.model)
      expect(validator.mock.calls[0][1]).to.include({ model: 'body' })
    })

    it('says nothing about an optional field that is empty', () => {
      html = ''
      expect(mountField().vm.validateField()).to.equal('')
    })
  })

  describe('when the editor reports a change', () => {
    it('announces it, writes it to the record and revalidates', () => {
      html = '<p>Before</p>'
      const model = { body: '<p>Before</p>' }
      const field = mountField({ required: true }, model)

      html = '<p>After</p>'
      editorOptions.onUpdate()

      expect(field.emitted('change')[0]).to.deep.equal(['<p>After</p>'])
      expect(model.body).to.equal('<p>After</p>')
      expect(field.vm.wysiwygError).to.equal('')
    })

    it('puts the required error up the moment the content is emptied', () => {
      html = '<p>Something</p>'
      const field = mountField({ required: true }, { body: '<p>Something</p>' })
      html = '<p></p>'
      editorOptions.onUpdate()
      expect(field.vm.wysiwygError).to.equal('TL_FIELD_IS_REQUIRED')
    })

    it('passes focus and blur to the field selector', () => {
      highlightParagraph.mockClear()
      mountField({}, {}, { paragraphLevel: 2, paragraphIndex: 3 })
      editorOptions.onFocus()
      expect(highlightParagraph).toHaveBeenLastCalledWith(1, 3)
      editorOptions.onBlur()
      expect(highlightParagraph).toHaveBeenLastCalledWith(-1, -1)
    })
  })

  describe('the toolbar', () => {
    it('offers the buttons the schema asks for, and none by default', () => {
      expect(mountField({ options: { buttons: ['bold', 'italic'] } }).vm.getButtons()).to.deep.equal(['bold', 'italic'])
      expect(mountField().vm.getButtons()).to.deep.equal([])
    })

    it('colours itself against the current vuetify theme', () => {
      expect(mountField().vm.getColorForToolbar()).to.equal('white')
    })
  })

  describe('updateObj', () => {
    it('refuses to mark itself loaded for a schema with no model', () => {
      const field = mountField({ model: undefined })
      expect(field.vm.updateObj()).to.equal(false)
    })
  })
})
