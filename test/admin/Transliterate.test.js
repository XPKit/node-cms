import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'

// A slug field: it watches another field on the same record and keeps a transliterated slug of it.
// The interesting part is when it stops doing that - an editable one that the user has typed into
// is left alone until they empty it again.
vi.mock('@s/FieldSelectorService', () => ({ default: { highlightParagraph: vi.fn() } }))
const { default: Transliterate } = await import('@c/fields/Transliterate.vue')

// Each record below is reactive for the same reason it is in the admin: the watcher on the source
// field only fires if the object it reads is tracked, and a plain object passed as a prop is not —
// wrapping it inside the helper would not do, because the test would then hold the raw object and
// mutate something nothing is watching.
const mountField = (options = {}, model = {}) =>
  mount(Transliterate, {
    props: { schema: { model: 'slug', options: { valueFrom: 'title', ...options } }, model: reactive(model) },
    shallow: true,
    global: { mocks: { $filters: { translate: key => key } } }
  })

describe('Transliterate', () => {
  it('slugifies the source field as soon as it is mounted', () => {
    const model = reactive({ title: 'Hello World' })
    mountField({}, model)
    expect(model.slug).to.equal('hello-world')
  })

  it('follows the source field when it changes', async () => {
    const model = reactive({ title: 'First' })
    const field = mountField({}, model)
    model.title = 'Second Title'
    await field.vm.$nextTick()
    expect(model.slug).to.equal('second-title')
  })

  it('transliterates rather than dropping what it cannot spell', () => {
    const model = reactive({ title: 'Über Straße' })
    mountField({}, model)
    expect(model.slug).to.equal('uber-strasse')
  })

  it('clears the slug when the source is emptied', async () => {
    const model = reactive({ title: 'Something' })
    const field = mountField({}, model)
    model.title = '   '
    await field.vm.$nextTick()
    expect(model.slug).to.equal('')
  })

  it('is readonly unless the schema says otherwise', () => {
    expect(mountField().vm.isReadonly).to.equal(true)
    expect(mountField({ readonly: false }).vm.isReadonly).to.equal(false)
  })

  it('warns and stays empty when nobody told it which field to follow', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const field = mountField({ valueFrom: undefined }, { title: 'Hello' })
    expect(field.vm.sourceValue).to.equal('')
    expect(warn).toHaveBeenCalled()
  })

  describe('once the field is editable', () => {
    it('stops following the source after the user types into it', async () => {
      const model = reactive({ title: 'First' })
      const field = mountField({ readonly: false }, model)
      field.vm.onChangeData('my-own-slug')
      await field.vm.$nextTick()
      model.title = 'Second'
      await field.vm.$nextTick()
      expect(model.slug).to.equal('my-own-slug')
    })

    it('starts following again once the user clears it', async () => {
      const model = reactive({ title: 'First' })
      const field = mountField({ readonly: false }, model)
      field.vm.onChangeData('my-own-slug')
      await field.vm.$nextTick()
      field.vm.onChangeData('')
      await field.vm.$nextTick()
      model.title = 'Second'
      await field.vm.$nextTick()
      expect(model.slug).to.equal('second')
    })

    it('keeps following a readonly field no matter what is written to it', async () => {
      const model = reactive({ title: 'First' })
      const field = mountField({}, model)
      field.vm.onChangeData('my-own-slug')
      await field.vm.$nextTick()
      model.title = 'Second'
      await field.vm.$nextTick()
      expect(model.slug).to.equal('second')
    })
  })
})
