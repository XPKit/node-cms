const os = require('os')
const path = require('path')
const fs = require('fs-extra')
const chai = require('chai')
const _ = require('lodash')
const expect = chai.expect
const createJsonStore = require('../../lib/db/json_store')

// The limit and the offset are only the store's to apply when nothing narrows the result set after
// it. Getting that wrong broke find({query}) for every record but one (#84) and made every page of
// a query-less list the first page (#85).
describe('JsonStore.read', () => {
  const mid = '42424242'
  let dir
  let store
  let ids

  const key = (index) => `mu5abcde${mid}y${_.padStart(index, 6, '0')}`

  before(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'node-cms-unit-'))
    store = createJsonStore(dir, mid, { schema: [{ field: 'name' }] }, 'widgets')
    await store.open()
    ids = _.times(5, index => key(index))
    for (const [index, id] of ids.entries()) {
      await store.create(id, { _id: id, name: `widget ${index}`, colour: index % 2 ? 'red' : 'blue' })
    }
  })

  after(async () => {
    await store.close()
    await fs.remove(dir)
  })

  const names = (records) => _.map(records, 'name')

  it('returns everything when no limit is given', async () => {
    expect(await store.read({}, {})).to.have.lengthOf(5)
    expect(await store.read(undefined, undefined)).to.have.lengthOf(5)
  })

  it('applies a limit to a read it is not going to filter', async () => {
    expect(names(await store.read({}, { limit: 2 }))).to.deep.equal(['widget 0', 'widget 1'])
  })

  it('applies the offset as well, so each page is a different page', async () => {
    expect(names(await store.read({}, { page: 0, limit: 2 }))).to.deep.equal(['widget 0', 'widget 1'])
    expect(names(await store.read({}, { page: 1, limit: 2 }))).to.deep.equal(['widget 2', 'widget 3'])
    expect(names(await store.read({}, { page: 2, limit: 2 }))).to.deep.equal(['widget 4'])
    expect(await store.read({}, { page: 3, limit: 2 })).to.be.empty
  })

  it('reads the paging options as numbers when REST hands them over as strings', async () => {
    expect(names(await store.read({}, { page: '1', limit: '2' }))).to.deep.equal(['widget 2', 'widget 3'])
  })

  it('ignores paging options it cannot use', async () => {
    expect(await store.read({}, { limit: 'abc' })).to.have.lengthOf(5)
    expect(await store.read({}, { limit: -1 })).to.have.lengthOf(5)
    expect(names(await store.read({}, { page: -1, limit: 2 }))).to.deep.equal(['widget 0', 'widget 1'])
  })

  // The iterator cannot evaluate a MongoDB-style query, so filterResults does it afterwards and
  // pages what it filtered. Narrowing here first would hand it an arbitrary slice.
  it('leaves both alone when a query it cannot apply will be filtered afterwards', async () => {
    expect(await store.read({ colour: 'red' }, { limit: 1 })).to.have.lengthOf(5)
    expect(await store.read({ colour: 'red' }, { page: 2, limit: 1 })).to.have.lengthOf(5)
  })
})
