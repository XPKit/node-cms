import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('@s/FieldSelectorService', () => ({ default: { highlightParagraph: vi.fn() } }))
const { default: CustomCheckbox } = await import('@c/fields/CustomCheckbox.vue')

const mountField = (schema = {}, model = {}, props = {}) =>
  mount(CustomCheckbox, {
    props: { schema: { model: 'published', ...schema }, model, ...props },
    shallow: true,
    global: { mocks: { $filters: { translate: key => key } } }
  })

describe('CustomCheckbox', () => {
  describe('reading the value', () => {
    it('reads the record, treating a missing value as unchecked', () => {
      expect(mountField({}, { published: true }).vm.getValue()).to.equal(true)
      expect(mountField({}, {}).vm.getValue()).to.equal(false)
    })

    // A null in the record is the interesting one: the default only applies to a missing key, so
    // without this the checkbox would be handed a null and render neither checked nor unchecked.
    it('treats a stored null as unchecked rather than passing it on', () => {
      expect(mountField({}, { published: null }).vm.getValue()).to.equal(false)
    })
  })

  describe('toggling', () => {
    it('writes the opposite of what the record holds', async () => {
      const model = { published: false }
      const field = mountField({}, model)
      field.vm.onChange()
      await field.vm.$nextTick()
      expect(model.published).to.equal(true)
      field.vm.onChange()
      await field.vm.$nextTick()
      expect(model.published).to.equal(false)
    })

    it('does nothing at all while the field is disabled', async () => {
      const model = { published: false }
      const field = mountField({}, model, { disabled: true })
      field.vm.onChange()
      await field.vm.$nextTick()
      expect(model.published).to.equal(false)
      expect(field.emitted('input')).to.equal(undefined)
    })

    // Redundant rather than wrong: assigning to `_value` already goes through AbstractField's
    // setter, which writes the record and emits `input` itself, so emitting again here makes every
    // toggle announce itself twice. The consequence upstream is that RecordEditor runs its
    // `_.set` and its whole `checkDirty` pass twice per click - wasteful, but the second pass
    // writes the same value. Pinned so that removing one of the two emits is a visible change.
    it('announces the change twice, once from the mixin and once on its own', async () => {
      const field = mountField({}, { published: false })
      field.vm.onChange()
      await field.vm.$nextTick()
      expect(field.emitted('input')).to.have.length(2)
      expect(field.emitted('input')[0]).to.deep.equal([true, 'published'])
      expect(field.emitted('input')[1]).to.deep.equal([true, 'published'])
    })
  })
})
