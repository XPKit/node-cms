const request = require('supertest')
const Helper = require('../helper')
const helper = Helper.getInstance()

exports.suite = () => {
  before(async () => {
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
    await helper.runQuery({hobbies: {$or: ['sports', 'drugs']}}, 1)
    await helper.runQuery({hobbies: {$or: ['sports', 'music']}}, 1)
    await helper.runQuery({hobbies: {$or: ['drungs', 'alcohol']}}, 0)
  })

  it('should support $and for match all rules in object', async () => {
    await helper.runQuery({vitals: {$and: [{weight: '100kg'}, {height: '5ft'}]}}, 0)
    await helper.runQuery({vitals: {$and: [{weight: '100kg'}, {height: '6ft'}]}}, 1)
  })

  it('should support $or for match any rules in object', async () => {
    await helper.runQuery({vitals: {$or: [{weight: '100kg'}, {height: '5ft'}]}}, 1)
    await helper.runQuery({vitals: {$or: [{weight: '100kg'}, {height: '6ft'}]}}, 1)
    await helper.runQuery({vitals: {$or: [{weight: '90kg'}, {height: '7ft'}]}}, 0)
  })

  it('should support other $or for match any rules in array', async () => {
    await helper.runQuery({$or: [{hobbies: 'sports'}, {hobies: 'drugs'}]}, 1)
    await helper.runQuery({$or: [{hobbies: 'sports'}, {hobies: 'music'}]}, 1)
    await helper.runQuery({$or: [{hobbies: 'drugs'}, {hobies: 'alcohol'}]}, 0)
  })

  it('should support other $and for match all rules in object', async () => {
    await helper.runQuery({$and: [{'vitals.weight': '100kg'}, {'vitals.height': '5ft'}]}, 0)
    await helper.runQuery({$and: [{'vitals.weight': '100kg'}, {'vitals.height': '6ft'}]}, 1)
  })

  it('should support other $or for match any rules in object', async () => {
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
}
