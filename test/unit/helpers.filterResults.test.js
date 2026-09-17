const chai = require('chai')
const _ = require('lodash')
const expect = chai.expect
const helpers = require('../../lib/helpers')

// filterResults is where a MongoDB-style query is actually applied, and where the matches are paged.
// The store leaves both to it for any read carrying a query, so this is the only thing standing
// between a caller's query and what comes back.
describe('helpers.filterResults', () => {
  const records = [
    { _id: 'a', colour: 'red', size: 1 },
    { _id: 'b', colour: 'blue', size: 2 },
    { _id: 'c', colour: 'red', size: 3 },
    { _id: 'd', colour: 'green', size: 4 }
  ]

  const run = (query, options, results = records) => {
    const calls = []
    const context = {
      params: { query, options },
      _result: results,
      next: () => calls.push({ next: true }),
      result: value => calls.push({ result: value }),
      error: error => calls.push({ error })
    }
    helpers.filterResults(context)
    return _.first(calls)
  }

  it('passes a read with no query straight through', () => {
    for (const query of [undefined, null, {}, 'not an object']) {
      expect(run(query, {}), `query ${JSON.stringify(query)}`).to.deep.equal({ next: true })
    }
  })

  it('keeps only the records a query matches', () => {
    expect(_.map(run({ colour: 'red' }, {}).result, '_id')).to.deep.equal(['a', 'c'])
  })

  it('matches against the record and its _doc together', () => {
    const localised = [{ _id: 'a', _doc: { title: 'hello' } }, { _id: 'b', _doc: { title: 'goodbye' } }]
    expect(_.map(run({ title: 'hello' }, {}, localised).result, '_id')).to.deep.equal(['a'])
  })

  // Pinned to what it does, not what it looks like it should do: Helpers.initializeSift registers a
  // case-insensitive `regex` operator, but sift 3 does not pick it up, so matching is case
  // sensitive and that registration - along with the lru-cache it exists for - is inert.
  it('supports $regex, case sensitively', () => {
    expect(_.map(run({ colour: { $regex: '^re' } }, {}).result, '_id')).to.deep.equal(['a', 'c'])
    expect(run({ colour: { $regex: '^RE' } }, {}).result).to.be.empty
  })

  it('supports the mongo operators sift brings', () => {
    expect(_.map(run({ size: { $gte: 3 } }, {}).result, '_id')).to.deep.equal(['c', 'd'])
  })

  it('pages the records it matched, not the records it was handed', () => {
    expect(_.map(run({ size: { $gte: 1 } }, { page: 0, limit: 2 }).result, '_id')).to.deep.equal(['a', 'b'])
    expect(_.map(run({ size: { $gte: 1 } }, { page: 1, limit: 2 }).result, '_id')).to.deep.equal(['c', 'd'])
    expect(run({ size: { $gte: 1 } }, { page: 2, limit: 2 }).result).to.be.empty
    expect(_.map(run({ colour: 'red' }, { page: 1, limit: 1 }).result, '_id')).to.deep.equal(['c'])
  })

  it('reads the paging options as numbers when REST hands them over as strings', () => {
    expect(_.map(run({ size: { $gte: 1 } }, { page: '1', limit: '2' }).result, '_id')).to.deep.equal(['c', 'd'])
  })

  it('returns an empty list rather than everything when nothing matches', () => {
    expect(run({ colour: 'purple' }, {}).result).to.be.empty
  })
})
