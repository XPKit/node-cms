/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS201: Simplify complex destructure assignments
 * DS202: Simplify dynamic range loops
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const chai = require('chai')
chai.should()
const assert = require('assert')
const FileStore = require('../lib/file_store')
const fs = require('fs-extra')
const _ = require('lodash')

const remove = (...files) => {
  _.each(files, file => {
    fs.removeSync(file)
  })
}

let dbPathIndex = 0
const getDbPath = () => `${__dirname}/fstest${dbPathIndex++}`

after(function () {
  const out = []
  for (let index = 0, end = dbPathIndex, asc = end >= 0; asc ? index <= end : index >= end; asc ? index++ : index--) {
    out.push(`${__dirname}/fstest${index}`)
  }
  return remove(...out)
})

it('#constructor', function () {
  assert(new FileStore(getDbPath(), 'abc123', {}) instanceof FileStore)
  assert(FileStore(getDbPath(), 'abc123', {}) instanceof FileStore)
  assert(FileStore.length === 3)
})

// it '#sync', ->
//   assert typeof FileStore(getDbPath(), 'abc123', {}).sync == 'function'

// TODO: continue with API, check sync at this point
