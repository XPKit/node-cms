const chai = require('chai')
const should = chai.should()
const Helper = require('../../helper')
const helper = Helper.getInstance()

exports.suite = () => {
  let api = false
  before(() => {
    api = helper.cms.api()
  })
  it('should respond with an instance', () => {
    return api.should.be.a('function')
  })

  it('should respond with a resource API', () => {
    const articles = api('articles')
    should.exist(articles.list)
    should.exist(articles.read)
    should.exist(articles.find)
    should.exist(articles.create)
    should.exist(articles.update)
    should.exist(articles.exists)
    should.exist(articles.remove)
    should.exist(articles.findAttachment)
    should.exist(articles.createAttachment)
    should.exist(articles.removeAttachment)
  })

  describe('Hooks', () => {
    it('should defined for resource', () => {
      const articles = api('articles')
      articles.use.should.be.a('function')
      articles.before.should.be.a('function')
      articles.beforeAll.should.be.a('function')
      articles.after.should.be.a('function')
      articles.afterAll.should.be.a('function')
    })
  })
}
