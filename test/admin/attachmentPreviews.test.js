import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// The two attachment views - the thumbnail in a file field and the larger one with the cropper -
// and the tiptap link button, which is the only menu item with a decision of its own.
vi.mock('@s/TranslateService', () => ({ default: { get: key => key, locale: 'enUS' } }))
const send = vi.fn()
vi.mock('@s/NotificationsService', () => ({ default: { send, sendOmnibarDisplayStatus: vi.fn(), events: { on: vi.fn(), off: vi.fn() } } }))

const { default: PreviewAttachment } = await import('@c/PreviewAttachment.vue')
const { default: ShowAttachment } = await import('@c/ShowAttachment.vue')
const { default: TiptapMenuBar } = await import('@c/fields/TiptapMenuBar.vue')

const mountIt = (component, props = {}) => mount(component, {
  props, shallow: true,
  global: { mocks: { $filters: { translate: key => key }, $loading: { start: vi.fn(), stop: vi.fn() } } }
})

describe('PreviewAttachment', () => {
  beforeEach(() => vi.clearAllMocks())

  const preview = (props = {}) => mountIt(PreviewAttachment, { attachment: {}, index: 0, ...props }).vm

  it('names why an attachment is dirty, shouting the reason as a key', () => {
    expect(preview({ attachment: { dirty: 'to-be-deleted' } }).getDirtyReason()).to.equal('TL_TO_BE_DELETED')
    expect(preview().getDirtyReason()).to.equal('TL_DIRTY')
  })

  it('finds the filename flat or under fields, and settles for nothing', () => {
    const vm = preview()
    expect(vm.getAttachmentFilename({ _filename: 'flat.png' })).to.equal('flat.png')
    expect(vm.getAttachmentFilename({ _fields: { _filename: 'nested.png' } })).to.equal('nested.png')
    expect(vm.getAttachmentFilename({})).to.equal('')
  })

  it('keys a row by filename and whichever identifier it has, falling back to its position', () => {
    const vm = preview({ index: 4 })
    expect(vm.getKey({ _filename: 'a.png', _id: 'x1' })).to.equal('a.png-x1')
    expect(vm.getKey({ _filename: 'a.png', _createdAt: 99 })).to.equal('a.png-99')
    expect(vm.getKey({ _filename: 'a.png' })).to.equal('a.png-4')
  })

  it('copies the filename and says so', () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn() } })
    preview({ attachment: { _filename: 'shot.jpg' } }).copyFilenameToClipboard()
    expect(send).toHaveBeenCalledWith('Filename has been copied.', 'success')
  })

  it('reports a crop against its own position, keeping only the coordinates', () => {
    const onCropperChange = vi.fn()
    preview({ index: 2, onCropperChange }).onCropperChangeForAttachment({ coordinates: { left: 1 }, canvas: 'ignored' })
    expect(onCropperChange).toHaveBeenCalledWith(2, { coordinates: { left: 1 } })
  })
})

describe('ShowAttachment', () => {
  const shown = (props = {}) => mountIt(ShowAttachment, { attachment: {}, schema: {}, ...props }).vm

  it('shows the stored url, or the data of a file not yet uploaded', () => {
    expect(shown({ attachment: { url: '/api/a/1' } }).imageUrl()).to.equal('/api/a/1')
    expect(shown({ attachment: { data: 'data:image/png;base64,AA' } }).imageUrl()).to.equal('data:image/png;base64,AA')
    expect(shown().imageUrl()).to.equal('')
  })

  it('reads a crop option off the schema, with false for anything absent', () => {
    const vm = shown({ schema: { crop: { aspectRatio: 1.5 } } })
    expect([vm.hasOpt('aspectRatio'), vm.hasOpt('missing')]).to.deep.equal([1.5, false])
  })

  it('remembers that the image failed to load', () => {
    const vm = shown()
    vm.setLoadingError(true)
    expect(vm.loadingError).to.equal(true)
  })

  it('opens the file in a new tab, restoring the extension the url has lost', () => {
    const open = vi.fn(() => ({ focus: vi.fn() }))
    vi.stubGlobal('open', open)
    shown({ attachment: { _filename: 'shot.jpg', url: '/api/a/1' } }).viewFile()
    expect(open.mock.calls[0][0]).to.contain('/api/a/1.jpg')
    expect(open.mock.calls[0][1]).to.equal('_blank')
  })

  it('adds no extension when the filename has none, and opens nothing without an attachment', () => {
    const open = vi.fn(() => ({ focus: vi.fn() }))
    vi.stubGlobal('open', open)
    shown({ attachment: { _filename: 'noext', url: '/api/a/1' } }).viewFile()
    expect(open.mock.calls[0][0]).to.contain('/api/a/1')
    open.mockClear()
    shown({ attachment: false }).viewFile()
    expect(open).not.toHaveBeenCalled()
  })

  describe('where the crop box starts', () => {
    it('reopens at the crop already stored on the attachment', () => {
      const vm = shown({ attachment: { cropOptions: { left: 10, top: 20 } } })
      expect(vm.getDefaultCropPosition({ imageSize: { width: 100, height: 100 }, coordinates: { width: 10, height: 10 } }))
        .to.deep.equal({ left: 10, top: 20 })
    })

    it('centres itself on a fresh image', () => {
      const vm = shown({ attachment: {} })
      expect(vm.getDefaultCropPosition({ imageSize: { width: 100, height: 60 }, coordinates: { width: 20, height: 20 } }))
        .to.deep.equal({ left: 40, top: 20 })
    })

    it('centres within the visible area when the image is scrolled', () => {
      const vm = shown({ attachment: {} })
      expect(vm.getDefaultCropPosition({
        imageSize: { width: 500, height: 500 },
        visibleArea: { left: 100, top: 50, width: 200, height: 100 },
        coordinates: { width: 20, height: 20 }
      })).to.deep.equal({ left: 190, top: 90 })
    })
  })
})

describe('TiptapMenuBar', () => {
  const chain = { focus: () => chain, extendMarkRange: () => chain, setLink: vi.fn(() => chain), unsetLink: vi.fn(() => chain), run: vi.fn() }
  const editor = { getAttributes: () => ({ href: 'https://old.example' }), chain: () => chain, isActive: () => false, can: () => ({ chain: () => chain }) }
  const bar = () => mountIt(TiptapMenuBar, { editor, buttons: [] }).vm

  beforeEach(() => vi.clearAllMocks())

  it('sets the link the user typed', () => {
    vi.stubGlobal('prompt', vi.fn(() => 'https://new.example'))
    bar().setLink()
    expect(chain.setLink).toHaveBeenCalledWith({ href: 'https://new.example' })
  })

  it('removes the link when the box is emptied', () => {
    vi.stubGlobal('prompt', vi.fn(() => ''))
    bar().setLink()
    expect(chain.unsetLink).toHaveBeenCalled()
    expect(chain.setLink).not.toHaveBeenCalled()
  })

  it('leaves the existing link alone when the prompt is cancelled', () => {
    vi.stubGlobal('prompt', vi.fn(() => null))
    bar().setLink()
    expect(chain.setLink).not.toHaveBeenCalled()
    expect(chain.unsetLink).not.toHaveBeenCalled()
  })
})
