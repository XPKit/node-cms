import { beforeEach, describe, expect, it, vi } from 'vitest'

// Everything the admin sends or receives goes through here, so the shape of a request and the
// decision about what counts as a failure both live in this one file. fetch is stubbed rather than
// intercepted, so each case says exactly what the server answered.
const { default: RequestService } = await import('@s/RequestService')

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

const answers = (body, { ok = true, status = 200, statusText } = {}) =>
  fetchMock.mockResolvedValue({ ok, status, statusText, json: async () => body })

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

    it('keeps its own returnJson flag out of what it sends, but only when it is true', async () => {
      answers({})
      await RequestService.get('/api/articles')
      expect('returnJson' in sentOptions()).to.equal(false)

      // The delete is guarded by the flag's own truthiness, so opting out of json leaves the flag
      // sitting in the options handed to fetch. Harmless, since fetch ignores what it does not
      // recognise, but it is the service's own bookkeeping travelling with the request.
      fetchMock.mockReset()
      answers({})
      await RequestService.get('/api/articles', false)
      expect(sentOptions().returnJson).to.equal(false)
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

  // #113: the response decides whether the request failed, and the body is only ever data. The
  // cases below used to run the other way round - the body was read for a `code` and that decided.
  describe('what it treats as a failure', () => {
    it('returns the parsed body of a successful request', async () => {
      answers({ _id: 'a1', title: 'a title' })
      expect(await RequestService.get('/api/articles/a1')).to.deep.equal({ _id: 'a1', title: 'a title' })
    })

    // A country code, a product code, an error code stored as data. The request succeeded, so the
    // record comes back however its own fields are named.
    it('returns a record whose own code field is not a 2xx number', async () => {
      answers({ _id: 'a1', title: 'Berlin', code: 100 })
      expect(await RequestService.get('/api/cities/a1')).to.deep.equal({ _id: 'a1', title: 'Berlin', code: 100 })
    })

    it('returns a record whose code is a string, and one whose code looks like a status', async () => {
      answers({ _id: 'a1', code: 'DE' })
      expect(await RequestService.get('/api/cities/a1')).to.deep.equal({ _id: 'a1', code: 'DE' })
      fetchMock.mockReset()
      answers({ _id: 'a2', code: 204 })
      expect(await RequestService.get('/api/cities/a2')).to.deep.equal({ _id: 'a2', code: 204 })
    })

    it('throws what the server sent when the request failed', async () => {
      answers({ code: 404, message: 'not found' }, { ok: false, status: 404 })
      await expect(RequestService.get('/api/articles/nope')).rejects.toEqual({ code: 404, message: 'not found' })
    })

    // The failure keeps its status even when the body has nothing to say. An empty body used to be
    // thrown bare - `{}` - leaving the caller unable to tell what failed, or that it was a 500.
    it('still says what went wrong when the error body is empty', async () => {
      answers({}, { ok: false, status: 500, statusText: 'Internal Server Error' })
      await expect(RequestService.get('/api/articles')).rejects.toEqual({ code: 500, message: 'Internal Server Error' })
    })

    it('names the status itself when nothing else supplies a message', async () => {
      answers({}, { ok: false, status: 500 })
      await expect(RequestService.get('/api/articles')).rejects.toEqual({ code: 500, message: 'Request failed with status 500' })
    })

    // The other direction of the same defect: a failed request whose body happens to carry a 2xx
    // code used to be handed back as a success. The body's message survives, its code does not.
    it('reports the status the response carried, not the one its body claims', async () => {
      answers({ code: 200, message: 'service unavailable' }, { ok: false, status: 503 })
      await expect(RequestService.get('/api/articles')).rejects.toEqual({ code: 503, message: 'service unavailable' })
    })

    // A proxy answering with an HTML error page, say. Parsing it throws, which used to be the error
    // the caller saw instead of the 502.
    it('reports the status when the error body is not json at all', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        json: async () => { throw new SyntaxError('Unexpected token <') }
      })
      await expect(RequestService.get('/api/articles')).rejects.toEqual({ code: 502, message: 'Bad Gateway' })
    })

    it('keeps an error body that is not an object, under data', async () => {
      answers('everything is broken', { ok: false, status: 500 })
      await expect(RequestService.get('/api/articles')).rejects.toEqual({
        data: 'everything is broken',
        code: 500,
        message: 'Request failed with status 500'
      })
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
  })
})
