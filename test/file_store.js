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

// eslint-disable-next-line no-undef
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
