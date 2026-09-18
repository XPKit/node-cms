import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// What every record editor inherits: sending attachments to the server, turning a failed save into
// a message, and arranging the schema into the layout the resource declares.
const requests = []
vi.mock('@s/RequestService', () => ({
  default: {
    post: vi.fn(async (url, body) => requests.push({ method: 'POST', url, body })),
    put: vi.fn(async (url, body) => requests.push({ method: 'PUT', url, body })),
    delete: vi.fn(async (url, body) => requests.push({ method: 'DELETE', url, body }))
  }
}))
const send = vi.fn()
vi.mock('@s/NotificationsService', () => ({ default: { send, sendOmnibarDisplayStatus: vi.fn() } }))
vi.mock('@s/TranslateService', () => ({ default: { get: key => key } }))

const { default: AbstractEditorView } = await import('@c/AbstractEditorView')

const host = (resource = { title: 'articles' }) => mount({
  mixins: [AbstractEditorView],
  props: ['resource'],
  template: '<div />'
}, {
  props: { resource },
  global: { mocks: { $loading: { start: vi.fn(), stop: vi.fn() } } }
}).vm

const fieldsOf = (body) => Object.fromEntries([...body.entries()])

describe('AbstractEditorView', () => {
  beforeEach(() => { requests.length = 0; vi.clearAllMocks() })

  describe('sending an attachment', () => {
    it('posts each attachment as form data under its own field', async () => {
      await host().uploadAttachments('a1', [{ field: 'photo', file: 'binary', _filename: 'shot.jpg' }])
      expect(requests[0].method).to.equal('POST')
      expect(requests[0].url).to.equal('../api/articles/a1/attachments')
      expect(fieldsOf(requests[0].body)).to.deep.equal({ photo: 'binary', _filename: 'shot.jpg' })
    })

    it('carries the locale of a localised attachment', async () => {
      await host().uploadAttachments('a1', [{ field: 'photo', file: 'binary', _fields: { locale: 'enUS' } }])
      expect(fieldsOf(requests[0].body).locale).to.equal('enUS')
    })

    it('sends crop options as json, and an order only once it has actually moved', async () => {
      vi.spyOn(console, 'info').mockImplementation(() => {})
      await host().uploadAttachments('a1', [
        { field: 'photo', file: 'b', cropOptions: { data: { coordinates: { left: 1 } } }, order: 2, orderUpdated: true },
        { field: 'photo', file: 'b', order: 3 }
      ])
      expect(fieldsOf(requests[0].body).cropOptions).to.equal('{"data":{"coordinates":{"left":1}}}')
      expect(fieldsOf(requests[0].body).order).to.equal('2')
      expect('order' in fieldsOf(requests[1].body)).to.equal(false)
    })

    it('reports a failed upload rather than letting it escape', async () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { default: RequestService } = await import('@s/RequestService')
      RequestService.post.mockRejectedValueOnce(new Error('no network'))
      await host().uploadAttachments('a1', [{ field: 'photo', file: 'b' }])
      expect(error).toHaveBeenCalled()
    })
  })

  describe('updating and removing attachments', () => {
    it('sends only the fields the server needs to identify and place one', async () => {
      await host().updateAttachments('a1', [{ _id: 'x1', _name: 'photo', order: 2, cropOptions: {}, file: 'dropped', _filename: 'dropped.jpg' }])
      expect(requests[0]).to.deep.equal({
        method: 'PUT',
        url: '../api/articles/a1/attachments',
        body: [{ _id: 'x1', cropOptions: {}, order: 2, _name: 'photo' }]
      })
    })

    it('sends nothing but the ids when removing', async () => {
      await host().removeAttachments('a1', [{ _id: 'x1', _name: 'photo', order: 2 }])
      expect(requests[0].body).to.deep.equal([{ _id: 'x1' }])
    })
  })

  describe('reporting a failed save', () => {
    it('names the operation that failed', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      host().manageError({}, 'create', {})
      expect(send).toHaveBeenCalledWith('TL_ERROR_ON_RECORD_CREATE', 'error')
    })

    it('adds the server message, but only when the server explained itself', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      host().manageError({ code: 400, message: 'title is required' }, 'update', {})
      expect(send).toHaveBeenCalledWith('TL_ERROR_ON_RECORD_UPDATE: title is required', 'error')

      send.mockClear()
      host().manageError({ code: 500, message: 'boom' }, 'update', {})
      expect(send).toHaveBeenCalledWith('TL_ERROR_ON_RECORD_UPDATE', 'error')
    })
  })

  describe('arranging the layout', () => {
    it('leaves a schema with no layout exactly as it is', () => {
      const schema = { fields: [{ model: 'title' }] }
      expect(host().formatSchemaLayout(schema)).to.equal(schema)
    })

    it('attaches each field schema to its place in the layout', () => {
      vi.spyOn(console, 'info').mockImplementation(() => {})
      const title = { model: 'title.enUS', originalModel: 'title' }
      const schema = { fields: [title], layout: { lines: [{ fields: [{ model: 'title.enUS' }] }] } }
      const arranged = host().formatSchemaLayout(schema)
      expect(arranged.layout.lines[0].fields[0].schema).to.equal(title)
      expect(arranged.layout.lines[0].slots).to.equal(1)
    })

    it('matches a line entry that names the field before its locale was appended', () => {
      vi.spyOn(console, 'info').mockImplementation(() => {})
      const title = { model: 'title.enUS', originalModel: 'title' }
      const schema = { fields: [title], layout: { lines: [{ fields: [{ model: 'title' }] }] } }
      expect(host().formatSchemaLayout(schema).layout.lines[0].fields[0].schema).to.equal(title)
    })

    it('appends a field the layout forgot, and says so', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      vi.spyOn(console, 'info').mockImplementation(() => {})
      const schema = { fields: [{ model: 'title' }, { model: 'body' }], layout: { lines: [{ fields: [{ model: 'title' }] }] } }
      const arranged = host().formatSchemaLayout(schema)
      expect(arranged.layout.lines).to.have.length(2)
      expect(arranged.layout.lines[1].fields[0].model).to.equal('body')
      expect(warn).toHaveBeenCalledWith('not placed field body in layout, placing at the end')
    })

    it('complains about a line naming a field the schema does not have', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(console, 'info').mockImplementation(() => {})
      host().formatSchemaLayout({ fields: [], layout: { lines: [{ fields: [{ model: 'ghost' }] }] } })
      expect(error).toHaveBeenCalledWith("Couldn't find schema for field ghost")
    })
  })
})
