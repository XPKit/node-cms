const request = require('supertest')
const chai = require('chai')
const _ = require('lodash')
const expect = chai.expect
const serverUrl = 'http://localhost:9990'
const auth = ['localAdmin', 'localAdmin']

// Regression coverage for #72: the query filter runs after the store has already truncated the
// result set to `limit`, so a limited read filtered whatever arbitrary records came back first.
describe('Query filtering combined with paging', () => {
  const keys = ['alpha', 'beta', 'gamma']
  const created = []

  const list = async (query, options = {}) => {
    const res = await request(serverUrl)
      .get('/api/regions')
      .query(_.extend({ query: JSON.stringify(query) }, options))
      .auth(...auth)
    expect(res.status, `list ${JSON.stringify(query)}`).to.equal(200)
    return res.body
  }

  before(async () => {
    for (const key of keys) {
      const res = await request(serverUrl)
        .post('/api/regions')
        .auth(...auth)
        .send({ key, name: { en: _.capitalize(key), zh: 'shared' } })
      expect(res.status, `create ${key}`).to.equal(200)
      created.push(res.body._id)
    }
  })

  after(async () => {
    for (const id of created) {
      await request(serverUrl).delete(`/api/regions/${id}`).auth(...auth)
    }
  })

  it('finds every record by a unique field when the limit is smaller than the collection', async () => {
    for (const key of keys) {
      const results = await list({ key }, { page: 0, limit: 1 })
      expect(_.map(results, 'key'), `query {key: '${key}'} with limit 1`).to.deep.equal([key])
    }
  })

  it('applies the limit to the records that match, not to the records that were read', async () => {
    const results = await list({ key: _.last(keys) }, { limit: 2 })
    expect(_.map(results, 'key')).to.deep.equal([_.last(keys)])
  })

  it('pages through the matches of a query', async () => {
    const seen = []
    for (let page = 0; page < keys.length; page++) {
      const results = await list({ 'name.zh': 'shared' }, { page, limit: 1 })
      expect(results, `page ${page}`).to.have.lengthOf(1)
      seen.push(_.first(results).key)
    }
    expect(_.sortBy(seen)).to.deep.equal(_.sortBy(keys))
    expect(await list({ 'name.zh': 'shared' }, { page: keys.length, limit: 1 })).to.be.empty
  })

  // #85: nothing applied the offset for a query-less read. filterResults returns early when there is
  // no query, and the store limited without skipping, so every page returned the first one.
  it('pages through a resource with no query', async () => {
    const all = await list({})
    expect(all.length, 'fixture').to.be.at.least(keys.length)
    const limit = 2
    const seen = []
    for (let page = 0; page * limit < all.length; page++) {
      const results = await list({}, { page, limit })
      expect(results.length, `page ${page} size`).to.equal(Math.min(limit, all.length - page * limit))
      seen.push(...results)
    }
    expect(_.map(seen, '_id'), 'the pages concatenate back into the full list').to.deep.equal(_.map(all, '_id'))
    expect(await list({}, { page: Math.ceil(all.length / limit), limit }), 'past the end').to.be.empty
  })

  // checkUniqueFields resolves duplicates through find({query}), so it silently stopped rejecting
  // them once more than one record was present.
  it('rejects a duplicate value in a unique field', async () => {
    for (const key of keys) {
      const res = await request(serverUrl)
        .post('/api/regions')
        .auth(...auth)
        .send({ key, name: { en: 'Duplicate' } })
      if (res.status === 200) {
        created.push(res.body._id)
      }
      expect(res.status, `duplicate create of '${key}'`).to.equal(400)
      expect(_.get(res.body, 'message')).to.contain('key')
    }
  })
})
