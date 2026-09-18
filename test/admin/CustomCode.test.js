import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// The code field, a codemirror wrapper. The editor itself is stubbed: what is worth testing is the
// options the schema turns into, and what the component does with a change.
vi.mock('@s/FieldSelectorService', () => ({ default: { highlightParagraph: vi.fn() } }))
vi.mock('codemirror-editor-vue3', () => ({ default: { name: 'Codemirror', template: '<div />' } }))
vi.mock('codemirror/keymap/sublime.js', () => ({}))
vi.mock('codemirror/mode/javascript/javascript.js', () => ({}))
vi.mock('codemirror/addon/display/placeholder.js', () => ({}))
vi.mock('codemirror/mode/htmlmixed/htmlmixed.js', () => ({}))
vi.mock('codemirror/mode/css/css.js', () => ({}))
vi.mock('codemirror/lib/codemirror.css', () => ({}))
vi.mock('codemirror/theme/dracula.css', () => ({}))

const { default: CustomCode } = await import('@c/fields/CustomCode.vue')

const mountField = (schema = {}, model = {}) =>
  mount(CustomCode, { props: { schema: { model: 'snippet', ...schema }, model }, shallow: true })

describe('CustomCode', () => {
  describe('the editor options it builds', () => {
    it('defaults to javascript with line numbers and a two-space tab', () => {
      const { cmOption } = mountField().vm
      expect([cmOption.mode, cmOption.tabSize, cmOption.lineNumbers]).to.deep.equal(['text/javascript', 2, true])
    })

    it('takes every option the schema overrides', () => {
      const { cmOption } = mountField({ options: { tabSize: 4, lineNumbers: false, mode: 'text/css' } }).vm
      expect([cmOption.mode, cmOption.tabSize, cmOption.lineNumbers]).to.deep.equal(['text/css', 4, false])
    })

    // codemirror has no json mode of its own - json is javascript with a stricter parser - so a
    // schema asking for json is redirected once the component mounts.
    it('rewrites a json mode to javascript, because codemirror has no json mode', () => {
      expect(mountField({ options: { mode: 'json' } }).vm.cmOption.mode).to.equal('javascript')
    })

    it('reports itself ready only after mounting, so the editor is not built twice', () => {
      expect(mountField().vm.isReady).to.equal(true)
    })
  })

  describe('sizing', () => {
    it('fills its container unless the schema says otherwise', () => {
      expect(mountField().vm.getStyle()).to.deep.equal({ height: '100%', width: '100%' })
      expect(mountField({ options: { height: '300px', width: '50%' } }).vm.getStyle()).to.deep.equal({ height: '300px', width: '50%' })
    })

    it('merges any extra css the schema carries', () => {
      expect(mountField({ options: { css: { border: '1px solid red' } } }).vm.getStyle())
        .to.deep.equal({ height: '100%', width: '100%', border: '1px solid red' })
    })
  })

  describe('a value that is not text', () => {
    it('clears an object left in the record, which the editor cannot show', () => {
      const model = { snippet: { was: 'an object' } }
      mountField({}, model)
      expect(model.snippet).to.equal('')
    })

    it('leaves a string alone', () => {
      const model = { snippet: 'const a = 1' }
      mountField({}, model)
      expect(model.snippet).to.equal('const a = 1')
    })
  })

  // Defect, not intent (#119): every other field emits `input`, which is what drives
  // RecordEditor.checkDirty and therefore the unsaved-changes guard. This one writes the record
  // behind it, so editing a code field and then clicking another record discards the edit without
  // asking. Pinned as it behaves; fixing #119 inverts the second assertion.
  it('writes the record directly, announcing nothing, so the form never learns it is dirty', () => {
    const model = { snippet: 'before' }
    const field = mountField({ model: 'snippet' }, model)
    field.vm.onChangeData('after')
    expect(model.snippet).to.equal('after')
    expect(field.emitted('input')).to.equal(undefined)
  })
})
