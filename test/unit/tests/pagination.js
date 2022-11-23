const _ = require('lodash')
const request = require('supertest')
const Helper = require('../../helper')
const helper = Helper.getInstance()

exports.suite = () => {
  let seeds = []
  before(async () => {
    const comments = await helper.getRequest('/api/comments')
    for (const comment of comments) {
      await request(helper.MASTER_URL)
        .del(`/api/comments/${comment._id}`)
        .auth('localAdmin', 'localAdmin')
    }
    seeds = await helper.createDummyRecords('/api/comments', 10)
  })

  it('should reflect changes when "limit" and "page" are set', async () => {
    let body = await helper.getRequest('/api/comments?unpublished=true&limit=5&page=1')
    body.should.have.length(5)
    body.should.deep.equal(_.map(seeds.slice(0, 5), article => _.extend({_local: true}, article)))
    body = await helper.getRequest('/api/comments?unpublished=true&limit=5&page=2')
    body.should.have.length(5)
    body.should.deep.equal(_.map(seeds.slice(5, 10), article => _.extend({_local: true}, article)))
  })

  it('should return all record when "limit" are not set', async () => {
    const body = await helper.getRequest('/api/comments?unpublished=true')
    body.should.have.length(10)
    body.should.deep.equal(_.map(seeds, article => _.extend({_local: true}, article)))
  })
}
