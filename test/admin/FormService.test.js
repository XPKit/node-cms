import { describe, expect, it, vi } from 'vitest'

// The validator functions are module-private; the admin only ever reaches them through
// `typeMapper[input].validator`, which is how AbstractField wires a field up, so the tests go the
// same way. TranslateService is mocked to return its key, so an assertion names the message id.
vi.mock('@s/TranslateService', () => ({ default: { get: key => key } }))

const { default: FormService } = await import('@s/FormService')

const validatorFor = (input) => FormService.typeMapper[input].validator
const field = (extra = {}) => ({ ...extra })

describe('FormService', () => {
  describe('getKeyLocale', () => {
    it('splits the locale off a localised model and leaves the key behind', () => {
      expect(FormService.getKeyLocale({ model: 'body.enUS', localised: true })).to.deep.equal({ key: 'body', locale: 'enUS' })
    })

    it('keeps a dotted key whole when the field is not localised', () => {
      expect(FormService.getKeyLocale({ model: 'meta.author' })).to.deep.equal({ key: 'meta.author' })
    })

    it('treats a missing model as an empty key', () => {
      expect(FormService.getKeyLocale({})).to.deep.equal({ key: '' })
    })
  })

  describe('required fields', () => {
    it('reports the translation key rather than a hardcoded sentence', () => {
      expect(validatorFor('string')(undefined, field({ required: true }), {})).to.equal('TL_FIELD_IS_REQUIRED')
      expect(validatorFor('select')('', field({ required: true }), {})).to.equal('TL_FIELD_IS_REQUIRED')
      expect(validatorFor('pillbox')([], field({ required: true }), {})).to.equal('TL_FIELD_IS_REQUIRED')
    })

    it('passes a filled field', () => {
      expect(validatorFor('string')('a value', field({ required: true }), {})).to.equal(true)
      expect(validatorFor('pillbox')(['one'], field({ required: true }), {})).to.equal(true)
    })
  })

  describe('numbers', () => {
    it('accepts a real number', () => {
      expect(validatorFor('number')(42, field(), {})).to.equal(true)
      expect(validatorFor('integer')(42, field(), {})).to.equal(true)
    })

    // Defect, not intent: `checkNumber` coerces with `Number(value || 0)` and then asks
    // lodash `isNumber`, which is type-strict and answers true for NaN. So a number field accepts
    // any text at all. `integer` and `double` escape it because isInteger(NaN) and the
    // `n === +n` test both reject NaN. Pinned here; fixing it inverts this case.
    it('accepts text on a number field, because NaN is a number to lodash', () => {
      expect(validatorFor('number')('abc', field(), {})).to.equal(true)
      expect(validatorFor('double')('abc', field(), {})).to.equal(false)
      expect(validatorFor('integer')('abc', field(), {})).to.equal(false)
    })

    it('rejects a decimal on an integer field before it reaches the number check', () => {
      expect(validatorFor('integer')('1.5', field(), {})).to.equal(false)
    })
  })

  describe('text against a regex', () => {
    const regex = { value: '/^[a-z]+$/', description: 'TL_LOWERCASE_ONLY' }

    it('passes a value the pattern accepts', () => {
      expect(validatorFor('string')('abc', field({ regex }), {})).to.equal(true)
    })

    it('names the description when the pattern rejects it', () => {
      expect(validatorFor('string')('ABC', field({ regex }), {})).to.equal('TL_INVALID_FORMAT (TL_LOWERCASE_ONLY)')
    })

    it('takes the pattern for the field locale when the field is localised', () => {
      const localised = field({ localised: true, model: 'enUS.title', regex: { enUS: { value: '/^[0-9]+$/' } } })
      expect(validatorFor('string')('123', localised, {})).to.equal(true)
      expect(validatorFor('string')('abc', localised, {})).to.equal('TL_INVALID_FORMAT (/^[0-9]+$/)')
    })
  })

  describe('attachments', () => {
    const model = { _attachments: [{ _name: 'photo', _fields: { locale: 'enUS' } }] }

    it('accepts a required image when a matching attachment exists', () => {
      expect(validatorFor('image')([], field({ required: true, model: 'photo' }), model)).to.equal(true)
    })

    it('reports a required image with no attachment and no value', () => {
      expect(validatorFor('image')([], field({ required: true, model: 'cover' }), model)).to.equal('TL_FIELD_IS_REQUIRED')
    })

    it('matches a localised attachment on its locale', () => {
      const localised = field({ required: true, model: 'photo.enUS', localised: true })
      expect(validatorFor('file')(undefined, localised, model)).to.equal(true)
      expect(validatorFor('file')(undefined, { ...localised, model: 'photo.zhCN' }, model)).to.equal('TL_FIELD_IS_REQUIRED')
    })
  })

  describe('email and url', () => {
    it('accepts a real address and rejects a malformed one', () => {
      expect(!!validatorFor('email')('someone@example.com', field(), {})).to.equal(true)
      expect(!!validatorFor('email')('not-an-address', field(), {})).to.equal(false)
    })

    it('treats an empty address as acceptable, leaving required to say otherwise', () => {
      expect(!!validatorFor('email')('', field(), {})).to.equal(true)
    })

    it('accepts an absolute url only', () => {
      expect(validatorFor('url')('https://example.com', field(), {})).to.equal(true)
      expect(validatorFor('url')('example.com', field(), {})).to.equal(false)
    })
  })

  describe('wysiwyg', () => {
    it('treats an empty paragraph as no content at all', () => {
      expect(validatorFor('wysiwyg')('<p></p>', field({ required: true }), {})).to.equal('TL_FIELD_IS_REQUIRED')
      expect(validatorFor('wysiwyg')('<p>text</p>', field({ required: true }), {})).to.equal(true)
    })
  })
})
