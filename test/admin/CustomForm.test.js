import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// The form that renders a resource's fields. Its own work is identifying and classing each field,
// passing a field change up, and marking the field the omnibar has just selected.
const events = { on: vi.fn(), off: vi.fn() }
vi.mock('@s/FieldSelectorService', () => ({ default: { events, highlightParagraph: vi.fn() } }))
vi.mock('@s/TranslateService', () => ({ default: { get: key => key, locale: 'enUS' } }))
vi.mock('@s/LoginService', () => ({ default: { events: { on: vi.fn() }, user: {} } }))

const { default: CustomForm } = await import('@c/CustomForm.vue')

const mountForm = (fields = [], props = {}) =>
  mount(CustomForm, { props: { schema: { fields }, model: {}, ...props }, shallow: true })

describe('CustomForm', () => {
  describe('identifying a field', () => {
    it('builds an id from the field model and the form it belongs to', () => {
      const form = mountForm([], { formId: 3 })
      expect(form.vm.getFieldId({ model: 'title.enUS', type: 'CustomInput' })).to.equal('title.enUS-3')
    })

    it('falls back to the field type when the field has no model', () => {
      const form = mountForm([], { formId: 3 })
      expect(form.vm.getFieldId({ type: 'CustomInput' })).to.equal('CustomInput-3')
    })

    it('uses the override type when the schema carries one', () => {
      expect(mountForm().vm.getFieldType({ type: 'input', overrideType: 'CustomInput' })).to.equal('CustomInput')
      expect(mountForm().vm.getFieldType({ type: 'input' })).to.equal('input')
      expect(mountForm().vm.getFieldType({})).to.equal(false)
    })
  })

  describe('laying fields out', () => {
    it('classes a field by its width, defaulting to one', () => {
      expect(mountForm().vm.getFieldClasses({ width: '2' })).to.deep.equal(['width-2'])
      expect(mountForm().vm.getFieldClasses({})).to.deep.equal(['width-1'])
    })

    it('adds a focused class only while the field is the selected one', () => {
      expect(mountForm().vm.getFieldClasses({ schema: { focused: -1 } })).to.deep.equal(['width-1', 'focused'])
      expect(mountForm().vm.getFieldClasses({ schema: { focused: false } })).to.deep.equal(['width-1'])
    })

    it('classes a line by its slots and how many fields it holds', () => {
      expect(mountForm().vm.getLineClasses({ slots: '3', fields: [{}, {}] })).to.deep.equal(['slots-3', 'nb-fields-2'])
      expect(mountForm().vm.getLineClasses({})).to.deep.equal(['slots-1', 'nb-fields-1'])
    })
  })

  describe('passing a change up', () => {
    it('re-emits a field change with the paragraph it came from', () => {
      const form = mountForm([], { paragraphIndex: 2 })
      form.vm.onInput('a value', 'title.enUS')
      expect(form.emitted('input')[0]).to.deep.equal(['a value', 'title.enUS', 2])
    })

    // An attachment field emits a list rather than a value and a model, so the model is recovered
    // from the first entry's parentKey.
    it('recovers the model from the value when none was given', () => {
      const form = mountForm()
      form.vm.onInput([{ parentKey: 'photo' }])
      expect(form.emitted('input')[0][1]).to.equal('photo')
    })
  })

  describe('following the omnibar', () => {
    it('subscribes while it lives and unsubscribes when it goes', () => {
      const form = mountForm()
      expect(events.on).toHaveBeenCalledWith('select', form.vm.onFieldSelected)
      form.unmount()
      expect(events.off).toHaveBeenCalledWith('select', form.vm.onFieldSelected)
    })

    it('focuses the field the omnibar picked, matching a localised model on the current locale', () => {
      const fields = [{ model: 'title.enUS', localised: true }, { model: 'slug', localised: false }]
      const form = mountForm(fields)
      form.vm.onFieldSelected({ field: 'title' })
      expect(fields.map(field => field.focused)).to.deep.equal([true, false])

      form.vm.onFieldSelected({ field: 'slug' })
      expect(fields.map(field => field.focused)).to.deep.equal([false, true])
    })

    it('releases the focus a tick later, so the field can be focused again', async () => {
      vi.useFakeTimers()
      const fields = [{ model: 'slug', localised: false }]
      const form = mountForm(fields)
      form.vm.onFieldSelected({ field: 'slug' })
      expect(fields[0].focused).to.equal(true)
      vi.advanceTimersByTime(2)
      expect(fields[0].focused).to.equal(-1)
      vi.useRealTimers()
    })
  })

  describe('a field it cannot render', () => {
    it('names the offending field and its unknown input type', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})
      mountForm([{ originalModel: 'weird', resource: { schema: [{ field: 'weird', input: 'nonesuch' }] } }])
      expect(error.mock.calls[0][0]).to.contain("Field 'weird' use an undefined field type 'nonesuch'")
    })
  })
})
