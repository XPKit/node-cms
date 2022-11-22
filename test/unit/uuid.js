/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const assert = require('assert')
const UUID = require('../../lib/util/uuid')

describe('UUID', () => {
  it('#uuid', () => {
    assert((typeof UUID === 'function'))
    assert((UUID.length === 1))
    assert((typeof UUID() === 'function'))
    assert((UUID().length === 0))
  })

  it('should throw if machine id is malformed', () => {
    const uuid = UUID()
    assert.throws(uuid, null, 'Machine id should be an 8 digit string')
  })

  it('should generate a 24 digit UUID', () => assert(UUID('12345678')().length === 24))

  it('should generate unique UUIDs', () => {
    let nonunique
    const registry = {}
    const uuid = UUID('12345678')
    for (let index = 1; index <= 10000; index++) {
      const id = uuid()
      if (!registry[id]) {
        registry[id] = id
      } else {
        nonunique = true
        break
      }
    }
    assert(!nonunique)
  })
})
