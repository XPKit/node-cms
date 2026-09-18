import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// Every field component mixes this in, so its behaviour is the behaviour of all 19 of them: where a
// field reads and writes its value in the record, and what validate() does with the schema's
// validator. The tests drive it through a bare host component rather than through any one field.
const highlightParagraph = vi.fn()
vi.mock('@s/FieldSelectorService', () => ({ default: { highlightParagraph } }))

const { default: AbstractField } = await import('@m/AbstractField')

const Host = { mixins: [AbstractField], template: '<div />' }
const mountField = (schema, model = {}, props = {}) =>
  mount(Host, { props: { schema, model, ...props } })

describe('AbstractField', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('reading the value out of the record', () => {
    it('follows the schema model as a path', () => {
      const field = mountField({ model: 'meta.title' }, { meta: { title: 'a title' } })
      expect(field.vm._value).to.equal('a title')
    })

    it('prefers a getter the schema supplies', () => {
      const field = mountField({ model: 'title', get: (model) => `${model.title}!` }, { title: 'shout' })
      expect(field.vm._value).to.equal('shout!')
    })

    it('reads undefined rather than throwing when the path is not there', () => {
      expect(mountField({ model: 'nope.deeper' }, {}).vm._value).to.equal(undefined)
    })
  })

  describe('writing the value back', () => {
    it('sets the path on the record and announces the change', async () => {
      const model = {}
      const field = mountField({ model: 'meta.title' }, model)
      field.vm._value = 'written'
      await field.vm.$nextTick()
      expect(model).to.deep.equal({ meta: { title: 'written' } })
      expect(field.emitted('input')[0]).to.deep.equal(['written', 'meta.title'])
    })

    it('hands the write to a setter the schema supplies instead', async () => {
      const model = { title: 'old' }
      const set = vi.fn((m, value) => { m.title = value.toUpperCase() })
      const field = mountField({ model: 'title', set }, model)
      field.vm._value = 'new'
      await field.vm.$nextTick()
      expect(model.title).to.equal('NEW')
      expect(set).toHaveBeenCalledOnce()
    })

    it('calls the schema onChanged hook with both values', async () => {
      const onChanged = vi.fn()
      const field = mountField({ model: 'title', onChanged }, { title: 'before' })
      field.vm._value = 'after'
      await field.vm.$nextTick()
      expect(onChanged.mock.calls[0].slice(0, 3)).to.deep.equal([{ title: 'after' }, 'after', 'before'])
    })

    it('writes nothing and says nothing when the schema names no model', async () => {
      const field = mountField({}, { title: 'untouched' })
      field.vm._value = 'ignored'
      await field.vm.$nextTick()
      expect(field.emitted('input')).to.equal(undefined)
    })

    it('validates after the change only when the form asks it to', async () => {
      const field = mountField({ model: 'title', validator: 'required', required: true }, {}, { formOptions: { validateAfterChanged: true } })
      field.vm._value = ''
      await field.vm.$nextTick()
      await field.vm.$nextTick()
      expect(field.vm.errors).to.deep.equal(['This field is required!'])
    })
  })

  describe('validate', () => {
    it('resolves a validator named as a string against the shared validators', async () => {
      const field = mountField({ model: 'title', validator: 'required', required: true }, {})
      expect(await field.vm.validate()).to.deep.equal(['This field is required!'])
    })

    it('reports no errors for a field that satisfies its validator', async () => {
      const field = mountField({ model: 'title', validator: 'required', required: true }, { title: 'given' })
      expect(await field.vm.validate()).to.deep.equal([])
    })

    it('accepts a validator function and a list of them', async () => {
      const one = vi.fn(() => ['first'])
      const two = vi.fn(() => ['second'])
      const field = mountField({ model: 'title', validator: [one, two] }, {})
      expect(await field.vm.validate()).to.deep.equal(['first', 'second'])
      expect(one).toHaveBeenCalledOnce()
    })

    it('skips validation entirely for a readonly or disabled field', async () => {
      const readonly = mountField({ model: 'title', validator: 'required', required: true, readonly: true }, {})
      expect(await readonly.vm.validate()).to.deep.equal([])
      const disabled = mountField({ model: 'title', validator: 'required', required: true }, {}, { disabled: true })
      expect(await disabled.vm.validate()).to.deep.equal([])
    })

    it('announces the outcome, unless the parent form is driving', async () => {
      const field = mountField({ model: 'title', validator: 'required', required: true }, {})
      await field.vm.validate()
      expect(field.emitted('validated')[0].slice(0, 2)).to.deep.equal([false, ['This field is required!']])
      await field.vm.validate(true)
      expect(field.emitted('validated')).to.have.length(1)
    })

    it('calls the schema onValidated hook with the errors it collected', async () => {
      const onValidated = vi.fn()
      const field = mountField({ model: 'title', validator: 'required', required: true, onValidated }, {})
      await field.vm.validate()
      expect(onValidated.mock.calls[0][1]).to.deep.equal(['This field is required!'])
    })

    it('clears the errors from the previous run', async () => {
      const field = mountField({ model: 'title', validator: 'required', required: true }, {})
      await field.vm.validate()
      expect(field.vm.errors).to.have.length(1)
      await field.setProps({ model: { title: 'given' } })
      expect(await field.vm.validate()).to.deep.equal([])
      expect(field.vm.errors).to.deep.equal([])
    })

    it('awaits promised errors when the form asks for async validation', async () => {
      const slow = () => Promise.resolve(['late'])
      const field = mountField({ model: 'title', validator: slow }, {}, { formOptions: { validateAsync: true } })
      expect(await field.vm.validate()).to.deep.equal(['late'])
    })

    // Defect, not intent (#109): convertValidator returns null for a name it cannot resolve, with the
    // comment 'caller need to handle null' — and the caller calls .bind() on it straight away. So
    // a schema naming a validator that does not exist takes the field down rather than warning.
    it('throws when the schema names a validator that does not exist', async () => {
      const field = mountField({ model: 'title', validator: 'no-such-validator' }, {})
      await expect(field.vm.validate()).rejects.toThrow(TypeError)
    })
  })

  describe('reading the schema', () => {
    it('reads a key and an option, each with a default', () => {
      const field = mountField({ model: 'title', rows: 5, options: { hint: 'a hint' } }, {})
      expect([field.vm.get('rows'), field.vm.get('missing'), field.vm.get('missing', 'fallback')]).to.deep.equal([5, false, 'fallback'])
      expect([field.vm.getOpt('hint'), field.vm.getOpt('nope', 'fallback')]).to.deep.equal(['a hint', 'fallback'])
    })

    it('joins every variant flag the schema sets', () => {
      expect(mountField({ outlined: true, 'solo-filled': true }, {}).vm.getVariant()).to.equal('outlined solo-filled')
      expect(mountField({}, {}).vm.getVariant()).to.equal('')
    })

    it('shows a hint only while the field has no errors', async () => {
      const field = mountField({ model: 'title', validator: 'required', required: true, options: { hint: 'a hint' } }, {})
      // Note the shape: `hint && !errors.length` returns the boolean, never the hint text.
      expect(field.vm.showHint()).to.equal(true)
      await field.vm.validate()
      expect(field.vm.showHint()).to.equal(false)
    })

    it('splits the locale off the model the way the rest of the admin does', () => {
      expect(mountField({ model: 'title.enUS', localised: true }, {}).vm.getKeyLocale()).to.deep.equal({ key: 'title', locale: 'enUS' })
      expect(mountField({ model: 'meta.title' }, {}).vm.getKeyLocale()).to.deep.equal({ key: 'meta.title' })
    })

    it('hands back the field classes, defaulting to none', () => {
      expect(mountField({ fieldClasses: ['wide'] }, {}).vm.getFieldClasses()).to.deep.equal(['wide'])
      expect(mountField({}, {}).vm.getFieldClasses()).to.deep.equal([])
    })
  })

  describe('focus', () => {
    it('highlights the paragraph it belongs to, and clears it on blur', () => {
      const field = mountField({ model: 'title' }, {}, { paragraphLevel: 2, paragraphIndex: 3 })
      field.vm.onFieldFocus(true)
      expect(highlightParagraph).toHaveBeenCalledWith(1, 3)
      field.vm.onFieldFocus(false)
      expect(highlightParagraph).toHaveBeenLastCalledWith(-1, -1)
    })
  })
})
