/* // eslint-disable no-unused-expressions */

const CMS = require('../')
const Q = require('q')
const path = require('path')
const Helper = require('./helper')

const helper = Helper.getInstance(8003, true)
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
  cms = new CMS({data: DB,
    config: CONFIG,
    autoload: true,
    apiVersion: 2,
    disableJwtLogin: false,
    disableAuthentication: true,
    auth: { secret: 'auth.jwt.secretauth.jwt.secret' }
  })

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
  helper.importTests('Query language', './unit/tests/queryLanguage')
  helper.importTests('JS', './unit/tests/js')
  helper.importTests('ResolveDependency', './unit/tests/resolveDependency')
})
