import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
vi.mock('@s/RequestService', () => ({ default: { get: (...args) => get(...args) } }))

const { default: TranslateService } = await import('@s/TranslateService')

// A singleton, so each test resets the state the previous one left behind.
describe('TranslateService', () => {
  beforeEach(() => {
    get.mockReset()
    TranslateService.dict = {}
    TranslateService.locale = 'enUS'
    TranslateService.config = undefined
  })

  describe('get', () => {
    it('returns an empty string for an empty key', () => {
      expect(TranslateService.get('')).to.equal('')
    })

    // Anything without the TL_ prefix is treated as literal text, which is what lets the admin
    // pass user-entered strings through the same filter as translation keys.
    it('passes a non-prefixed string straight through', () => {
      expect(TranslateService.get('Already English')).to.equal('Already English')
    })

    it('looks a TL_ key up in the current locale', () => {
      TranslateService.dict = { enUS: { TL_CONFIRM: 'Confirm' } }
      expect(TranslateService.get('TL_CONFIRM')).to.equal('Confirm')
    })

    it('upper-cases the key before looking it up', () => {
      TranslateService.dict = { enUS: { TL_CONFIRM: 'Confirm' } }
      expect(TranslateService.get('tl_confirm')).to.equal('Confirm')
    })

    it('renders mustache params into the translation', () => {
      TranslateService.dict = { enUS: { TL_GREETING: 'Hello {{name}}' } }
      expect(TranslateService.get('TL_GREETING', { name: 'Gabor' })).to.equal('Hello Gabor')
    })

    it('returns the key itself when nothing matches, so the screen shows what is missing', () => {
      const info = vi.spyOn(console, 'info').mockImplementation(() => {})
      expect(TranslateService.get('TL_NOT_THERE')).to.equal('TL_NOT_THERE')
      expect(info).toHaveBeenCalled()
    })

    it('follows the locale it was switched to', () => {
      TranslateService.dict = { enUS: { TL_CONFIRM: 'Confirm' }, frFR: { TL_CONFIRM: 'Confirmer' } }
      TranslateService.setLocale('frFR')
      expect(TranslateService.get('TL_CONFIRM')).to.equal('Confirmer')
    })

    it('reads a localised object by the current locale', () => {
      expect(TranslateService.get({ enUS: 'Hello', frFR: 'Bonjour' })).to.equal('Hello')
      TranslateService.setLocale('frFR')
      expect(TranslateService.get({ enUS: 'Hello', frFR: 'Bonjour' })).to.equal('Bonjour')
    })

    it('reads a named field out of a localised object', () => {
      expect(TranslateService.get({ enUS: { title: 'Articles' } }, 'title')).to.equal('Articles')
    })

    it('returns an empty string when a localised object has nothing for the locale', () => {
      expect(TranslateService.get({ frFR: 'Bonjour' })).to.equal('')
    })
  })

  describe('renderTranslation', () => {
    it('returns an empty string and logs when the template cannot be rendered', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(TranslateService.renderTranslation(undefined, {})).to.equal('')
      expect(error).toHaveBeenCalled()
    })
  })

  describe('init', () => {
    it('reads the language config, then one dictionary per locale', async () => {
      get.mockImplementation(async url => {
        if (url.endsWith('i18n/config.json')) {
          return { config: { language: { defaultLocale: 'frFR', locales: ['enUS', 'frFR'] } } }
        }
        return { TL_CONFIRM: url.includes('frFR') ? 'Confirmer' : 'Confirm' }
      })
      await TranslateService.init()
      expect(TranslateService.getLocales()).to.deep.equal(['enUS', 'frFR'])
      expect(TranslateService.locale).to.equal('frFR')
      expect(TranslateService.get('TL_CONFIRM')).to.equal('Confirmer')
    })

    it('falls back to enUS when the server sends no language config', async () => {
      get.mockResolvedValue({})
      await TranslateService.init()
      expect(TranslateService.locale).to.equal('enUS')
      expect(TranslateService.getLocales()).to.deep.equal(['enUS'])
    })

    // One unreachable dictionary must not take the others down with it.
    it('keeps going when a single locale fails to load', async () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})
      get.mockImplementation(async url => {
        if (url.endsWith('i18n/config.json')) {
          return { config: { language: { defaultLocale: 'enUS', locales: ['enUS', 'frFR'] } } }
        }
        if (url.includes('frFR')) {
          throw new Error('404')
        }
        return { TL_CONFIRM: 'Confirm' }
      })
      await TranslateService.init()
      expect(TranslateService.get('TL_CONFIRM')).to.equal('Confirm')
      expect(error).toHaveBeenCalled()
    })
  })
})
