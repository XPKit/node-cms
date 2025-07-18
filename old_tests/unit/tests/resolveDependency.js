const _ = require('lodash')
const request = require('supertest')
const Helper = require('../../helper')
const helper = Helper.getInstance()

exports.suite = () => {
  let comments = []
  let article = null
  let commentNested = null
  let articleNested = null
  before(async () => {
    const data = await helper.createRecordsForDependencyTests(helper.cms)
    comments = data.comments
    article = data.article
    commentNested = data.commentNested
    articleNested = data.articleNested
  })

  it('should return object with dependency defined by list', async () => {
    const api = helper.cms.api()
    const result = await api('articles', 'comments').list({_id: article._id})
    article = _.first(result)
    article.comment.should.deep.equal(_.first(comments))
    article.comments.should.deep.equal(comments)
  })

  it('should return object with dependency defined by find', async () => {
    const api = helper.cms.api()
    const result = await api('articles', 'comments').find(article._id)
    article = result
    article.comment.should.deep.equal(_.first(comments))
    article.comments.should.deep.equal(comments)
  })

  it('should return nested object with dependency defined by find', async () => {
    const api = helper.cms.api()
    const result = await api('articles', 'comments', 'authors').find(articleNested._id)
    articleNested = result
    articleNested.comment.should.deep.equal(commentNested)
  })

  return it('should return object with dependency defined by list with one more records', async () => {
    const api = helper.cms.api()
    let results = await api('articles', 'comments').list()
    const numberOfRecords = results.length
    await request(helper.MASTER_URL)
      .post('/api/articles')
      .auth('localAdmin', 'localAdmin')
      .send({ content: 'test' })
      .expect(200)
    results = await api('articles', 'comments').list()
    results.length.should.equal(numberOfRecords + 1)
  })
}
