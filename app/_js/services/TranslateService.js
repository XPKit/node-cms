import _ from 'lodash'
import axios from 'axios/dist/axios.min'
import ConfigService from './ConfigService'

class TranslateService {
  constructor () {
    this.dict = {}
    this.locale = 'enUS'
  }

  async init () {
    this.config = _.get(ConfigService, 'config.language', { 'defaultLocale': 'enUS', 'locales': ['enUS'] })
    this.locale = _.get(this.config, 'defaultLocale', 'enUS')
    for (const locale of this.config.locales) {
      try {
        const { data } = await axios.get(`./i18n/${locale}.json`)
        this.dict[locale] = data
      } catch (error) {
        console.warn(`TranslateService wasn't able to pull ${locale}: `, error)
      }
    }
  }

  setLocale (locale) {
    this.locale = locale
  }

  get (key, locale, params) {
    if (_.isString(key)) {
      const value = this.dict[locale || this.locale] && this.dict[locale || this.locale][key]
      if (value) {
        const compiled = _.template(value)
        return compiled(params)
      }
      return key
    }
    if (_.isEmpty(key)) {
      return ''
    }
    return key[locale || this.locale] || ''
  }
}

export default new TranslateService()
