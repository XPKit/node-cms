import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
vi.mock('@s/RequestService', () => ({ default: { get: (...args) => get(...args) } }))

const { default: ResourceService } = await import('@s/ResourceService')

describe('ResourceService', () => {
  beforeEach(() => {
    get.mockReset()
    ResourceService.cacheMap = {}
    ResourceService.paragraphs = {}
    ResourceService.schemas = undefined
  })

  it('caches what it fetched and hands the same records back', async () => {
    const records = [{ _id: '1' }, { _id: '2' }]
    get.mockResolvedValue(records)
    expect(await ResourceService.cache('articles')).to.deep.equal(records)
    expect(ResourceService.get('articles')).to.deep.equal(records)
    expect(get).toHaveBeenCalledTimes(1)
  })

  // The server answers a request from a dropped session with this flag rather than a 401, so the
  // admin reloads into the login page instead of rendering an empty resource.
  it('reloads the page when the server says the session is gone', async () => {
    const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {})
    get.mockResolvedValue({ userLoggedOut: true })
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    expect(await ResourceService.cache('articles')).to.deep.equal([])
    expect(reload).toHaveBeenCalled()
    expect(ResourceService.get('articles')).to.equal(undefined)
    expect(info).toHaveBeenCalled()
  })

  it('says so rather than throwing when a resource was never cached', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    expect(ResourceService.get('nothing-here')).to.equal(undefined)
    expect(info).toHaveBeenCalledWith('resource (nothing-here) is not cached')
  })

  it('asks for the attachment list when fetching every resource', async () => {
    get.mockResolvedValue([{ title: 'articles' }])
    await ResourceService.getAll()
    expect(get.mock.calls[0][0]).to.contain('resources?listAttachments=true')
  })

  it('keys paragraphs by title', async () => {
    get.mockResolvedValue([{ title: 'hero', fields: [] }, { title: 'quote', fields: [] }])
    await ResourceService.getAllParagraphs()
    expect(ResourceService.getParagraphSchema('hero')).to.deep.equal({ title: 'hero', fields: [] })
    expect(ResourceService.getParagraphSchema('missing')).to.equal(false)
  })

  it('finds a schema by resource title', () => {
    ResourceService.setSchemas([{ title: 'articles' }, { title: 'authors' }])
    expect(ResourceService.getSchema('authors')).to.deep.equal({ title: 'authors' })
    expect(ResourceService.getSchema('nothing')).to.equal(undefined)
  })
})
