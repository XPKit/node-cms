const chai = require('chai')
const _ = require('lodash')
const expect = chai.expect
const helpers = require('../../lib/helpers')
const UUID = require('../../lib/util/uuid')

// The one definition of "this record is ours". The store's write guards ask it, and so does the
// `_local` flag the admin reads to decide whether a record can be edited, so the two cannot drift
// apart again. It used to be spelled `id.indexOf(mid) === 8` in seven places (#105).
describe('helpers.isOwnRecord', () => {
  const mid = '42424242'

  // Shaped from the producer, not from the guard: if uuid.js ever moves the machine id, this fails
  // here rather than leaving the sweep below quietly testing a layout nothing writes.
  it('agrees with the id generator about where the machine id sits', () => {
    const generated = UUID(mid)()
    expect(generated.slice(8, 16)).to.equal(mid)
    expect(helpers.isOwnRecord(generated, mid)).to.equal(true)
  })

  // The id from the CI run that caught it: the timestamp 'mu6vn642' ends in the two characters the
  // machine id starts with, so indexOf found a match at 6 and the server disowned its own record.
  it('accepts the record the server disowned in the run that caught this', () => {
    expect('mu6vn64242424242ytw1vgr9'.indexOf(mid), 'the trap, as the old check saw it').to.equal(6)
    expect(helpers.isOwnRecord('mu6vn64242424242ytw1vgr9', mid)).to.equal(true)
  })

  // 1296 consecutive milliseconds is every two-character ending base36 can produce, so every
  // timestamp capable of overlapping the machine id is in here. Exactly one used to be refused,
  // which is the one write in 1296 the flake was made of.
  it('accepts its own record whatever the timestamp ends in', () => {
    const base = Date.now()
    const ids = _.times(1296, (ms) => `${(base + ms).toString(36)}${mid}ytw1vgr9`)
    expect(_.reject(ids, (id) => helpers.isOwnRecord(id, mid)), 'ids the server disowned').to.deep.equal([])
  })

  it('refuses an id carrying another server\'s machine id', () => {
    expect(helpers.isOwnRecord('mu5abcde99999999yaaaaaa', mid)).to.equal(false)
  })

  // Carrying the mark somewhere else is not carrying it: only the offset uuid.js writes to counts.
  it('refuses an id that holds the machine id anywhere but that offset', () => {
    expect(helpers.isOwnRecord(`${mid}mu5abcdeyaaaaaa`, mid)).to.equal(false)
  })

  // `_.get(record, '_id', '')` is what the _local sites hand it, so the empty string has to be an
  // answer rather than a throw - and so does a record read before its id was set.
  it('answers false for an id or a machine id that is not a string', () => {
    expect([undefined, null, '', 42].map((id) => helpers.isOwnRecord(id, mid))).to.deep.equal([false, false, false, false])
    expect(helpers.isOwnRecord('mu5abcde42424242yaaaaaa', undefined)).to.equal(false)
  })
})
