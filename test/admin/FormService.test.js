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

    // #106: checkNumber coerces with Number(value || 0), and NaN was a number to lodash isNumber,
    // so a number field took any text at all. isFinite settles it.
    it('rejects text on a number field, as on a double or an integer field', () => {
      expect(validatorFor('number')('abc', field(), {})).to.equal(false)
      expect(validatorFor('double')('abc', field(), {})).to.equal(false)
      expect(validatorFor('integer')('abc', field(), {})).to.equal(false)
    })

    it('still takes a number the user typed, which arrives as a string', () => {
      expect(validatorFor('number')('42', field(), {})).to.equal(true)
      expect(validatorFor('integer')('42', field(), {})).to.equal(true)
    })

    // #106 again, on the required gate: it asked whether the value was already a number, so a
    // required field reported the number the user had just typed as missing.
    it('accepts a typed number on a required field rather than calling it missing', () => {
      expect(validatorFor('number')('42', field({ required: true }), {})).to.equal(true)
      expect(validatorFor('number')('', field({ required: true }), {})).to.equal('TL_FIELD_IS_REQUIRED')
      expect(validatorFor('number')(undefined, field({ required: true }), {})).to.equal('TL_FIELD_IS_REQUIRED')
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

    // #108: the locale is the model's last segment, the way SchemaService builds it and the way
    // getKeyLocale reads it. Reading the first segment looked the pattern up under the field's own
    // name, missed, and left the field validated against nothing at all.
    it('applies a per-locale regex on a field shaped the way SchemaService builds it', () => {
      const localised = field({ localised: true, model: 'title.enUS', regex: { enUS: { value: '/^[0-9]+$/' } } })
      expect(validatorFor('string')('abc', localised, {})).to.equal('TL_INVALID_FORMAT (/^[0-9]+$/)')
      expect(validatorFor('string')('123', localised, {})).to.equal(true)
    })

    it('picks the pattern for the locale the field is in, not another locale\'s', () => {
      const perLocale = { enUS: { value: '/^[0-9]+$/' }, frFR: { value: '/^[a-z]+$/' } }
      expect(validatorFor('string')('abc', field({ localised: true, model: 'title.frFR', regex: perLocale }), {})).to.equal(true)
      expect(validatorFor('string')('abc', field({ localised: true, model: 'title.enUS', regex: perLocale }), {})).to.equal('TL_INVALID_FORMAT (/^[0-9]+$/)')
    })

    it('prefers the locale pattern over the plain one when the field has both', () => {
      const both = field({ localised: true, model: 'title.enUS', regex: { value: '/^[a-z]+$/', enUS: { value: '/^[0-9]+$/' } } })
      expect(validatorFor('string')('abc', both, {})).to.equal('TL_INVALID_FORMAT (/^[0-9]+$/)')
      expect(validatorFor('string')('123', both, {})).to.equal(true)
    })

    // A field that is not localised has no locale segment to read, so its model is left alone and
    // only a plain regex can apply.
    it('leaves a field that is not localised to its plain regex', () => {
      expect(validatorFor('string')('ABC', field({ model: 'meta.title', regex }), {})).to.equal('TL_INVALID_FORMAT (TL_LOWERCASE_ONLY)')
      expect(validatorFor('string')('abc', field({ model: 'meta.title', regex: { enUS: { value: '/^[0-9]+$/' } } }), {})).to.equal(true)
    })

    it('still applies a plain regex to that same localised field', () => {
      const localised = field({ localised: true, model: 'title.enUS', regex: { value: '/^[0-9]+$/' } })
      expect(validatorFor('string')('abc', localised, {})).to.equal('TL_INVALID_FORMAT (/^[0-9]+$/)')
      expect(validatorFor('string')('123', localised, {})).to.equal(true)
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
