const JsonDOWN = require('../lib/db/leveldown/jsondown')
const db = new JsonDOWN('./testdb.json', { valueEncoding: 'json' })
db.hooks.prewrite.add((op, batch) => {
  console.log('prewrite hook called:', op, batch)
})
console.log('Successfully registered prewrite hook.')
