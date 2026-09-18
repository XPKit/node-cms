import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// CustomInput and CustomTextarea are twins: the same getType and the same inline validateField,
// which is the rule vuetify runs as you type. That rule is separate from AbstractField.validate,
// which the form runs, and since #116 the two agree on what they ask the validator and on what
// they do with its answer.
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

  // The second half of #116: the admin's validators report a failure by *returning the message*,
  // and so does a vuetify rule, so the message travels through to the user. `!!` used to coerce it
  // to `true` - a pass - which left only a validator returning `false` able to fail this rule,
  // while typeMapper wires the string-returning kind to every text field.
  it('reports a returned error message as the rule failing, and says so in words', () => {
    expect(field({ validator: () => true }).validateField('x')).to.equal(true)
    expect(field({ validator: () => 'TL_SOMETHING_WRONG' }).validateField('x')).to.equal('TL_SOMETHING_WRONG')
    expect(field({ validator: () => false }).validateField('x')).to.equal(false)
  })

  // validators.js answers with a list of messages rather than one, so the rule reads an empty list
  // as a pass rather than as the truthy object it is.
  it('reads a list of messages as one failure, and an empty list as a pass', () => {
    expect(field({ validator: () => [] }).validateField('x')).to.equal(true)
    expect(field({ validator: () => ['first', 'second'] }).validateField('x')).to.equal('first, second')
  })

  // #116: the inline rule hands the validator `this.schema`, the same thing AbstractField.validate
  // hands it. It used to pass `this.schema.model` - the model path, a string - so the validator
  // could not see `regex`, `required` or `localised`, and a value the form rejected passed inline
  // without a word. The third assertion is the form's own call, for comparison.
  it('hands the validator the schema, so a regex fires inline as well as on the form', () => {
    const schema = { model: 'title', regex: { value: '/^[0-9]+$/' }, validator: FormService.typeMapper.string.validator }
    expect(field(schema).validateField('abc')).to.equal('TL_INVALID_FORMAT (/^[0-9]+$/)')
    expect(field(schema).validateField('123')).to.equal(true)
    expect(FormService.typeMapper.string.validator('abc', schema, {})).to.equal('TL_INVALID_FORMAT (/^[0-9]+$/)')
  })

  it('calls the validator with the value, the schema and the record', () => {
    const validator = vi.fn(() => true)
    const mounted = mountField(component, { validator }, { title: 'stored' })
    mounted.vm.validateField('typed')
    expect(validator).toHaveBeenCalledWith('typed', mounted.vm.schema, mounted.vm.model)
    expect(validator.mock.calls[0][1]).to.include({ model: 'title' })
  })
})
