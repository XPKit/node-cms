const os = require('os')
const path = require('path')
const fs = require('fs-extra')
const chai = require('chai')
const _ = require('lodash')
const expect = chai.expect
const createJsonStore = require('../../lib/db/json_store')

// A record whose id does not carry this server's machine id belongs to another instance, and the
// store refuses to touch it. It used to refuse by *returning* `{error}`, which every caller passed
// on as a result - so the REST layer answered 200 and the record quietly survived the delete (#105).
describe('JsonStore ownership guards', () => {
  const mid = '42424242'
  let dir
  let store

  const ownId = 'mu5abcde42424242yaaaaaa'
  const foreignId = 'mu5abcde99999999yaaaaaa'

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'node-cms-guards-'))
    store = createJsonStore(dir, mid, { schema: [{ field: 'name' }] }, 'widgets')
    await store.open()
    await store.create(ownId, { _id: ownId, name: 'ours' })
  })

  afterEach(async () => {
    await store.close()
    await fs.remove(dir)
  })

  const rejection = async (promise) => {
    try {
      const result = await promise
      return { resolvedWith: result }
    } catch (error) {
      return { threw: error }
    }
  }

  describe('remove', () => {
    it('deletes a record of its own and says so', async () => {
      expect(await store.remove(ownId)).to.equal(true)
      expect(await store.find(ownId)).to.equal(undefined)
    })

    it('refuses a record belonging to another server by throwing, not by returning', async () => {
      const outcome = await rejection(store.remove(foreignId))
      expect(outcome.resolvedWith, 'refusal was returned as a result').to.equal(undefined)
      expect(outcome.threw).to.include({ code: 403 })
      expect(outcome.threw.message).to.contain('foreign')
    })

    it('leaves the record where it is when it refuses', async () => {
      await rejection(store.remove(foreignId))
      expect(_.get(await store.find(ownId), 'name')).to.equal('ours')
    })
  })

  describe('update', () => {
    it('updates a record of its own', async () => {
      expect(await store.update(ownId, { _id: ownId, name: 'renamed' })).to.include({ name: 'renamed' })
      expect(_.get(await store.find(ownId), 'name')).to.equal('renamed')
    })

    it('refuses a record belonging to another server by throwing, not by returning', async () => {
      const outcome = await rejection(store.update(foreignId, { name: 'theirs' }))
      expect(outcome.resolvedWith, 'refusal was returned as a result').to.equal(undefined)
      expect(outcome.threw).to.include({ code: 403 })
    })
  })
})
