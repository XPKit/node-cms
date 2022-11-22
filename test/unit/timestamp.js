/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const assert = require('assert')
const timestamp = require('../../lib/util/timestamp')

describe('Timestamp', () => {
  it('#timestamp', () => {
    assert((typeof timestamp === 'function'))
    assert((typeof timestamp() === 'string'))
  })

  it('should generate unique timestamps for sub-millisecond calls', () => {
    let duplicates, submillisecond
    const registry = {}
    const seconds = {}
    for (let index = 1; index <= 10000; index++) {
      const ts = timestamp()
      const sec = ts.split('.')[0]
      if (!seconds[sec]) {
        seconds[sec] = ts
      } else {
        submillisecond = true
      }
      if (!registry[ts]) {
        registry[ts] = ts
      } else {
        duplicates = true
      }
    }
    assert(!duplicates)
    assert(submillisecond)
  })

  it('should generate sequential timestamps', () => {
    let index
    const origin = []
    for (index = 1; index <= 10000; index++) {
      origin.push(timestamp())
    }
    const copy = origin.slice(0).sort() // clone origin
    let equality = true
    for (index = 1; index <= 10000; index++) {
      if (origin[index] !== copy[index]) {
        console.log(origin[index], copy[index])
        equality = false
        break
      }
    }
    assert(equality)
  })
})
