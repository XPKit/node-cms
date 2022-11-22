import TranslateService from '../services/TranslateService'

export default function TranslateFilter(value) {
  return TranslateService.get(value)
}
