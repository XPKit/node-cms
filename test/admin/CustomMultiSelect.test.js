import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// The select and multiselect field. Most of its work is turning whatever a source produced -
// plain strings, label maps, related records - into a value and a label, and vuetify wraps each
// item in `{raw}`, so every one of those helpers has to look through that first.
vi.mock('@s/FieldSelectorService', () => ({ default: { highlightParagraph: vi.fn() } }))
vi.mock('@s/NotificationsService', () => ({ default: { send: vi.fn(), sendOmnibarDisplayStatus: vi.fn() } }))

const { default: CustomMultiSelect } = await import('@c/fields/CustomMultiSelect.vue')

const mountField = (schema = {}, model = {}) =>
  mount(CustomMultiSelect, {
    props: { schema: { model: 'tags', selectOptions: {}, ...schema }, model },
    shallow: true,
    global: { mocks: { $filters: { translate: key => key } } }
  })

describe('CustomMultiSelect', () => {
  describe('emptiness', () => {
    it('counts null, undefined, the empty string and the empty list as empty', () => {
      const { vm } = mountField()
      expect([null, undefined, '', []].map(vm.valEmpty)).to.deep.equal([true, true, true, true])
      expect([0, 'a', ['a']].map(vm.valEmpty)).to.deep.equal([false, false, false])
    })

    it('fails an empty required field and passes an empty optional one', () => {
      expect(mountField({ required: true }).vm.validateField([])).to.equal(false)
      expect(mountField().vm.validateField([])).to.equal(true)
    })

    // #116: a value that is not empty goes to the validator, which is given the schema and whose
    // message is what the rule reports.
    it('reports what the validator says about a value it does have', () => {
      const validator = vi.fn(() => 'TL_SOMETHING_WRONG')
      const field = mountField({ validator })
      expect(field.vm.validateField(['a'])).to.equal('TL_SOMETHING_WRONG')
      expect(validator).toHaveBeenCalledWith(['a'], field.vm.schema, field.vm.model)
    })
  })

  describe('reading an option', () => {
    it('looks through the wrapper vuetify puts around each item', () => {
      const { vm } = mountField()
      expect(vm.getValue({ raw: { _id: 'r1' } })).to.equal('r1')
      expect(vm.getValue({ _id: 'r1' })).to.equal('r1')
    })

    it('prefers a record id, then an explicit value, then the item itself', () => {
      const { vm } = mountField()
      expect(vm.getValue({ _id: 'r1', _value: 'ignored' })).to.equal('r1')
      expect(vm.getValue({ _value: 'v1' })).to.equal('v1')
      expect(vm.getValue('plain')).to.equal('plain')
    })
  })

  describe('labelling an option', () => {
    it('uses a label map for the current locale when the schema carries one', () => {
      const schema = { locale: 'enUS', options: { labels: { idle: { enUS: 'Idle', zhCN: '空闲' } } } }
      expect(mountField(schema).vm.customLabel('idle')).to.equal('Idle')
    })

    it('labels a related record by its first field in the current locale', () => {
      const schema = { localised: true, locale: 'enUS' }
      const record = { _id: 'c1', name: { enUS: 'Shanghai', zhCN: '上海' } }
      expect(mountField(schema).vm.customLabel({ raw: record })).to.equal('Shanghai')
    })

    it('falls back to the field itself when it is not localised per locale', () => {
      const schema = { localised: true, locale: 'enUS' }
      expect(mountField(schema).vm.customLabel({ _id: 'c1', name: 'Shanghai' })).to.equal('Shanghai')
    })

    it('uses an item text when one is given', () => {
      expect(mountField({ localised: true }).vm.customLabel({ text: 'Readable' })).to.equal('Readable')
    })

    it('hands anything else to the label function the schema service built', () => {
      const customLabel = vi.fn(() => 'from the schema service')
      expect(mountField({ selectOptions: { customLabel } }).vm.customLabel('plain')).to.equal('from the schema service')
      expect(customLabel).toHaveBeenCalledWith('plain')
    })
  })

  describe('the options it offers', () => {
    it('takes the values straight from the schema', () => {
      expect(mountField({ values: ['a', 'b'] }).vm.options).to.deep.equal(['a', 'b'])
    })

    it('calls the schema for its values when it is given a function, with the record and schema', () => {
      const values = vi.fn(() => ['computed'])
      const model = { tags: [] }
      const field = mountField({ values }, model)
      expect(field.vm.options).to.deep.equal(['computed'])
      expect(values).toHaveBeenCalledWith(model, field.vm.schema)
    })

    it('knows when everything on offer is already selected', () => {
      expect(mountField({ values: ['a', 'b'] }, { tags: ['a', 'b'] }).vm.allOptionsSelected()).to.equal(true)
      expect(mountField({ values: ['a', 'b'] }, { tags: ['a'] }).vm.allOptionsSelected()).to.equal(false)
    })

    it('reads a select option with false for anything absent', () => {
      const { vm } = mountField({ selectOptions: { multiple: true } })
      expect([vm.getSelectOpt('multiple'), vm.getSelectOpt('missing')]).to.deep.equal([true, false])
    })
  })
})
