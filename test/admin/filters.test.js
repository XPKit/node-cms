import { describe, expect, it, vi } from 'vitest'

const get = vi.fn((value, locale, params) => ({ value, locale, params }))
vi.mock('@s/TranslateService', () => ({ default: { get: (...args) => get(...args) } }))

const { default: TranslateFilter } = await import('@f/Translate')
const { default: TruncateFilter } = await import('@f/Truncate')

describe('filters', () => {
  describe('Translate', () => {
    // The filter forwards three arguments, but TranslateService.get takes (key, params) — so the
    // locale a caller passes second lands in the params slot and the third argument is dropped.
    // Recorded as it behaves; every call site in src/ passes the key alone, which is why it works.
    it('forwards all three of its arguments to the service', () => {
      TranslateFilter('TL_CONFIRM', 'frFR', { name: 'x' })
      expect(get).toHaveBeenCalledWith('TL_CONFIRM', 'frFR', { name: 'x' })
    })

    it('passes a lone key through untouched', () => {
      get.mockReturnValueOnce('Confirm')
      expect(TranslateFilter('TL_CONFIRM')).to.equal('Confirm')
    })
  })

  describe('Truncate', () => {
    it('shortens past the given length and marks the cut', () => {
      expect(TruncateFilter('the quick brown fox', 10)).to.equal('the qui...')
    })

    it('leaves a short value alone', () => {
      expect(TruncateFilter('short', 10)).to.equal('short')
    })

    // The length arrives from a template attribute, where it is a string.
    it('accepts the length as a string', () => {
      expect(TruncateFilter('the quick brown fox', '10')).to.equal('the qui...')
    })
  })
})
