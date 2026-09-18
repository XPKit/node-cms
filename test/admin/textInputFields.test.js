import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// CustomInput and CustomTextarea are twins: the same getType and the same inline validateField,
// which is the rule vuetify runs as you type. That rule is separate from AbstractField.validate,
// which the form runs, and the two do not agree — see the last case here and #116.
vi.mock('@s/FieldSelectorService', () => ({ default: { highlightParagraph: vi.fn() } }))

const { default: CustomInput } = await import('@c/fields/CustomInput.vue')
const { default: CustomTextarea } = await import('@c/fields/CustomTextarea.vue')
const { default: FormService } = await import('@s/FormService')

const mountField = (component, schema = {}, model = {}) =>
  mount(component, { props: { schema: { model: 'title', ...schema }, model }, shallow: true })

describe.each([['CustomInput', CustomInput], ['CustomTextarea', CustomTextarea]])('%s', (name, component) => {
  const field = (schema, model) => mountField(component, schema, model).vm

  it('is a text input unless the schema names another type', () => {
    expect(field({}).getType()).to.equal('text')
    expect(field({ inputFieldType: 'password' }).getType()).to.equal('password')
  })

  it('fails an empty required field, and accepts anything on an optional one', () => {
    const required = field({ required: true })
    expect([required.validateField(''), required.validateField(null), required.validateField(undefined)]).to.deep.equal([false, false, false])
    expect(required.validateField('a value')).to.equal(true)
    expect(field({}).validateField('')).to.equal(true)
  })

  // The second half of #116: the result is coerced with `!!`, and the admin's validators report a
  // failure by *returning the message*. A non-empty string is truthy, so every failure they report
  // is read as a pass. Only a validator that returns `false` can fail this rule, and typeMapper
  // wires the string-returning kind to every text field.
  it('reads a returned error message as a pass, because it only coerces the result', () => {
    expect(field({ validator: () => true }).validateField('x')).to.equal(true)
    expect(field({ validator: () => 'TL_SOMETHING_WRONG' }).validateField('x')).to.equal(true)
    expect(field({ validator: () => false }).validateField('x')).to.equal(false)
  })

  // Defect, not intent (#116): the inline rule calls the validator with `this.schema.model` - the
  // model path, a string - where AbstractField.validate passes `this.schema`, and where every
  // validator expects the field schema. So the validator cannot see `regex`, `required` or
  // `localised`, and a value the form rejects passes inline without a word.
  it('hands the validator a model path instead of the schema, so a regex never fires inline', () => {
    const schema = { model: 'title', regex: { value: '/^[0-9]+$/' }, validator: FormService.typeMapper.string.validator }
    expect(field(schema).validateField('abc')).to.equal(true)
    expect(FormService.typeMapper.string.validator('abc', schema, {})).to.equal('TL_INVALID_FORMAT (/^[0-9]+$/)')
  })
})
