import _ from 'lodash'
import RequestService from './RequestService'
import Mustache from 'mustache'

class TranslateService {
  constructor () {
    this.dict = {}
    this.locale = 'enUS'
  }

  async init () {
    const data = await RequestService.get(`${window.location.pathname}i18n/config.json`)
    this.config = _.get(data, 'config.language', { 'defaultLocale': 'enUS', 'locales': ['enUS'] })
    this.locale = _.get(this.config, 'defaultLocale', 'enUS')
    for (const locale of this.getLocales()) {
      try {
        this.dict[locale] = await RequestService.get(`${window.location.pathname}i18n/${locale}.json`)
      } catch (error) {
        console.warn(`TranslateService wasn't able to pull ${locale}: `, error)
      }
    }
  }

  getLocales() {
    return _.get(this.config, 'locales', [])
  }

  setLocale (locale) {
    this.locale = locale
  }

  get (key, params) {
    if (_.isString(key)) {
      if (_.isEmpty(key)) {
        return ''
      }
      if (!_.startsWith(_.toUpper(key), 'TL_') && !_.isObject(key)) {
        return key
      }
      if (_.isString(key)) {
        key = _.toUpper(key)
      }
      if (_.get(this.dict, `${this.locale}.${key}`, false)) {
        let result = ''
        try {
          result = Mustache.render(this.dict[this.locale][key], params || {})
        } catch (error) {
          console.error(`Failed to render translation '${key}':`, error)
        }
        return result
      }
      if (_.get(key, this.locale, false))  {
        let result = ''
        try {
          result = Mustache.render(key[this.locale], params || {})
        } catch (error) {
          console.error('Failed to render translation:', {error, key, locale: this.locale})
        }
        return result
      }
      console.info(`Did not find any translation for ${key}`,
        {
          key: key,
          locale: this.locale,
          dictItem: _.get(this.dict, `${key}.${this.locale}`, false),
          dict: this.dict
        }
      )
      return key
    }
    if (_.isString(params) && !_.isEmpty(params)) {
      return _.get(key, `${this.locale}.${params}`, '')
    }
    return _.get(key, this.locale, '')
  }
}

export default new TranslateService()
