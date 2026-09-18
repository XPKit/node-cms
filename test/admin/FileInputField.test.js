import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// The mixin behind ImageView and AttachmentView. It reads and writes through AbstractField's
// `_value`, so the host mixes both, the way the real components do. TranslateService returns its
// key, so a rule's failure asserts the message id rather than a sentence.
vi.mock('@s/TranslateService', () => ({ default: { get: key => key } }))
vi.mock('@s/FieldSelectorService', () => ({ default: { highlightParagraph: vi.fn() } }))

const { default: AbstractField } = await import('@m/AbstractField')
const { default: FileInputField } = await import('@m/FileInputField')

const Host = { mixins: [AbstractField, FileInputField], template: '<div />' }
const mountField = (schema = {}, model = {}, props = {}) =>
  mount(Host, { props: { schema: { model: 'photo', ...schema }, model, ...props } })

// A stored attachment, as the server hands it back, and a freshly picked file both flow through
// these methods, so the tests use one of each rather than only the convenient one.
const stored = (extra = {}) => ({ _filename: 'shot.jpg', _contentType: 'image/jpeg', _size: 2048, url: '/api/a/1', ...extra })

describe('FileInputField', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('describing the field', () => {
    it('calls itself an image view or a file view', () => {
      expect(mountField({ type: 'ImageView' }).vm.getFieldType()).to.equal('IMAGE')
      expect(mountField({ type: 'AttachmentView' }).vm.getFieldType()).to.equal('FILE')
      expect(mountField({}).vm.getFieldType()).to.equal('IMAGE')
    })

    it('defaults to an unlimited count', () => {
      expect(mountField({}).vm.getMaxCount()).to.equal(-1)
      expect(mountField({ options: { maxCount: 3 } }).vm.getMaxCount()).to.equal(3)
    })

    it('takes several images unless it is a fixed size or capped at one', () => {
      expect(mountField({}).vm.isForMultipleImages()).to.equal(true)
      expect(mountField({ options: { maxCount: 3 } }).vm.isForMultipleImages()).to.equal(true)
      expect(mountField({ options: { maxCount: 1 } }).vm.isForMultipleImages()).to.equal(false)
      expect(mountField({ width: 100, height: 100 }).vm.isForMultipleImages()).to.equal(false)
    })

    it('pluralises its placeholder only when it takes several', () => {
      expect(mountField({}).vm.getPlaceholder()).to.equal('TL_CLICK_OR_DRAG_AND_DROP_TO_ADD_IMAGES')
      expect(mountField({ options: { maxCount: 1 }, type: 'AttachmentView' }).vm.getPlaceholder()).to.equal('TL_CLICK_OR_DRAG_AND_DROP_TO_ADD_FILE')
    })

    it('disables itself once it holds as many attachments as it allows', () => {
      expect(mountField({}, { photo: [stored()] }).vm.isFieldDisabled()).to.equal(false)
      expect(mountField({ options: { maxCount: 2 } }, { photo: [stored(), stored()] }).vm.isFieldDisabled()).to.equal(true)
      expect(mountField({ options: { maxCount: 2 } }, { photo: [stored()] }, { disabled: true }).vm.isFieldDisabled()).to.equal(true)
    })
  })

  describe('reading an attachment', () => {
    it('takes the first attachment as the one to show', () => {
      const field = mountField({}, { photo: [stored({ _filename: 'first.jpg' }), stored()] })
      expect(field.vm.attachment()._filename).to.equal('first.jpg')
    })

    it('finds the filename whether it is stored flat or under fields', () => {
      const field = mountField({})
      expect(field.vm.getAttachmentFilename({ _filename: 'flat.png' })).to.equal('flat.png')
      expect(field.vm.getAttachmentFilename({ _fields: { _filename: 'nested.png' } })).to.equal('nested.png')
      expect(field.vm.getAttachmentFilename({})).to.equal(false)
    })

    it('recognises an image by extension, by content type, or by a picked file type', () => {
      const field = mountField({})
      expect(field.vm.isImage({ _filename: 'a.png' })).to.equal(true)
      expect(!!field.vm.isImage({ _contentType: 'image/webp' })).to.equal(true)
      expect(!!field.vm.isImage({ file: { type: 'image/gif' } })).to.equal(true)
      expect(!!field.vm.isImage({ _filename: 'a.pdf', _contentType: 'application/pdf' })).to.equal(false)
    })

    it('asks the server to resize a preview, except for svg', () => {
      const field = mountField({})
      expect(field.vm.getPreviewUrl(stored())).to.equal('/api/a/1?resize=autox100')
      expect(field.vm.getPreviewUrl(stored({ _contentType: 'image/svg+xml' }))).to.equal('/api/a/1')
    })

    it('prefers the data of a freshly read file over a server url', () => {
      const field = mountField({})
      expect(field.vm.getImageSrc({ data: 'data:image/png;base64,AAA', url: '/api/a/1' })).to.equal('data:image/png;base64,AAA')
      expect(field.vm.getImageSrc(stored())).to.equal('/api/a/1?resize=autox100')
    })

    it('reports a size from either a stored attachment or a picked file', () => {
      const field = mountField({})
      expect(field.vm.imageSize(stored())).to.equal('2 KB')
      expect(field.vm.imageSize({ file: { size: 1048576 } })).to.equal('1 MB')
    })
  })

  describe('the rules the input validates against', () => {
    // width and height switch the 'too many' rule off, so the rule under test is the only one.
    const only = (schema, model) => mountField({ width: 100, height: 100, ...schema }, model).vm.getRules()

    it('adds no rules at all for an optional field with no options', () => {
      expect(only({})).to.have.length(0)
    })

    it('demands a file for a required field that has none', () => {
      const [required] = only({ required: true })
      expect(required(null)).to.equal('TL_IMAGE_IS_MANDATORY')
      expect(required([])).to.equal('TL_IMAGE_IS_MANDATORY')
    })

    it('is satisfied by an attachment already stored, or by a freshly picked file', () => {
      const [withStored] = only({ required: true }, { photo: [stored()] })
      expect(withStored([])).to.equal(true)
      const [fresh] = only({ required: true })
      expect(fresh({ name: 'picked.png' })).to.equal(true)
    })

    it('names the file wording on an attachment field', () => {
      const [required] = only({ required: true, type: 'AttachmentView' })
      expect(required(null)).to.equal('TL_FILE_IS_MANDATORY')
    })

    it('rejects a file over the configured limit and accepts one under it', () => {
      const [limit] = only({ options: { limit: 1024 } })
      expect(limit({ name: 'big.png', size: 2048 })).to.equal('TL_IMAGE_IS_TOO_BIG')
      expect(limit({ name: 'small.png', size: 512 })).to.equal(true)
      expect(limit(null)).to.equal(true)
    })

    it('matches accept by extension, by mime group and by exact mime type', () => {
      const [accept] = only({ options: { accept: '.png,video/*,application/pdf' } })
      expect(accept([{ name: 'a.png', type: '' }])).to.equal(true)
      expect(accept([{ name: 'a.mp4', type: 'video/mp4' }])).to.equal(true)
      expect(accept([{ name: 'a.pdf', type: 'application/pdf' }])).to.equal(true)
      expect(accept([{ name: 'a.gif', type: 'image/gif' }])).to.equal('TL_INVALID_IMAGE_TYPE')
    })

    // #112: the rule used to accept a total of `maxCount + 1` while onUploadChanged truncated the
    // selection to `maxCount`, so a selection could validate and then silently lose a file. The
    // two now agree, and the boundary is asserted from either side.
    it('accepts a selection up to maxCount and refuses the one that would exceed it', () => {
      const [tooMany] = mountField({ options: { maxCount: 2 } }, { photo: [stored()] }).vm.getRules()
      expect(tooMany([{ name: 'a.png' }])).to.equal(true)
      expect(tooMany([{ name: 'a.png' }, { name: 'b.png' }])).to.equal('TL_TOO_MANY_IMAGES')
    })
  })

  describe('rearranging and removing', () => {
    // Renumbering is unconditional, but the `orderUpdated` flag is not: only an attachment whose
    // number actually changed carries one, which is what tells the server there is something to
    // persist. The second attachment below is already in position 2 and so stays unmarked.
    it('numbers the attachments from one and marks only the ones that moved', () => {
      const model = { photo: [stored({ order: 5 }), stored({ order: 2 })] }
      const field = mountField({}, model)
      field.vm.onEndDrag()
      expect(model.photo.map(a => [a.order, !!a.orderUpdated])).to.deep.equal([[1, true], [2, false]])
    })

    it('leaves an attachment alone when it is already in place', () => {
      const model = { photo: [stored({ order: 1 })] }
      mountField({}, model).vm.onEndDrag()
      expect(model.photo[0].orderUpdated).to.equal(undefined)
    })

    it('removes the attachment at an index and writes the rest back', () => {
      const model = { photo: [stored({ _filename: 'keep.jpg' }), stored({ _filename: 'drop.jpg' })] }
      const field = mountField({}, model)
      field.vm.removeImage(model.photo[1], 1)
      expect(model.photo.map(a => a._filename)).to.deep.equal(['keep.jpg'])
    })
  })

  describe('the key an upload is filed under', () => {
    it('uses the model, or the paragraph key with its locale inside a paragraph', () => {
      expect(mountField({ model: 'photo' }).vm.getFieldKey()).to.equal('photo')
      expect(mountField({ model: 'photo', paragraphKey: 'blocks.0.photo' }).vm.getFieldKey()).to.equal('blocks.0.photo')
      expect(mountField({ model: 'photo.enUS', localised: true, locale: 'enUS', paragraphKey: 'blocks.0.photo' }).vm.getFieldKey()).to.equal('blocks.0.photo.enUS')
    })
  })
})
