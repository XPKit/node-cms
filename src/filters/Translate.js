import TranslateService from '@s/TranslateService'

export default function TranslateFilter(value, locale, params) {
  return TranslateService.get(value, locale, params)
}
