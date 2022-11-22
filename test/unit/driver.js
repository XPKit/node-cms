/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Q = require('q')
const assert = require('assert')
const Driver = require('../../lib/util/driver')
const chai = require('chai')

chai.should()

describe('Driver', () => {
  it('#constructor', () => {
    const name = 'sample'
    const options = {test: true}
    const driver = new Driver(name, options)
    assert.equal(driver.name, name)
    assert.deepEqual(driver.options, options)
  })

  it('#define', () => {
    const driver = new Driver('math')
    assert.equal(typeof driver.define, 'function')
    driver.define('summ', ['a', 'b'], context => context.result(context.params.a + context.params.b))
    assert.equal(typeof driver._methods['summ'], 'object')
    assert.equal(typeof driver._methods['summ'].invoke, 'function')
    assert.deepEqual(driver._methods['summ'].params, ['a', 'b'])
    try {
      driver.define()
    } catch (error) {
      assert.equal(error.message, 'method name is not defined')
    }
  })

  it('#build', () => {
    const driver = new Driver('math')
    driver.define('summ', ['a', 'b'], context => context.result(context.params.a + context.params.b))
    const math = driver.build()
    assert(typeof math.summ === 'function')
  })

  it('#invoke', async () => {
    const driver = new Driver('math')
    driver.define('summ', ['a', 'b'], context => context.result(context.params.a + context.params.b))
    const math = driver.build()
    let result = await Q.ninvoke(math, 'summ', 2, 2)
    assert.equal(result, 4)
  })

  it('#invoke with incorrect params', async () => {
    const driver = new Driver('math')
    driver.define('summ', ['a', 'b'], context => context.result(context.params.a + context.params.b))
    const math = driver.build()
    try {
      await Q.ninvoke(math, 'summ', 2)
      throw new Error('should return error')
    } catch (error) {
      error.should.equal('Parameter [b] is missing')
    }
  })

  it('#invoke with optional params', async () => {
    const driver = new Driver('math')
    driver.define('power', ['x', 'power?'], context => context.result(Math.pow(context.params.x, context.params.power || 2)))
    const math = driver.build()
    let result = await Q.ninvoke(math, 'power', 2, 3)
    assert.equal(result, 8)
    result = await Q.ninvoke(math, 'power', 2)
    assert.equal(result, 4)
  })

  it('#use', async () => {
    let trigger = false
    const driver = new Driver('math')
    driver.use(context => {
      trigger = true
      context.next()
    })
    driver.define('sqrt', ['num'], context => context.result(Math.sqrt(context.params.num)))
    const math = driver.build()
    let result = await Q.ninvoke(math, 'sqrt', 4)
    assert(trigger)
    assert.equal(result, 2)
  })

  it('#beforeAll', async () => {
    let trigger = false
    const driver = new Driver('math')
    driver.beforeAll(context => {
      context.params.a = 3
      trigger = true
      context.next()
    })
    driver.define('summInc', ['a', 'b'], context => context.result(context.params.a + context.params.b))
    const math = driver.build()
    let result = await Q.ninvoke(math, 'summInc', 2, 7)
    assert(trigger)
    assert.equal(result, 10)
  })

  it('#before', async () => {
    let trigger = false
    const driver = new Driver('math')
    driver.before('summInc', context => {
      context.params.a = 3
      trigger = true
      context.next()
    })
    driver.define('summ', ['a', 'b'], context => context.result(context.params.a + context.params.b))
    driver.define('summInc', ['a', 'b'], context => context.result(context.params.a + context.params.b))
    const math = driver.build()
    let result = await Q.ninvoke(math, 'summ', 2, 7)
    assert(!trigger)
    assert.equal(result, 9)
    result = await Q.ninvoke(math, 'summInc', 2, 7)
    assert(trigger)
    assert.equal(result, 10)
  })

  it('#after', async () => {
    let trigger = false
    const driver = new Driver('math')
    driver.after('summInc', context => {
      trigger = true
      context.result(context.getResult() + 1)
    })
    driver.define('summInc', ['a', 'b'], context => context.result(context.params.a + context.params.b))
    const math = driver.build()
    let result = await Q.ninvoke(math, 'summInc', 2, 7)
    assert(trigger)
    assert.equal(result, 10)
  })

  it('#afterAll', async () => {
    let trigger = 0
    const driver = new Driver('greet')
    driver.afterAll(context => {
      trigger++
      context.result(context.getResult() + '!')
    })
    driver.define('hi', context => context.result('hi'))
    driver.define('hello', context => context.result('hello'))
    const greet = driver.build()
    let result = await Q.ninvoke(greet, 'hi')
    assert.equal(result, 'hi!')
    assert.equal(trigger, 1)
    result = await Q.ninvoke(greet, 'hello')
    assert.equal(result, 'hello!')
    assert.equal(trigger, 2)
  })

  it('instance#hooks', async () => {
    let trigger = false
    const driver = new Driver('resource')
    driver.define('find', ['id'], context => context.result({id: '123'}))
    const resource = driver.build()
    resource.before('find', context => {
      trigger = true
      context.next()
    })
    let result = await Q.ninvoke(resource, 'find', '123')
    assert(result.id === '123')
    assert(trigger)
  })

  it('should execute middleware and hooks in order', async () => {
    const stack = [
      'middleware1',
      'middleware2',
      'beforeAll1',
      'beforeAll2',
      'instanceBeforeAll1',
      'instanceBeforeAll2',
      'instanceBefore1',
      'instanceBefore2',
      'before1',
      'before2',
      'invoke',
      'after2',
      'after1',
      'instanceAfter2',
      'instanceAfter1',
      'instanceAfterAll2',
      'instanceAfterAll1',
      'afterAll2',
      'afterAll1'
    ]

    const out = []

    const driver = new Driver('stack')

    driver.beforeAll(context => {
      out.push('beforeAll1')
      context.next()
    })

    driver.beforeAll(context => {
      out.push('beforeAll2')
      context.next()
    })

    driver.before('sayHi', context => {
      out.push('before1')
      context.next()
    })

    driver.before('sayHi', context => {
      out.push('before2')
      context.next()
    })

    driver.define('sayHi', context => {
      out.push('invoke')
      context.next()
    })

    driver.use(context => {
      out.push('middleware1')
      context.next()
    })

    driver.use(context => {
      out.push('middleware2')
      context.next()
    })

    driver.after('sayHi', context => {
      out.push('after1')
      context.next()
    })

    driver.after('sayHi', context => {
      out.push('after2')
      context.next()
    })

    driver.afterAll(context => {
      out.push('afterAll1')
      context.next()
    })

    driver.afterAll(context => {
      out.push('afterAll2')
      context.next()
    })

    const api = driver.build()

    api.beforeAll(context => {
      out.push('instanceBeforeAll1')
      context.next()
    })

    api.beforeAll(context => {
      out.push('instanceBeforeAll2')
      context.next()
    })

    api.before('sayHi', context => {
      out.push('instanceBefore1')
      context.next()
    })

    api.before('sayHi', context => {
      out.push('instanceBefore2')
      context.next()
    })

    api.after('sayHi', context => {
      out.push('instanceAfter1')
      context.next()
    })

    api.after('sayHi', context => {
      out.push('instanceAfter2')
      context.next()
    })

    api.afterAll(context => {
      out.push('instanceAfterAll1')
      context.next()
    })

    api.afterAll(context => {
      out.push('instanceAfterAll2')
      context.next()
    })

    await Q.ninvoke(api, 'sayHi')
    assert.deepEqual(stack, out)
  })
})
