import { beforeEach, describe, expect, it, vi } from 'vitest'

// Everything the admin sends or receives goes through here, so the shape of a request and the
// decision about what counts as a failure both live in this one file. fetch is stubbed rather than
// intercepted, so each case says exactly what the server answered.
const { default: RequestService } = await import('@s/RequestService')

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

const answers = (body, { ok = true, status = 200 } = {}) =>
  fetchMock.mockResolvedValue({ ok, status, json: async () => body })

const sentOptions = () => fetchMock.mock.calls[0][1]

describe('RequestService', () => {
  beforeEach(() => fetchMock.mockReset())

  describe('the request it builds', () => {
    it('asks for json and says it is sending json', async () => {
      answers({})
      await RequestService.get('/api/articles')
      expect(fetchMock.mock.calls[0][0]).to.equal('/api/articles')
      expect(sentOptions().method).to.equal('GET')
      expect(sentOptions().headers).to.deep.equal({ Accept: 'application/json', 'Content-Type': 'application/json' })
    })

    it('serialises an object body', async () => {
      answers({})
      await RequestService.post('/api/articles', { title: 'a title' })
      expect(sentOptions().body).to.equal('{"title":"a title"}')
    })

    it('leaves a FormData body alone, and sets no headers that would break its boundary', async () => {
      answers({})
      const form = new FormData()
      form.append('file', 'contents')
      await RequestService.post('/api/articles', form)
      expect(sentOptions().body).to.equal(form)
      expect(sentOptions().headers).to.equal(undefined)
    })

    it('keeps its own returnJson flag out of what it sends', async () => {
      answers({})
      await RequestService.get('/api/articles')
      expect('returnJson' in sentOptions()).to.equal(false)
    })

    it('carries the method through for put and delete', async () => {
      answers({})
      await RequestService.put('/api/articles/1', { title: 'x' })
      expect(sentOptions().method).to.equal('PUT')
      fetchMock.mockReset()
      answers({})
      await RequestService.delete('/api/articles/1')
      expect(sentOptions().method).to.equal('DELETE')
    })
  })

  describe('what it treats as a failure', () => {
    it('returns the parsed body of a successful request', async () => {
      answers({ _id: 'a1', title: 'a title' })
      expect(await RequestService.get('/api/articles/a1')).to.deep.equal({ _id: 'a1', title: 'a title' })
    })

    it('throws the body when it carries a status outside the 2xx range', async () => {
      answers({ code: 404, message: 'not found' })
      await expect(RequestService.get('/api/articles/nope')).rejects.toEqual({ code: 404, message: 'not found' })
    })

    // The status comes from `_.get(json, 'code', response.status)` and the *body* is what gets
    // thrown, so a 500 carrying no body throws a bare `{}` — the caller cannot tell what failed,
    // or even that it was a 500. The `throw response` branch below it needs `code === 0`, which
    // only happens when the response has no status at all.
    it('throws the parsed body on a failed request, even when that body is empty', async () => {
      answers({}, { ok: false, status: 500 })
      await expect(RequestService.get('/api/articles')).rejects.toEqual({})
    })

    it('throws the response itself only when there is no status to read anywhere', async () => {
      answers({}, { ok: false, status: 0 })
      await expect(RequestService.get('/api/articles')).rejects.toMatchObject({ status: 0 })
    })

    it('hands back the raw response, unparsed, when the caller does not want json', async () => {
      answers({ ignored: true })
      const response = await RequestService.get('/api/articles', false)
      expect(response.status).to.equal(200)
      expect(fetchMock).toHaveBeenCalledOnce()
    })

    it('throws the raw response when the caller does not want json and the request failed', async () => {
      answers({}, { ok: false, status: 403 })
      await expect(RequestService.get('/api/articles', false)).rejects.toMatchObject({ status: 403 })
    })

    // Defect, not intent: the status is read as `_.get(json, 'code', response.status)`, so a record
    // that happens to carry its own `code` field has it read as an HTTP status. A CMS resource with
    // a numeric `code` - a country code, a product code - therefore throws its own record on a
    // request that succeeded. Reachable from RecordEditor.vue:487 and :457, which fetch and save a
    // single record (#113). Pinned as it behaves; fixing it inverts these.
    it('throws a successful record whose own code field is not a 2xx number', async () => {
      answers({ _id: 'a1', title: 'Berlin', code: 100 })
      await expect(RequestService.get('/api/cities/a1')).rejects.toMatchObject({ code: 100 })
    })

    it('is unbothered by a non-numeric code, which no comparison can place outside 2xx', async () => {
      answers({ _id: 'a1', code: 'DE' })
      expect(await RequestService.get('/api/cities/a1')).to.deep.equal({ _id: 'a1', code: 'DE' })
    })

    it('lets a record through when its code happens to look like a success status', async () => {
      answers({ _id: 'a1', code: 204 })
      expect(await RequestService.get('/api/cities/a1')).to.deep.equal({ _id: 'a1', code: 204 })
    })
  })
})
