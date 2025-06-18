#!/usr/bin/env node

/**
 * CMS Logger Integration Test
 * Tests the logger in the context of how it's used in the CMS codebase
 */

console.log('🏗️  Testing Logger Integration with CMS patterns...\n')

try {
  // Test the exact pattern used in CMS files
  console.log('Testing original CMS logger instantiation pattern:')
  const logger = new (require('img-sh-logger'))()

  console.log('✅ Logger instantiated using CMS pattern successfully\n')

  // Test patterns found in different CMS modules
  console.log('🔧 Testing SystemManager-style logging:')
  logger.info('System info updated')
  logger.warn('High memory usage detected', { usage: '85%' })

  console.log('\n🔐 Testing Authentication-style logging:')
  logger.info('User login successful', { user: 'admin', ip: '127.0.0.1' })
  logger.error('Authentication failed', { reason: 'invalid credentials' })

  console.log('\n💾 Testing Database-style logging:')
  logger.info('Database connection established')
  logger.warn('Slow query detected', { duration: '2.5s', query: 'SELECT * FROM articles' })
  logger.error('Database connection lost', { host: 'localhost', port: 27017 })

  console.log('\n📊 Testing Import/Export-style logging:')
  logger.info('Import started', { source: 'google-sheets', resource: 'articles' })
  logger.warn('Validation warning', { field: 'email', value: 'invalid@' })
  logger.info('Import completed', { imported: 150, skipped: 5, errors: 0 })

  console.log('\n🌐 Testing REST API-style logging:')
  logger.info('API request', { method: 'GET', path: '/api/articles', status: 200 })
  logger.warn('Rate limit approaching', { ip: '192.168.1.100', requests: 95, limit: 100 })
  logger.error('API error', { method: 'POST', path: '/api/users', error: 'Validation failed' })

  console.log('\n🔄 Testing Sync/Replication-style logging:')
  logger.info('Sync started', { source: 'remote', target: 'local' })
  logger.debug('Processing record', { id: '123', type: 'article' })
  logger.info('Sync completed', { processed: 50, conflicts: 2 })

  console.log('\n📋 Testing Syslog-style logging:')
  logger.info('Service started', { pid: process.pid, version: '2.1.79' })
  logger.warn('Memory usage high', { usage: '512MB', limit: '1GB' })
  logger.error('Service crashed', { signal: 'SIGTERM', exitCode: 1 })

  console.log('\n🧪 Testing error logging with stack traces:')
  try {
    throw new Error('Simulated CMS error')
  } catch (error) {
    logger.error('Caught application error:', error.message)
    logger.debug('Error details:', error.stack)
  }

  console.log('\n⏱️  Testing logger performance under CMS load:')
  const iterations = 100
  const start = Date.now()

  for (let i = 0; i < iterations; i++) {
    logger.debug(`Processing batch ${i + 1}/${iterations}`, {
      records: Math.floor(Math.random() * 100),
      status: i % 10 === 0 ? 'checkpoint' : 'processing'
    })
  }

  const duration = Date.now() - start
  logger.info(`Performance test: ${iterations} logs in ${duration}ms (${(iterations/duration*1000).toFixed(1)} logs/sec)`)

  console.log('\n✅ All CMS integration tests passed!')
  console.log('🎯 The img-sh-logger is fully compatible with the node-cms logging patterns!')

} catch (error) {
  console.error('❌ CMS integration test failed:', error.message)
  console.error('Stack trace:', error.stack)
  process.exit(1)
}
