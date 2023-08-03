import _ from 'lodash'
import ResourceService from '@s/ResourceService'
import * as Mustache from 'mustache'

export default {
  methods: {
    getName (item) {
      return this.getValue(item, _.first(this.resource.schema), this.resource.displayItem)
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
            value = _.find(ResourceService.get(field.source), {_id: value})
            if (value) {
              _.each(field.options && field.options.extraSources, (source, field) => {
                const subId = _.get(value, field)
                if (_.isString(subId)) {
                  _.set(value, field, _.find(ResourceService.get(source), {_id: subId}))
                }
              })
            }
          }
          if (field.options && field.options.customLabel) {
            displayname = Mustache.render(field.options.customLabel, value || {})
          } else {
            displayname = _.get(value, _.chain(value).keys().first().value(), '')
          }
        }
        if (displayname === '') {
          const isLocalised = this.resource.locales && (field.localised || _.isUndefined(field.localised))
          if (isLocalised) {
            displayname = _.get(item, `${this.locale}.${field.field}`)
          } else {
            displayname = _.get(item, field.field)
          }
        }
      }
      if (template) {
        const itemCached = _.clone(item)
        _.each(this.getExtraRessources(), (extraSource, extraField) => {
          const cache = ResourceService.get(extraSource)
          if (cache) {
            const value = _.find(cache, {_id: _.get(itemCached, extraField)})
            if (value) {
              _.set(itemCached, extraField, value)
            }
          }
        })
        displayname = Mustache.render(template, itemCached)
      }
      return displayname
    },
    getExtraRessources () {
      return _.extend(_.get(this.resource, 'extraSources', {}), _.get(this.resource, 'schema[0].options.extraSources'))
    }
  }
}
