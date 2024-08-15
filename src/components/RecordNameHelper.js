import _ from 'lodash'
import ResourceService from '@s/ResourceService'
import * as Mustache from 'mustache'

export default {
  methods: {
    getName (item) {
      const name = this.getValue(item, _.first(this.resource.schema), this.resource.displayItem)
      return _.isString(name) ? name : _.get(item, '_id', false)
    },
    getValue (item, field, template) {
      let displayname = ''
      if (field) {
        if (field.input === 'file') {
          const attachment = _(item).get('_attachments', []).find(file => file._name === field.field)
          displayname = attachment && attachment._filename
        } else if (field.input === 'select') {
          let value = _.get(item, field.field)
          if (_.isString(value)) {
            const records = _.get(ResourceService.get(field.source, -1), 'records', [])
            value = _.find(records, {_id: value})
            const extraSources = field.options && field.options.extraSources
            if (value && extraSources) {
              _.each(extraSources, (source, field) => {
                const subId = _.get(value, field)
                if (_.isString(subId)) {
                  // const subRecords = _.get(ResourceService.get(source, -1), 'records', [])
                  _.set(value, field, _.find(ResourceService.get(source, -1), {_id: subId}))
                }
              })
            }
          }
          if (template && value) {
            const itemCached = _.cloneDeep(item)
            _.set(itemCached, field.field, _.cloneDeep(value))
            return Mustache.render(template, itemCached)
          } else if (field.options && field.options.customLabel) {
            displayname = Mustache.render(field.options.customLabel, value || {})
          } else {
            displayname = _.get(value, _.chain(value).keys().first().value(), '')
          }
        }
        if (displayname === '') {
          const isLocalised = this.resource.locales && (field.localised || _.isUndefined(field.localised))
          displayname = _.get(item, isLocalised ? `${this.locale}.${field.field}` : field.field)
        }
      }
      if (template) {
        const itemCached = _.clone(item)
        _.each(this.getExtraResources(), (extraSource, extraField) => {
          // TODO: hugo - may need to change
          const cachedRecords = _.get(ResourceService.get(extraSource, -1), 'records', [])
          if (cachedRecords) {
            const value = _.find(cachedRecords, {_id: _.get(itemCached, extraField)})
            if (value) {
              _.set(itemCached, extraField, value)
            }
          }
        })
        displayname = Mustache.render(template, itemCached)
      }
      return displayname
    },
    getExtraResources () {
      return _.extend(_.get(this.resource, 'extraSources', {}), _.get(this.resource, 'schema[0].options.extraSources'))
    }
  }
}
