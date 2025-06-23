/* // eslint-disable no-unused-expressions */

const CMS = require('../')
const request = require('supertest')
const Q = require('q')
const path = require('path')
const Helper = require('./helper')

const helper = Helper.getInstance(8002, true)
let cms = null
const DB = path.join(__dirname, 'data')
const CONFIG = path.join(__dirname, 'cms.json')

before(() => helper.removeFiles(
  DB,
  CONFIG,
  `${__dirname}/_large_copy.png`,
  `${__dirname}/_large_copy2.png`
))

// eslint-disable-next-line no-undef
after(() => helper.removeFiles(
  DB,
  CONFIG,
  `${__dirname}/resources`,
  `${__dirname}/_large_copy.png`,
  `${__dirname}/_large_copy2.png`
))

before(async () => {
  let options = {
    data: DB,
    config: CONFIG,
    mid: 'jegvlp6w',
    autoload: true,
    apiVersion: 2,
    disableJwtLogin: false,
    disableAuthentication: true,
    auth: { secret: 'auth.jwt.secret' },
    dbEngine: {
      type: 'mongodb',
      url: '127.0.0.1/node-cms'
    }
  }

  cms = new CMS(options)

  cms.resource('articles',
    // acl:
    //   'hello': '1111' # give 'hello' user full access to 'articles' resource
    //   '*': '0100'     # give anonymous users only read access to 'articles' resource
    {filterUnpublished: true})

  cms.resource('pages', {
    // acl:
    //   '*': '1111'   # full access to everyone, for test purposes
    schema: [
      { field: 'title', input: 'string', required: true },
      { field: 'content', input: 'string', required: true },
      { field: 'category', input: 'string', required: true, localised: false },
      { field: 'author.name', input: 'string', required: true, localised: false }
    ],
    locales: [ // enable localisation support
      'enUS',
      'ruRU',
      'zhCN'
    ]
  })
  cms.resource('querytest')
  await Q.ninvoke(cms.express(), 'listen', helper.port)
  await cms.bootstrap()
})

before(() => Q.ninvoke(cms, 'allow', 'anonymous', ['pages', 'querytest']))

before(async () => {
  helper.cms = cms
})

describe('HTTP', async () => {
  helper.importTests('Resource', './unit/tests/resource')
  helper.importTests('Pagination', './unit/tests/pagination')
  helper.importTests('Attachment', './unit/tests/attachments')
  helper.importTests('Access Control List', './unit/tests/accessControlList')
  helper.importTests('Localisation', './unit/tests/localisation')
  describe('Query Language', () => {
    before(async () => {
      await helper.deleteAllRecords('querytest')
      await request(helper.MASTER_URL)
        .post('/api/querytest')
        .send({
          name: 'John',
          age: 36,
          hobbies: ['sports', 'music'],
          vitals: {
            weight: '100kg',
            height: '6ft',
            fingers: 10
          }
        })
        .expect(200)
    })

    it('should support $eq for equality', async () => {
      await helper.runQuery({name: {$eq: 'Bill'}}, 0)
      await helper.runQuery({name: {$eq: 'John'}}, 1)
    })

    it('should support $ne for inequality', async () => {
      await helper.runQuery({name: {$ne: 'Bill'}}, 1)
      await helper.runQuery({name: {$ne: 'John'}}, 0)
    })

    it('should support $lt for less than', async () => {
      await helper.runQuery({age: {$lt: 36}}, 0)
      await helper.runQuery({age: {$lt: 37}}, 1)
    })

    it('should support $lte for less than or equal', async () => {
      await helper.runQuery({age: {$lte: 36}}, 1)
      await helper.runQuery({age: {$lte: 35}}, 0)
    })

    it('should support $gt for greater than', async () => {
      await helper.runQuery({age: {$gt: 36}}, 0)
      await helper.runQuery({age: {$gt: 35}}, 1)
    })

    it('should support $gte for greater than or equal', async () => {
      await helper.runQuery({age: {$gte: 36}}, 1)
      await helper.runQuery({age: {$gte: 37}}, 0)
    })

    it('should support $all for match all rules in array', async () => {
      await helper.runQuery({hobbies: {$all: ['sports', 'drugs']}}, 0)
      await helper.runQuery({hobbies: {$all: ['sports', 'music']}}, 1)
    })

    it('should support $or for match any rules in array', async () => {
      await helper.runQuery({$or: [{hobbies: 'sports'}, {hobies: 'drugs'}]}, 1)
      await helper.runQuery({$or: [{hobbies: 'sports'}, {hobies: 'music'}]}, 1)
      await helper.runQuery({$or: [{hobbies: 'drugs'}, {hobies: 'alcohol'}]}, 0)
    })

    it('should support $and for match all rules in object', async () => {
      await helper.runQuery({$and: [{'vitals.weight': '100kg'}, {'vitals.height': '5ft'}]}, 0)
      await helper.runQuery({$and: [{'vitals.weight': '100kg'}, {'vitals.height': '6ft'}]}, 1)
    })

    it('should support $or for match any rules in object', async () => {
      await helper.runQuery({$or: [{'vitals.weight': '100kg'}, {'vitals.height': '5ft'}]}, 1)
      await helper.runQuery({$or: [{'vitals.weight': '100kg'}, {'vitals.height': '6ft'}]}, 1)
      await helper.runQuery({$or: [{'vitals.weight': '90kg'}, {'vitals.height': '7ft'}]}, 0)
    })

    it('should support query composition', async () => {
      await helper.runQuery(({ name: { $eq: 'John' }, age: { $eq: 35 } }), 0)
      await helper.runQuery(({ name: { $eq: 'Bill' }, age: { $eq: 36 } }), 0)
      await helper.runQuery(({ name: { $eq: 'Bill' }, age: { $eq: 35 } }), 0)
      await helper.runQuery(({ name: { $eq: 'John' }, age: { $eq: 36 } }), 1)
    })

    it('should support shorthand notation', async () => {
      await helper.runQuery({name: 'John', age: 35}, 0)
      await helper.runQuery({name: 'Bill', age: 36}, 0)
      await helper.runQuery({name: 'Bill', age: 35}, 0)
      await helper.runQuery({name: 'John', age: 36}, 1)
    })

    it('should support (dot)notation, namespacing', async () => {
      await helper.runQuery({'vitals.weight': '100kg'}, 1)
      await helper.runQuery({'vitals.weight': '100kg', 'vitals.fingers': {$lt: 10}}, 0)
      await helper.runQuery({'vitals.weight': '100kg', 'vitals.fingers': {$gte: 4}}, 1)
    })
  })
  helper.importTests('JS', './unit/tests/js')
  helper.importTests('ResolveDependency', './unit/tests/resolveDependency')
})
