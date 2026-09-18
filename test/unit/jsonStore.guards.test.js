const os = require('os')
const path = require('path')
const fs = require('fs-extra')
const chai = require('chai')
const _ = require('lodash')
const expect = chai.expect
const createJsonStore = require('../../lib/db/json_store')
const UUID = require('../../lib/util/uuid')

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

  // The check itself, which is what decides all of the above. It used to be `id.indexOf(mid) === 8`
  // under the name startsWith - a different question, because indexOf answers with the first
  // occurrence rather than the one at that offset (#105).
  describe('owns', () => {
    // Shaped from the producer, not from the guard: if uuid.js ever moves the machine id, this
    // fails here rather than leaving the sweep below quietly testing the wrong layout.
    it('agrees with the id generator about where the machine id sits', () => {
      const generated = UUID(mid)()
      expect(generated.slice(8, 16)).to.equal(mid)
      expect(store.owns(generated)).to.equal(true)
    })

    // The id from the CI run that finally caught it. indexOf finds '42424242' at 6, because the
    // timestamp 'mu6vn642' ends in the same two characters the machine id starts with.
    it('accepts the record the server disowned in the run that caught this', () => {
      expect('mu6vn64242424242ytw1vgr9'.indexOf(mid), 'the trap, as the old check saw it').to.equal(6)
      expect(store.owns('mu6vn64242424242ytw1vgr9')).to.equal(true)
    })

    // 1296 consecutive milliseconds is every two-character ending base36 can produce, so every
    // timestamp that can overlap the machine id is in here - roughly one of them used to be
    // refused, which is the one write in 1296 the flake was made of.
    it('accepts its own record whatever the timestamp ends in', () => {
      const base = Date.now()
      const ids = _.times(1296, (ms) => `${(base + ms).toString(36)}${mid}ytw1vgr9`)
      expect(_.reject(ids, (id) => store.owns(id)), 'ids the server disowned').to.deep.equal([])
    })

    it('still refuses an id carrying another server\'s machine id', () => {
      expect(store.owns(foreignId)).to.equal(false)
    })

    // Carrying the mark somewhere else is not carrying it: only the offset uuid.js writes to counts.
    it('refuses an id that holds the machine id anywhere but that offset', () => {
      expect(store.owns(`${mid}mu5abcdeyaaaaaa`)).to.equal(false)
    })

    it('answers false for an id that is not a string, rather than throwing', () => {
      expect(store.owns(undefined)).to.equal(false)
      expect(store.owns(null)).to.equal(false)
    })
  })

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

    // The foreign record has to exist for this to mean anything: the guard refuses before the
    // database is touched, so without it `find` would answer undefined either way and the case
    // would pass with the store deleting everything in sight.
    it('leaves a foreign record that does exist exactly where it is', async () => {
      await store.create(foreignId, { _id: foreignId, name: 'theirs' })
      expect(_.get(await store.find(foreignId), 'name')).to.equal('theirs')

      await rejection(store.remove(foreignId))
      expect(_.get(await store.find(foreignId), 'name')).to.equal('theirs')
    })

    it('leaves a foreign record unchanged when an update is refused', async () => {
      await store.create(foreignId, { _id: foreignId, name: 'theirs' })
      await rejection(store.update(foreignId, { _id: foreignId, name: 'renamed' }))
      expect(_.get(await store.find(foreignId), 'name')).to.equal('theirs')
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
