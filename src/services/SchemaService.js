import _ from 'lodash'
import * as Mustache from 'mustache'
import VueFormGenerator from 'vue-form-generator'
import TranslateServiceLib from '@s/TranslateService'
import ResourceService from './ResourceService'

let TranslateService
if (window.TranslateService) {
  TranslateService = window.TranslateService
} else {
  TranslateService = TranslateServiceLib
}

const validators = VueFormGenerator.validators
const customValidators = {
  text (value, field, model, messages = VueFormGenerator.validators.resources) {
    if (field.required && (!_.isString(value) || _.isEmpty(value))) {
      return messages.fieldIsRequired
    }
    const locale = _.head(field.model.split('.'))
    if (_.get(field, 'regex.value', false) === false && _.get(field, `regex['${locale}'].value`, false) === false) {
      return true
    }
    let regexText = false
    let regexDescription = false
    if (field.localised && locale) {
      regexText = _.get(field, `regex['${locale}'].value`, false)
      regexDescription = _.get(field, `regex['${locale}'].description`, false)
    }
    if (regexText === false) {
      regexText = _.get(field, 'regex.value', false)
      regexDescription = _.get(field, 'regex.description', false)
    }
    if (regexDescription === false) {
      regexDescription = regexText
    }
    if (regexText && _.isString(regexText)) {
      const fragments = regexText.match(/\/(.*?)\/([gimy])?$/)
      const regex = new RegExp(fragments[1], fragments[2] || '')
      if (!regex.test(value)) {
        return `${messages.invalidFormat} (${TranslateService.get(regexDescription)})`
      }
    }
    return true
  },
  number (value, field, model, messages = VueFormGenerator.validators.resources) {
    if (field.required && !_.isNumber(value)) {
      return messages.fieldIsRequired
    }
    return validators.number(Number(value || 0), field, model, messages)
  },
  double (value, field, model, messages = VueFormGenerator.validators.resources) {
    if (field.required && !_.isNumber(value)) {
      return messages.fieldIsRequired
    }
    return validators.double(Number(value || 0), field, model, messages)
  },
  integer (value, field, model, messages = VueFormGenerator.validators.resources) {
    if (field.required && !_.isNumber(value)) {
      return messages.fieldIsRequired
    }
    return validators.integer(Number(value || 0), field, model, messages)
  },
  image (value, field, model, messages = VueFormGenerator.validators.resources) {
    const { key, locale } = this.getKeyLocale(field)
    const attachment = _.find(model._attachments, (item) => {
      if (item._name !== key) {
        return false
      }
      if (locale && item._fields.locale !== locale) {
        return false
      }
      return true
    })
    if (field.required && !attachment) {
      return messages.fieldIsRequired
    }
    return true
  },
  file (value, field, model, messages = VueFormGenerator.validators.resources) {
    const { key, locale } = this.getKeyLocale(field)
    const attachment = _.find(model._attachments, (item) => {
      if (item._name !== key) {
        return false
      }
      if (locale && item._fields.locale !== locale) {
        return false
      }
      return true
    })
    if (field.required && !attachment) {
      return messages.fieldIsRequired
    }
    return true
  },
  select (value, field, model, messages = VueFormGenerator.validators.resources) {
    if (field.required && _.isEmpty(value)) {
      return messages.fieldIsRequired
    }
    return true
  }
}

const typeMapper = {
  string: {
    type: 'input',
    inputType: 'text',
    validator: customValidators.text
  },
  text: {
    type: 'textArea',
    rows: 5,
    validator: customValidators.text
  },
  password: {
    type: 'input',
    inputType: 'password'
  },
  email: {
    type: 'input',
    inputType: 'email',
    validator: validators.email
  },
  url: {
    type: 'input',
    inputType: 'url',
    validator: validators.url
  },
  number: {
    type: 'input',
    inputType: 'number',
    validator: customValidators.number
  },
  double: {
    type: 'input',
    inputType: 'number',
    validator: customValidators.double
  },
  integer: {
    type: 'input',
    inputType: 'number',
    validator: customValidators.integer
  },
  checkbox: {
    type: 'switch'
  },
  date: {
    type: 'customDatetimePicker',
    format: 'YYYY-MM-DD',
    customDatetimePickerOptions: {
      format: 'YYYY-MM-DD'
    }
  },
  time: {
    type: 'customDatetimePicker',
    format: 'hh:mm:ss a',
    customDatetimePickerOptions: {
      format: 'hh:mm:ss a'
    }
  },
  datetime: {
    type: 'customDatetimePicker',
    format: 'YYYY-MM-DD hh:mm:ss a',
    customDatetimePickerOptions: {
      format: 'YYYY-MM-DD hh:mm:ss a'
    }
  },
  pillbox: {
    type: 'customInputTag',
    selectOptions: {
      taggable: true,
      multiple: true,
      searchable: true,
      onNewTag (newTag, id, options, value) {
        options.push(newTag)
        value.push(newTag)
      }
    },
    values: [],
    validator: validators.array
  },
  select: {
    type: 'customMultiSelect',
    selectOptions: {
      multiple: false,
      trackBy: '_id',
      customLabel: (item, labelProp) => {
        return _.get(labelProp, item, item)
      },
      searchable: true
    },
    validator: customValidators.select
  },
  multiselect: {
    type: 'customChecklist',
    validator: validators.array
  },
  json: {
    type: 'treeView',
    treeViewOptions: {
      maxDepth: 4,
      rootObjectKey: 'root',
      modifiable: false
    }
  },
  code: {
    // type: 'treeView',
    // treeViewOptions: {
    //   maxDepth: 4,
    //   rootObjectKey: 'root',
    //   modifiable: false,
    // },
    type: 'textArea',
    rows: 10
  },
  wysiwyg: {
    type: 'wysiwyg'
  },
  image: {
    type: 'imageView',
    validator: customValidators.image
  },
  file: {
    type: 'attachmentView',
    validator: customValidators.file
  },
  paragraph: {
    type: 'ParagraphView'
  },
  group: {
    type: 'group'
  },
  object: {
    type: 'jsonEditor'
  },
  color: {
    type: 'colorPicker',
    colorPickerOptions: {
    }
  },
  paragraphImage: {
    type: 'paragraphAttachmentView',
    fileType: 'image',
    validator: customValidators.image
  },
  paragraphFile: {
    type: 'paragraphAttachmentView',
    validator: customValidators.file
  }
}

