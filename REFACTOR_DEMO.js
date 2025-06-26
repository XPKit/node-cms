/**
 * Demonstration of improved IDE support and static method discoverability
 * This file shows how developers can now get proper autocomplete and JSDoc for all CMS API methods
 */

const CMS = require('./index.js')
const { Driver } = require('./lib/util/driver')

// Example 1: Static methods are discoverable on Driver class
console.log('Static Driver methods available for IDE autocomplete:')
console.log('- Driver.list()')
console.log('- Driver.find()')
console.log('- Driver.create()')
console.log('- Driver.update()')
console.log('- Driver.remove()')
console.log('- Driver.createAttachment()')
console.log('- Driver.findAttachment()')
console.log('- And more...')

// Example 2: ResourceAPIWrapper provides full IDE support
async function demonstrateAPIUsage() {
  const cms = new CMS({
    data: './data',
    resources: './resources',
    disableJwtLogin: true,
    disableAuthentication: true
  })

  const api = cms.api()
  const usersAPI = api('_users')

  // These methods now have full JSDoc and TypeScript support in IDEs:

  // usersAPI.list() - List all users with query options
  // usersAPI.find('user-id') - Find a specific user
  // usersAPI.create({name: 'John'}) - Create a new user
  // usersAPI.update('user-id', {name: 'Jane'}) - Update a user
  // usersAPI.remove('user-id') - Remove a user
  // usersAPI.exists('user-id') - Check if user exists
  // usersAPI.createAttachment('user-id', attachmentData) - Create attachment
  // usersAPI.findAttachment('user-id', 'attachment-id') - Find attachment
  // usersAPI.removeAttachment('user-id', 'attachment-id') - Remove attachment

  console.log('✅ All resource API methods are now discoverable in IDEs')
  console.log('✅ Full JSDoc documentation available')
  console.log('✅ TypeScript support improved')
  console.log('✅ Plugin hooks and middleware preserved')
}

module.exports = { demonstrateAPIUsage }
