import { describe, expect, it } from 'vitest'
import validators from '@u/validators'

// The form validators are the purest logic in src/: plain in, plain out, no Vue and no server.
// Note the return shapes are not uniform — some return null on success, some [], some undefined —
// so each case asserts the shape it actually has rather than a convention it does not follow.
describe('validators', () => {
  const field = (extra = {}) => ({ ...extra })

  describe('required', () => {
    it('passes a value through as null rather than an empty list', () => {
      expect(validators.required('a value', field({ required: true }), {})).to.equal(null)
    })

    it('reports a missing value only when the field asks for one', () => {
      expect(validators.required(undefined, field({ required: true }), {})).to.deep.equal(['This field is required!'])
      expect(validators.required('', field({ required: true }), {})).to.deep.equal(['This field is required!'])
      expect(validators.required(undefined, field(), {})).to.deep.equal([])
    })

    it('treats 0 and false as present', () => {
      expect(validators.required(0, field({ required: true }), {})).to.equal(null)
      expect(validators.required(false, field({ required: true }), {})).to.equal(null)
    })
  })

  describe('number', () => {
    it('accepts a number inside the bounds', () => {
      expect(validators.number(5, field({ min: 1, max: 10 }), {})).to.deep.equal([])
    })

    it('names the bound it broke', () => {
      expect(validators.number(0, field({ min: 1 }), {})).to.deep.equal(['The number is too small! Minimum: 1'])
      expect(validators.number(11, field({ max: 10 }), {})).to.deep.equal(['The number is too big! Maximum: 10'])
    })

    // #106: an <input> hands its value over as a string, so the check is on what the value is
    // numerically rather than on its type. It used to call every number a user typed invalid.
    it('accepts a numeric string, which is what an input hands over', () => {
      expect(validators.number('5', field(), {})).to.deep.equal([])
      expect(validators.number('5', field({ max: 4 }), {})).to.deep.equal(['The number is too big! Maximum: 4'])
    })

    it('still rejects something that is not a number in any form', () => {
      expect(validators.number('abc', field(), {})).to.deep.equal(['Invalid number'])
      expect(validators.number('5 apples', field(), {})).to.deep.equal(['Invalid number'])
    })

    it('rejects NaN and Infinity', () => {
      expect(validators.number(NaN, field(), {})).to.deep.equal(['Invalid number'])
      expect(validators.number(Infinity, field(), {})).to.deep.equal(['Invalid number'])
    })
  })

  describe('integer', () => {
    it('accepts a whole number', () => {
      expect(validators.integer(3, field(), {})).to.deep.equal([])
    })

    it('adds its own complaint on top of the number ones', () => {
      expect(validators.integer(1.5, field(), {})).to.deep.equal(['The value is not an integer'])
      expect(validators.integer(0.5, field({ min: 1 }), {})).to.deep.equal([
        'The number is too small! Minimum: 1',
        'The value is not an integer'
      ])
    })
  })

  describe('double', () => {
    it('returns undefined rather than an empty list when it passes', () => {
      expect(validators.double(1.5, field(), {})).to.equal(undefined)
    })

    it('takes a numeric string, as the number validator does', () => {
      expect(validators.double('1.5', field(), {})).to.equal(undefined)
    })

    it('rejects a non-number', () => {
      expect(validators.double('one and a half', field(), {})).to.deep.equal(['Invalid number'])
      expect(validators.double(NaN, field(), {})).to.deep.equal(['Invalid number'])
    })
  })

  describe('string', () => {
    it('counts characters against min and max', () => {
      expect(validators.string('abc', field({ min: 2, max: 5 }), {})).to.deep.equal([])
      expect(validators.string('abc', field({ min: 5 }), {})).to.deep.equal([
        'The length of text is too small! Current: 3, Minimum: 5'
      ])
      expect(validators.string('abcdef', field({ max: 5 }), {})).to.deep.equal([
        'The length of text is too big! Current: 6, Maximum: 5'
      ])
    })

    it('rejects a non-string', () => {
      expect(validators.string(5, field(), {})).to.deep.equal(['This is not a text!'])
    })
  })

  describe('array', () => {
    it('accepts a populated array', () => {
      expect(validators.array(['a'], field({ required: true }), {})).to.equal(undefined)
    })

    it('separates "not an array" from "empty array"', () => {
      expect(validators.array('a', field({ required: true }), {})).to.deep.equal(['This is not an array!'])
      expect(validators.array([], field({ required: true }), {})).to.deep.equal(['This field is required!'])
    })

    it('counts items against min and max', () => {
      expect(validators.array([1], field({ min: 2 }), {})).to.deep.equal(['Select minimum 2 items!'])
      expect(validators.array([1, 2, 3], field({ max: 2 }), {})).to.deep.equal(['Select maximum 2 items!'])
    })

    it('ignores bounds when the value is absent and not required', () => {
      expect(validators.array(undefined, field({ min: 2 }), {})).to.equal(undefined)
    })
  })

  describe('date', () => {
    it('accepts a parseable date', () => {
      expect(validators.date('2020-01-01', field(), {})).to.deep.equal([])
    })

    it('rejects an unparseable one', () => {
      expect(validators.date('not a date', field(), {})).to.deep.equal(['Invalid date!'])
    })

    it('reports a missing value before trying to parse it', () => {
      expect(validators.date('', field({ required: true }), {})).to.deep.equal(['This field is required!'])
    })

    // The two bound messages are the only ones that format a date, and they were unreachable until
    // #98: the path called `Dayjs.format(m)`, and `format` lives on a dayjs instance rather than on
    // the factory, so it threw a TypeError instead of reporting. The timestamps below are UTC
    // because vitest pins TZ; `new Date('2020-01-01')` is UTC midnight, so under a negative offset
    // the same input would format as the previous day.
    it('reports a date that falls before its minimum', () => {
      expect(validators.date('2020-01-01', field({ min: '2021-01-01' }), {})).to.deep.equal([
        'The date is too early! Current: 2020-01-01T00:00:00+00:00, Minimum: 2021-01-01T00:00:00+00:00'
      ])
    })

    it('reports a date that falls after its maximum', () => {
      expect(validators.date('2022-01-01', field({ max: '2021-01-01' }), {})).to.deep.equal([
        'The date is too late! Current: 2022-01-01T00:00:00+00:00, Maximum: 2021-01-01T00:00:00+00:00'
      ])
    })

    it('stays quiet when the date is inside its bounds, which is the path that works', () => {
      expect(validators.date('2021-06-01', field({ min: '2021-01-01', max: '2021-12-31' }), {})).to.deep.equal([])
    })
  })

  describe('pattern and format validators', () => {
    it('regexp tests against the field pattern', () => {
      expect(validators.regexp('abc', field({ pattern: '^a' }), {})).to.equal(undefined)
      expect(validators.regexp('xbc', field({ pattern: '^a' }), {})).to.deep.equal(['Invalid format!'])
    })

    it('regexp accepts anything when no pattern is set', () => {
      expect(validators.regexp('anything', field(), {})).to.equal(undefined)
    })

    it('email', () => {
      expect(validators.email('someone@example.com', field(), {})).to.equal(undefined)
      expect(validators.email('someone@example', field(), {})).to.deep.equal(['Invalid e-mail address!'])
    })

    it('url', () => {
      expect(validators.url('https://example.com/a?b=c', field(), {})).to.equal(undefined)
      expect(validators.url('example', field(), {})).to.deep.equal(['Invalid URL!'])
    })

    it('alpha and alphaNumeric', () => {
      expect(validators.alpha('abc', field(), {})).to.equal(undefined)
      expect(validators.alpha('ab1', field(), {})).to.deep.equal(['Invalid text! Cannot contains numbers or special characters'])
      expect(validators.alphaNumeric('ab1', field(), {})).to.equal(undefined)
      expect(validators.alphaNumeric('ab-1', field(), {})).to.deep.equal(['Invalid text! Cannot contains special characters'])
    })
  })

  describe('creditCard', () => {
    it('accepts a well-formed number that also passes Luhn', () => {
      expect(validators.creditCard('4111111111111111', field(), {})).to.equal(undefined)
    })

    it('ignores separators while checking', () => {
      expect(validators.creditCard('4111-1111 1111-1111', field(), {})).to.equal(undefined)
    })

    it('separates a bad shape from a bad checksum', () => {
      expect(validators.creditCard('1234', field(), {})).to.deep.equal(['Invalid card format!'])
      expect(validators.creditCard('4111111111111112', field(), {})).to.deep.equal(['Invalid card number!'])
    })
  })

  // Every validator gets a .locale() wrapper attached at module load, which is the hook the admin
  // would use to translate these messages.
  describe('locale overrides', () => {
    it('swaps in the supplied message and keeps the rest', () => {
      const translated = validators.required.locale({ fieldIsRequired: 'Pflichtfeld!' })
      expect(translated(undefined, field({ required: true }), {})).to.deep.equal(['Pflichtfeld!'])
    })

    it('falls back to the default text for anything not overridden', () => {
      const translated = validators.number.locale({ fieldIsRequired: 'Pflichtfeld!' })
      expect(translated('abc', field(), {})).to.deep.equal(['Invalid number'])
    })

    it('is attached to every validator function', () => {
      const names = Object.keys(validators).filter(key => typeof validators[key] === 'function')
      expect(names.length).to.be.greaterThan(10)
      names.forEach(name => expect(validators[name].locale, name).to.be.a('function'))
    })
  })
})
