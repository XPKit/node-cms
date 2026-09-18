import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// ImageView and AttachmentView are the two file fields, and both are almost entirely the mixins
// they compose. Group is the container a nested schema renders into; its own work is delegating
// validation to the form it wraps.
vi.mock('@s/FieldSelectorService', () => ({ default: { highlightParagraph: vi.fn() } }))
vi.mock('@s/TranslateService', () => ({ default: { get: key => key } }))

const { default: ImageView } = await import('@c/fields/ImageView.vue')
const { default: AttachmentView } = await import('@c/fields/AttachmentView.vue')
const { default: Group } = await import('@c/fields/Group.vue')

const mountField = (component, schema = {}, model = {}, props = {}) =>
  mount(component, {
    props: { schema: { model: 'photo', ...schema }, model, ...props },
    shallow: true,
    global: { mocks: { $filters: { translate: key => key } } }
  })

const stored = (extra = {}) => ({ _filename: 'shot.jpg', _contentType: 'image/jpeg', url: '/api/a/1', ...extra })

describe('ImageView', () => {
  it('records a crop against the right attachment and marks it updated', () => {
    const model = { photo: [stored(), stored({ _filename: 'other.jpg' })] }
    const field = mountField(ImageView, {}, model)
    field.vm.onCropperChange(1, { coordinates: { left: 10, top: 20, width: 30, height: 40 } })
    expect(model.photo[1].cropOptions).to.deep.equal({ data: { coordinates: { left: 10, top: 20, width: 30, height: 40 } }, updated: true })
    expect(model.photo[0].cropOptions).to.equal(undefined)
  })

  it('keeps only the coordinates, not whatever else the cropper reports', () => {
    const model = { photo: [stored()] }
    const field = mountField(ImageView, {}, model)
    field.vm.onCropperChange(0, { coordinates: { left: 1 }, canvas: 'ignored', image: 'ignored' })
    expect(model.photo[0].cropOptions.data).to.deep.equal({ coordinates: { left: 1 } })
  })

  it('answers the file mixin as an image field', () => {
    expect(mountField(ImageView, { type: 'ImageView' }).vm.getFieldType()).to.equal('IMAGE')
  })
})

describe('AttachmentView', () => {
  // It adds no behaviour of its own; what is worth pinning is that it composes both mixins, since
  // the file half is useless without the value half.
  it('composes both mixins, and answers as a file field rather than an image one', () => {
    const field = mountField(AttachmentView, { type: 'AttachmentView' }, { photo: [stored()] })
    expect(field.vm.getFieldType()).to.equal('FILE')
    expect(field.vm.getAttachments()).to.have.length(1)
    expect(field.vm.getPlaceholder()).to.equal('TL_CLICK_OR_DRAG_AND_DROP_TO_ADD_FILES')
  })
})

describe('Group', () => {
  // Methods declared inside a component are bound copies, so a vi.fn() placed there is not the
  // object a spy assertion would see. Recording the calls in a list instead.
  const delegated = []
  beforeEach(() => { delegated.length = 0 })

  // Group's whole job is delegation, so the form it wraps is a stub carrying the methods it calls.
  // Assigning to `$refs` directly does not work: Vue repopulates it on render, so the stub has to
  // be a real component for `ref="input"` to resolve to it.
  const group = (form = {}) => {
    const CustomForm = {
      name: 'custom-form',
      props: ['model', 'schema', 'paragraphLevel'],
      template: '<div />',
      data: () => ({ errors: form.errors || [] }),
      methods: {
        validate: form.validate || (async () => []),
        clearValidationErrors: () => delegated.push('clearValidationErrors'),
        debouncedValidate: () => delegated.push('debouncedValidate')
      }
    }
    return mount(Group, {
      props: { schema: { model: 'meta', groupOptions: {} }, model: {} },
      global: {
        components: { 'custom-form': CustomForm, 'field-label': { template: '<div />' } },
        mocks: { $filters: { translate: key => key } }
      }
    })
  }

  it('passes when the form it wraps reports no errors', async () => {
    expect(await group().vm.validate()).to.equal(true)
  })

  it('throws and keeps the errors when the form it wraps reports some', async () => {
    const field = group({ validate: async () => ['a problem'], errors: ['a problem'] })
    await expect(field.vm.validate()).rejects.toThrow('group validation error')
    expect(field.vm.errors).to.deep.equal(['a problem'])
  })

  it('hands clearing and debounced validation to the form it wraps', () => {
    const field = group()
    field.vm.clearValidationErrors()
    field.vm.debouncedValidate()
    expect(delegated).to.deep.equal(['clearValidationErrors', 'debouncedValidate'])
  })

  it('passes a nested field change up to its own parent', () => {
    const field = group()
    field.vm.onModelUpdated('a value', 'meta.title')
    expect(field.emitted('input')[0]).to.deep.equal(['a value', 'meta.title'])
  })
})
