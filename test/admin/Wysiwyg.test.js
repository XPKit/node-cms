import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// The rich-text field. tiptap is stubbed to a minimal editor, because what is worth testing is the
// component's own validation and toolbar decisions, not the editor's behaviour.
vi.mock('@s/FieldSelectorService', () => ({ default: { highlightParagraph: vi.fn() } }))

let html = ''
const editor = {
  getHTML: () => html,
  commands: { setContent: vi.fn() },
  on: vi.fn(),
  destroy: vi.fn(),
  isActive: () => false,
  can: () => ({ chain: () => ({ focus: () => ({ toggleBold: () => ({ run: () => true }) }) }) })
}
// `new Editor(...)`, so the stub has to be constructible - a constructor returning an object
// hands that object back, which keeps every instance pointing at the one stub above.
vi.mock('@tiptap/vue-3', () => ({ Editor: class { constructor () { return editor } }, EditorContent: { name: 'EditorContent', template: '<div />' } }))
vi.mock('@tiptap/starter-kit', () => ({ default: { configure: () => ({}) } }))
vi.mock('@tiptap/extension-superscript', () => ({ default: {} }))
vi.mock('@tiptap/extension-code-block-lowlight', () => ({ default: { configure: () => ({}) } }))
vi.mock('lowlight', () => ({ createLowlight: () => ({ register: vi.fn() }) }))

const { default: Wysiwyg } = await import('@c/fields/Wysiwyg.vue')

const mountField = (schema = {}, model = {}) =>
  mount(Wysiwyg, {
    props: { schema: { model: 'body', ...schema }, model },
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
    // Two defects in one function, both part of #116. The message key is `T_FIELD_IS_REQUIRED`,
    // one letter short of the `TL_` prefix every other key uses and absent from both translation
    // files - and it is rendered raw, so the user is shown the key itself.
    it('reports a required empty field with a key that does not exist', () => {
      html = ''
      expect(mountField({ required: true }).vm.validateField()).to.equal('T_FIELD_IS_REQUIRED')
      html = '<p></p>'
      expect(mountField({ required: true }).vm.validateField()).to.equal('T_FIELD_IS_REQUIRED')
    })

    it('accepts a required field that has content', () => {
      html = '<p>Something</p>'
      expect(mountField({ required: true }).vm.validateField()).to.equal('')
    })

    // The template shows the result only when it has a length, but the validator branch returns a
    // boolean - `true.length` is undefined - so a validator failure displays nothing at all.
    it('returns a boolean from the validator branch, which the template can never display', () => {
      html = '<p>Something</p>'
      const failing = mountField({ validator: () => 'TL_SOMETHING_WRONG' })
      expect(failing.vm.validateField()).to.equal(true)
      expect(mountField({ validator: () => false }).vm.validateField()).to.equal(false)
    })

    it('says nothing about an optional field that is empty', () => {
      html = ''
      expect(mountField().vm.validateField()).to.equal('')
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
