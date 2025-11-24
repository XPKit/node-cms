import _ from 'lodash'
import * as Mustache from 'mustache'
import TranslateServiceLib from '@s/TranslateService'
import FormService from '@s/FormService'
import ResourceService from './ResourceService'

const TranslateService = window.TranslateService || TranslateServiceLib

class SchemaService {
  constructor () {
    this.typeMapper = FormService.typeMapper
  }

  getSchemaFields (schema, resource, locale, userLocale, disabled, extraSources, rootView) {
    let fields = _.map(schema, (field) => {
      const isLocalised = resource.locales && (field.localised || _.isUndefined(field.localised))
      const name = field.label && TranslateService.get(field.label)
      const label = `${name || field.field}${isLocalised ? ` (${TranslateService.get(`TL_${locale.toUpperCase()}`)})` : ''}`
      const schema = _.extend({}, this.typeMapper[field.input], {
        label,
        model: isLocalised ? `${field.field}.${locale}` : field.field,
        originalModel: field.field,
        placeholder: label,
        disabled: disabled || _.get(field, 'options.disabled', _.get(field, 'disabled', false)),
        readonly: _.get(field, 'options.readonly', false),
        required: !!field.required,
        options: field.options,
        hint: field.hint,
        resource,
        locale,
        userLocale,
        rootView
      })
      _.each(field.options, (val, key) => {
        _.set(schema, key, val)
      })
      if (field.input === 'paragraph') {
        schema.key = field.key
      }
      if (_.get(field, 'paragraphKey', false)) {
        schema.paragraphKey = field.paragraphKey
        schema.paragraphType = field.paragraphType
      }
      if ((field.input === 'file') && _.get(schema, 'maxCount', false) === false) {
        schema.maxCount = Infinity
      } else if (field.input === 'select' && _.get(schema, 'labels', false)) {
        schema.selectOptions.label = _.map(schema.labels, (label, value) => {
          return { value, text: _.get(label, locale, label) }
        })
      } else if (field.input === 'multiselect' && _.get(schema, 'labels', false)) {
        if (!_.isObject(_.first(field.source))) {
          const values = []
          _.each(field.source, (value) => {
            values.push({
              text: _.get(schema, `labels.${value}`, value),
              value
            })
          })
          field.source = values
        }
      }
      if (field.input === 'select' || field.input === 'pillbox') {
        schema.selectOptions.selectLabel = TranslateService.get('TL_MULTISELECT_SELECT_LABEL')
        schema.selectOptions.selectGroupLabel = TranslateService.get('TL_MULTISELECT_SELECT_GROUP_LABEL')
        schema.selectOptions.selectedLabel = TranslateService.get('TL_MULTISELECT_SELECTED_LABEL')
        schema.selectOptions.deselectLabel = TranslateService.get('TL_MULTISELECT_DESELECT_LABEL')
        schema.selectOptions.deselectGroupLabel = TranslateService.get('TL_MULTISELECT_DESELECT_GROUP_LABEL')
        schema.selectOptions.tagPlaceholder = TranslateService.get('TL_MULTISELECT_TAG_PLACEHOLDER')
        if (field.input === 'pillbox') {
          schema.selectOptions.min = field.min
          schema.selectOptions.max = field.max
        }
      }
      return schema
    })
    for (const id in schema) {
      const field = schema[id]
      if (_.isArray(field.source)) {
        fields[id].values = field.source
      } else if (_.isString(field.source)) {
        this.updateFieldSchema(fields, field, id, locale, extraSources)
      }
      fields[id].localised = resource.locales && (field.localised || _.isUndefined(field.localised))
    }
    return fields
  }

  updateFieldSchema (fields, field, id, locale, extraSources) {
    const cachedData = ResourceService.get(field.source)
    // handle extra source
    extraSources = _.extend({}, extraSources, _.get(field, 'options.extraSources'))
    _.each(extraSources, (source, key) => {
      const list = ResourceService.get(source)
      _.each(cachedData, item => {
        const value = _.get(item, key)
        if (_.isString(value)) {
          _.set(item, key, _.find(list, {_id: value}))
        }
      })
    })
    const relatedSchema = ResourceService.getSchema(field.source)
    const firstField = relatedSchema && _.first(relatedSchema.schema)
    let key = '_id'
    if (firstField) {
      key = firstField.field
      if (relatedSchema.locales && locale && (firstField.localised || _.isUndefined(firstField.localised))) {
        key = `${key}.${locale}`
      }
    }
    fields[id].values = cachedData || []
    if (fields[id].type === 'CustomMultiSelect') {
      fields[id].source = field.source
      fields[id].selectOptions = _.clone(fields[id].selectOptions || {})
      fields[id].selectOptions.key = '_id'
      fields[id].selectOptions.customLabel = (itemId) => {
        const item = _.isString(itemId) ? _.find(cachedData, {_id: itemId}) : itemId
        if (!_.get(fields[id], 'customLabel', false)) {
          return _.get(item, `${key}.${locale}`, _.get(item, key))
        } else if (_.isUndefined(item)) {
          return ''
        }
        const renderedLabel = Mustache.render(fields[id].customLabel, item)
        if (renderedLabel !== '[object Object]') {
          return renderedLabel
        }
        const fieldKey = _.get(fields[id].customLabel.match('{{(?<fieldKey>\\s*.*\\s*)}}'), 'groups.fieldKey', false)
        if (fieldKey) {
          return Mustache.render(_.replace(fields[id].customLabel, fieldKey, `${fieldKey}.${locale}`), item)
        } else {
          console.error(`Couldn't find fieldKey in customLabel '${fields[id].customLabel}'`)
          return ''
        }
      }
    }
  }

  getKeyLocale (schema) {
    return FormService.getKeyLocale(schema)
  }

  getNestedGroups (resource, fields, level, path, prefix) {
    let groups = _.groupBy(fields, item => {
      let list = item.originalModel
      if (prefix) {
        list = list.replace(prefix, '')
      }
      list = list.split('.')
      return list[level]
    })
    groups = _.map(groups, (list, key) => {
      if (_.uniqBy(list, 'originalModel').length === 1) {
        const value = _.first(list)
        if (list.length > 1) {
          console.warn(`duplicated field '${value.model}' detected in resource '${resource.displayname || resource.title}'`)
        }
        return value
      }
      const currentPath = _.isUndefined(path) ? key : `${path}.${key}`
      return _.extend({}, this.typeMapper.group, {
        label: TranslateService.get(_.get(resource, `groups.${currentPath}.label`, key)),
        key,
        path,
        groupOptions: {
          fields: this.getNestedGroups(resource, list, level + 1, path, prefix)
        }
      })
    })
    return groups
  }
}

export default new SchemaService()
