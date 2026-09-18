import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// Three field components small enough to share a file: the colour picker, the read-only tree view
// and the label every other field prepends.
vi.mock('@s/FieldSelectorService', () => ({ default: { highlightParagraph: vi.fn() } }))

const { default: ColorPicker } = await import('@c/fields/ColorPicker.vue')
const { default: CustomTreeView } = await import('@c/fields/CustomTreeView.vue')
const { default: FieldLabel } = await import('@c/fields/FieldLabel.vue')

const mountField = (component, schema, model = {}, props = {}) =>
  mount(component, {
    props: { schema, model, ...props },
    shallow: true,
    global: { mocks: { $filters: { translate: key => key } } }
  })

describe('ColorPicker', () => {
  const picker = (schema = {}, model = {}) => mountField(ColorPicker, { model: 'brand', ...schema }, model)

  it('reads the colour from the record, defaulting to opaque black', () => {
    expect(picker({}, { brand: '#ff0000ff' }).vm.getColor()).to.equal('#ff0000ff')
    expect(picker({}, {}).vm.getColor()).to.equal('#000000FF')
  })

  it('takes the output mode from the schema when it is one it supports', () => {
    expect(picker({ outputModel: 'rgba' }).vm.options.outputModel).to.equal('rgba')
  })

  it('warns and falls back to hexa for a mode it does not support', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(picker({ outputModel: 'cmyk' }).vm.options.outputModel).to.equal('hexa')
    expect(warn).toHaveBeenCalledWith("Invalid color mode detected: 'cmyk', will default to hexa")
  })

  it('defaults to hexa when the schema says nothing', () => {
    expect(picker({}).vm.options.outputModel).to.equal('hexa')
  })

  it('writes the record when the chosen colour changes', async () => {
    const model = { brand: '#000000FF' }
    const field = picker({}, model)
    field.vm.color = '#00ff00ff'
    await field.vm.$nextTick()
    expect(model.brand).to.equal('#00ff00ff')
  })
})

describe('CustomTreeView', () => {
  const tree = (schema = {}, model = {}, props = {}) => mountField(CustomTreeView, { model: 'meta', ...schema }, model, props)

  it('hands the tree the branch of the record it is pointed at', () => {
    expect(tree({}, { meta: { a: 1 } }).vm.getData()).to.deep.equal({ a: 1 })
  })

  it('answers false rather than undefined when the branch is not there', () => {
    expect(tree({}, {}).vm.getData()).to.equal(false)
  })

  it('names the root after the field, and is modifiable unless the field is disabled', () => {
    expect(tree().vm.options.rootObjectKey).to.equal('meta')
    expect(tree().vm.options.modifiable).to.equal(true)
    expect(tree({}, {}, { disabled: true }).vm.options.modifiable).to.equal(false)
  })
})

describe('FieldLabel', () => {
  it('shows the label, and marks a required field with an asterisk', () => {
    expect(mountField(FieldLabel, { label: 'Title' }).text()).to.equal('Title')
    expect(mountField(FieldLabel, { label: 'Title', required: true }).text()).to.contain('*')
  })

  it('hands back the hint, or an empty string when there is none', () => {
    expect(mountField(FieldLabel, { hint: 'a hint' }).vm.getHint()).to.equal('a hint')
    expect(mountField(FieldLabel, {}).vm.getHint()).to.equal('')
  })
})