class SchemaService {
  constructor () {
    this.typeMapper = typeMapper
  }
  getSchemaFields (schema, resource, locale, userLocale, disabled, extraSources, rootView) {
    let fields = _.map(schema, (field) => {
      const isLocalised = resource.locales && (field.localised || _.isUndefined(field.localised))
      const name = field.label && TranslateService.get(field.label)
      let schema = _.extend({}, this.typeMapper[field.input], {
        label: `${name || field.field}${isLocalised ? ` (${TranslateService.get(`TL_${locale.toUpperCase()}`)})` : ''}`,
        model: isLocalised ? `${locale}.${field.field}` : field.field,
        originalModel: field.field,
        placeholder: `${name || field.field}${isLocalised ? ` (${TranslateService.get(`TL_${locale.toUpperCase()}`)})` : ''}`,
        disabled: disabled || _.get(field, 'options.disabled', false),
        readonly: _.get(field, 'options.readonly', false),
        required: !!field.required,
        options: field.options,
        resource,
        locale,
        userLocale,
        rootView
      })
      schema = _.merge({}, field.options, schema)
      if ((field.input === 'file') && _.get(schema, 'maxCount', false) === false) {
        schema.maxCount = Infinity
      }
      if (field.input === 'select' && _.get(schema, 'labels', false)) {
        schema.selectOptions.label = _.mapValues(schema.labels, label => _.get(label, `${userLocale}`, label))
      }
      if (field.input === 'multiselect' && _.get(schema, 'labels', false)) {
        if (!_.isObject(_.first(field.source))) {
          const values = []
          _.forEach(field.source, (value) => {
            values.push({
              name: _.get(schema, `labels.${value}`, value),
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

  formatSchemaForFormGenerator (fields) {
    // console.warn('formatSchemaForFormGenerator - before - fields:', fields)
    const formattedFields = _.map(fields, (field) => {
      const inputType = _.get(field, 'inputType', false)
      if (inputType === 'text') {
        field.type = 'text'
      }
      if (inputType === 'number') {
        field.type = 'number'
      }
      if (inputType === 'image') {
        field.type = 'img'
      }
      if (inputType === 'ParagraphView') {
        field.type = 'wrap'
      }
      if (inputType === 'switch') {
        field.type = 'checkbox'
      }
      // TODO: hugo - transform paragraphs into group
      field.outlined = true
      field.dense = true
      field.col = 8
      field.offset = 1
      return field
    })
    // console.warn('formatSchemaForFormGenerator - after - fields:', formattedFields)
    return formattedFields
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
        key = `${locale}.${key}`
      }
    }
    fields[id].values = cachedData || []
    if (fields[id].type === 'customMultiSelect') {
      fields[id].selectOptions = fields[id].selectOptions || {}
      fields[id].selectOptions = _.clone(fields[id].selectOptions)
      fields[id].selectOptions.key = '_id'
      fields[id].selectOptions.customLabel = (itemId) => {
        const item = _.isString(itemId) ? _.find(cachedData, {_id: itemId}) : itemId
        if (fields[id].customLabel) {
          return Mustache.render(fields[id].customLabel, item)
        } else {
          return _.get(item, key)
        }
      }
    } else if (fields[id].type === 'customChecklist') {
      fields[id].customChecklistOptions = fields[id].customChecklistOptions || {}
      fields[id].customChecklistOptions.name = key
      fields[id].customChecklistOptions.value = '_id'
    }
  }

  getKeyLocale (schema) {
    const options = {}
    const list = schema.model.split('.')
    if (schema.localised) {
      options.locale = list.shift()
    }
    options.key = list.join('.')
    return options
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
      let currentPath = `${path}.${key}`
      if (_.isUndefined(path)) {
        currentPath = key
      }
      let label = _.get(resource, `groups.${currentPath}.label`, key)
      label = TranslateService.get(label)
      return _.extend({}, this.typeMapper.group, {
        label,
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
