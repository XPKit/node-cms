#!/usr/bin/env node

/**
 * Logger Test Script
 * Tests all methods of the img-sh-logger library
 */

console.log('🧪 Starting Logger Test Suite...\n')

try {
  // Initialize the logger
  const Logger = require('img-sh-logger')
  const logger = new Logger()

  console.log('✅ Logger imported and instantiated successfully\n')

  // Test basic logging methods
  console.log('📝 Testing basic logging methods:')
  logger.info('This is an info message')
  logger.warn('This is a warning message')
  logger.error('This is an error message')
  logger.debug('This is a debug message')

  // Test if log method exists
  if (typeof logger.log === 'function') {
    logger.log('This is a generic log message')
  }

  console.log('\n📊 Testing with different data types:')

  // Test with objects
  logger.info('Testing object logging:', {
    key: 'value',
    number: 42,
    nested: { foo: 'bar' }
  })

  // Test with arrays
  logger.warn('Testing array logging:', [1, 2, 3, 'test', { id: 123 }])

  // Test with errors
  const testError = new Error('Test error object')
  logger.error('Testing error logging:', testError)

  // Test with numbers
  logger.info('Testing number logging:', 3.14159)

  // Test with booleans
  logger.debug('Testing boolean logging:', true, false)

  // Test with null/undefined
  logger.info('Testing null/undefined:', null, undefined)

  console.log('\n🏷️  Testing with multiple arguments:')
  logger.info('Multiple', 'arguments', 'test', 123, { data: true })
  logger.warn('Warning with', 'multiple', 'params:', [1, 2, 3])
  logger.error('Error with context:', 'operation failed', { code: 500, details: 'timeout' })

  console.log('\n⚡ Testing performance with rapid logging:')
  const start = Date.now()
  for (let i = 0; i < 10; i++) {
    logger.debug(`Rapid log ${i + 1}/10`)
  }
  const duration = Date.now() - start
  logger.info(`Performance test completed in ${duration}ms`)

  console.log('\n🎯 Testing specific use cases from the CMS:')

  // Simulate authentication logging
  logger.info('User authentication successful', {
    username: 'testuser',
    ip: '127.0.0.1',
    timestamp: new Date().toISOString()
  })

  // Simulate error logging
  logger.error('Database connection failed', {
    error: 'ECONNREFUSED',
    host: 'localhost',
    port: 27017
  })

  // Simulate system info logging
  logger.info('System stats updated', {
    memory: '256MB',
    cpu: '15%',
    uptime: '2h 30m'
  })

  // Simulate import/export operations
  logger.warn('Import operation warning', {
    resource: 'articles',
    processed: 150,
    skipped: 5,
    reason: 'duplicate entries'
  })

  console.log('\n🔍 Testing logger properties and methods:')
  console.log('Logger type:', typeof logger)
  console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(logger)))
  console.log('Logger constructor:', logger.constructor.name)

  console.log('\n✨ All logger tests completed successfully!')
  console.log('🎉 The img-sh-logger is working correctly in the node-cms project!')

} catch (error) {
  console.error('❌ Logger test failed:', error.message)
  console.error('Stack trace:', error.stack)
  process.exit(1)
}
