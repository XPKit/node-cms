import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// Mounted against the real @json-editor/json-editor, because the thing worth testing is exactly
// what a stub would paper over: the editor fires `change` for programmatic setValue as well as for
// a keystroke, and it fires it from inside a requestAnimationFrame.
vi.mock('@s/FieldSelectorService', () => ({ default: { highlightParagraph: vi.fn() } }))

const { default: JsonEditor } = await import('@c/fields/JsonEditor.vue')

const jsonEditorOptions = () => ({ type: 'object', properties: { name: { type: 'string' } } })
const mountField = (model = {}, schema = {}) => mount(JsonEditor, {
  props: { schema: { model: 'config', jsonEditorOptions: jsonEditorOptions(), ...schema }, model },
  attachTo: document.body,
  global: { mocks: { $filters: { translate: key => key } } }
})

// The editor defers its change event by a frame, so settling means letting one pass.
const settle = async (field) => {
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  await field.vm.$nextTick()
}

describe('JsonEditor', () => {
  it('seeds the record from the editor without announcing anything', async () => {
    const model = { config: { name: 'stored' } }
    const field = mountField(model)
    await settle(field)
    expect(model.config.name).to.equal('stored')
    expect(field.emitted('input')).to.equal(undefined)
  })

  it('announces a value the user changed', async () => {
    const model = { config: { name: 'stored' } }
    const field = mountField(model)
    await settle(field)

    // What a keystroke looks like from the component's side: the editor's value moves away from
    // the record, and nothing has written the record on its behalf.
    field.vm.editor.setValue({ name: 'typed' })
    await settle(field)

    expect(field.emitted('input')[0]).to.deep.equal([{ name: 'typed' }, 'config'])
    expect(model.config.name).to.equal('typed')
  })

  // #119 as reviewed: routing every change through _value marked a locale switch dirty, because
  // the watcher calls setValue and the editor answers with a change like any other.
  it('stays quiet through a locale switch, which reseeds it', async () => {
    const model = { 'config.enUS': { name: 'english' }, 'config.zhCN': { name: 'chinese' } }
    const field = mountField(model, { model: 'config.enUS' })
    await settle(field)

    await field.setProps({ schema: { model: 'config.zhCN', jsonEditorOptions: field.vm.schema.jsonEditorOptions } })
    await settle(field)

    expect(field.emitted('input')).to.equal(undefined)
  })
})
