
import _ from 'lodash'
import TranslateServiceLib from '@s/TranslateService'

let TranslateService
if (window.TranslateService) {
  TranslateService = window.TranslateService
} else {
  TranslateService = TranslateServiceLib
}
const getKeyLocale = (schema) => {
  const options = {}
  const list = _.get(schema, 'model', '').split('.')
  if (_.get(schema, 'localised', false)) {
    options.locale = list.shift()
  }
  options.key = list.join('.')
  return options
}

const validators = {
  url: (u) => {
    try {
      const validUrl = new URL(u)
      return !!validUrl
    } catch (error) {
      return false
    }
  },
  number: (n) => _.isNumber(n),
  integer: (n) => _.isInteger(n),
  double: (n) => isNaN(Number(n)),
  text: (t) => _.isString(t),
  array: (a) => _.isArray(a),
  email: (e) => (new RegExp('/^\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})+$/')).test(e)
}

const messages = {
  fieldIsRequired: TranslateService.get('TL_FIELD_IS_REQUIRED'),
  invalidFormat: TranslateService.get('TL_INVALID_FORMAT')
}

const customValidators = {
  array: (a) => _.isArray(a),
  email: (e) => (new RegExp('/^\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})+$/')).test(e),
  text: (value, field, model) => {
    console.warn('customValidators - text - ', value, field, model)
    if (_.get(field, 'required', false) && (!_.isString(value) || _.isEmpty(value))) {
      return messages.fieldIsRequired
    }
    console.warn('AFTER 1')
    const locale = _.head(_.get(field, 'model', '').split('.'))
    if (_.get(field, 'regex.value', false) === false && _.get(field, `regex['${locale}'].value`, false) === false) {
      console.warn('AFTER 1-1')
      return true
    }
    let regexText = false
    let regexDescription = false
    if (field.localised && locale) {
      regexText = _.get(field, `regex['${locale}'].value`, false)
      regexDescription = _.get(field, `regex['${locale}'].description`, false)
    }
    console.warn('AFTER 2')
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
    console.warn('AFTER 3')
    return true
  },
  number: (value, field, model) => {
    if (_.get(field, 'required', false) && !_.isNumber(value)) {
      return messages.fieldIsRequired
    }
    return validators.number(Number(value || 0), field, model, messages)
  },
  double: (value, field, model) => {
    if (_.get(field, 'required', false) && !_.isNumber(value)) {
      return messages.fieldIsRequired
    }
    return validators.double(Number(value || 0), field, model, messages)
  },
  integer: (value, field, model) => {
    if (_.get(field, 'required', false) && !_.isNumber(value)) {
      return messages.fieldIsRequired
    }
    return validators.integer(Number(value || 0), field, model, messages)
  },
  image: (value, field, model) => {
    const { key, locale } = getKeyLocale(field)
    const attachment = _.find(_.get(model, '_attachments', []), (item) => {
      if (item._name !== key) {
        return false
      }
      if (locale && item._fields.locale !== locale) {
        return false
      }
      return true
    })
    if (_.get(field, 'required', false) && !attachment) {
      return messages.fieldIsRequired
    }
    return true
  },
  file: (value, field, model) => {
    const { key, locale } = getKeyLocale(field)
    const attachment = _.find(_.get(model, '_attachments', []), (item) => {
      if (item._name !== key) {
        return false
      }
      if (locale && item._fields.locale !== locale) {
        return false
      }
      return true
    })
    if (_.get(field, 'required', false) && !attachment) {
      return messages.fieldIsRequired
    }
    return true
  },
  select: (value, field, model) => {
    if (_.get(field, 'required', false) && _.isEmpty(value)) {
      return messages.fieldIsRequired
    }
    return true
  }
}

const typeMapper = {
  string: {
    type: 'input',
    overrideType: 'CustomInput',
    outlined: true,
    dense: true,
    validator: customValidators.text
  },
  text: {
    type: 'textarea',
    overrideType: 'CustomTextarea',
    rows: 5,
    outlined: true,
    dense: true,
    validator: customValidators.text
  },
  password: {
    type: 'input',
    overrideType: 'CustomPassword',
    outlined: true,
    dense: true
  },
  email: {
    type: 'input',
    overrideType: 'CustomEmail',
    outlined: true,
    dense: true,
    validator: validators.email
  },
  url: {
    type: 'input',
    overrideType: 'CustomUrl',
    outlined: true,
    dense: true,
    validator: validators.url
  },
  number: {
    type: 'input',
    overrideType: 'CustomNumber',
    outlined: true,
    dense: true,
    validator: customValidators.number
  },
  double: {
    type: 'input',
    overrideType: 'CustomDouble',
    outlined: true,
    dense: true,
    validator: customValidators.double
  },
  integer: {
    type: 'input',
    overrideType: 'CustomInteger',
    outlined: true,
    dense: true,
    validator: customValidators.integer
  },
  checkbox: {
    type: 'switch',
    overrideType: 'CustomSwitch'
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
    overrideType: 'TreeView',
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
    type: 'AttachmentView',
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

class FormService {
  constructor () {
    this.typeMapper = typeMapper
  }

  getKeyLocale (schema) {
    return getKeyLocale(schema)
  }

  // translateFieldType (field) {
  //   let type = _.get(field, 'inputType', _.get(field, 'type', false))
  //   console.warn(`${field.model} - ${type}`, _.cloneDeep(field))
  //   if (!type) {
  //     console.error(`Field ${field.label} has no type, will assume it is a string field`)
  //     return 'text'
  //   }
  //   if (type === 'string') {
  //     return 'text'
  //   }
  //   if (type === 'text') {
  //     return 'textarea'
  //   }
  //   if (type === 'image') {
  //     return 'img'
  //   }
  //   if (type === 'switch') {
  //     return 'checkbox'
  //   }
  //   if (type === 'attachmentView') {
  //     return 'attachmentView'
  //   }
  //   return type
  // }

  // translateFieldRequirements (field) {
  //   const rules = []
  //   if (_.get(field, 'validator', false)) {
  //     rules.push(field.validator)
  //   }
  //   if (_.get(field, 'required', false) && field.type !== 'checkbox') {
  //     rules.push((val) => {
  //       if (_.get(val, 'length', 0) === 0) {
  //         return false
  //       }
  //       return true
  //     })
  //   }
  //   return rules
  // }

  // translateFieldsSchema (fields) {
  //   const formattedFields = _.map(fields, (field) => {
  //     field.type = this.translateFieldType(field)
  //     field.outlined = true
  //     field.dense = true
  //     field.col = 8
  //     field.offset = 1
  //     field.rules = this.translateFieldRequirements(field)
  //     return field
  //   })
  //   return formattedFields
  // }
}

export default new FormService()
