
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
  integer: (n) => _.isNumber(n) && _.isInteger(n),
  double: (n) => _.isNumber(n) && (_.isInteger(n) || (n === +n && n !== (n | 0))),
  text: (t) => _.isString(t),
  array: (a) => _.isArray(a),
  email: (e) => (new RegExp('/^\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})+$/')).test(e)
}

const messages = {
  fieldIsRequired: TranslateService.get('TL_FIELD_IS_REQUIRED'),
  invalidFormat: TranslateService.get('TL_INVALID_FORMAT')
}

const checkNumber = (field, value, model, type) => {
  if (_.get(field, 'required', false) && !_.isNumber(value)) {
    return messages.fieldIsRequired
  }
  const func = _.get(validators, type, false)
  if (func) {
    return func(Number(value || 0), field, model, messages)
  }
  console.error(`checkNumber - No validator found for type '${type}'`)
  return false
}

const customValidators = {
  array: (a) => _.isArray(a),
  email: (e) => (new RegExp('/^\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})+$/')).test(e),
  text: (value, field, model) => {
    if (_.get(field, 'required', false) && (!_.isString(value) || _.isEmpty(value))) {
      return messages.fieldIsRequired
    }
    const locale = _.head(_.get(field, 'model', '').split('.'))
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
  number: (value, field, model) => checkNumber(field, value, model, 'number'),
  double: (value, field, model) => checkNumber(field, value, model, 'double'),
  integer: (value, field, model) => {
    if (value.toString().indexOf('.') !== -1) {
      return false
    }
    return checkNumber(field, value, model, 'integer')
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
    return _.get(field, 'required', false) && _.isEmpty(value) ? messages.fieldIsRequired : true
  }
}

let typeMapper = {
  string: {
    type: 'input',
    overrideType: 'CustomInput',
    validator: customValidators.text
  },
  text: {
    type: 'textarea',
    overrideType: 'CustomTextarea',
    rows: 5,
    validator: customValidators.text
  },
  password: {
    type: 'input',
    inputFieldType: 'password',
    overrideType: 'CustomInput'
  },
  email: {
    type: 'input',
    overrideType: 'CustomInput',
    inputFieldType: 'email',
    validator: validators.email
  },
  url: {
    type: 'input',
    overrideType: 'CustomInput',
    validator: validators.url
  },
  number: {
    type: 'input',
    overrideType: 'CustomInput',
    inputFieldType: 'number',
    validator: customValidators.number
  },
  double: {
    type: 'input',
    overrideType: 'CustomInput',
    inputFieldType: 'number',
    validator: customValidators.double
  },
  integer: {
    type: 'input',
    overrideType: 'CustomInput',
    inputFieldType: 'number',
    validator: customValidators.integer
  },
  checkbox: {
    type: 'switch',
    overrideType: 'CustomSwitch'
  },
  date: {
    type: 'CustomDatetimePicker',
    format: 'YYYY-MM-DD',
    customDatetimePickerOptions: {
      format: 'YYYY-MM-DD'
    }
  },
  time: {
    type: 'CustomDatetimePicker',
    format: 'hh:mm:ss a',
    customDatetimePickerOptions: {
      format: 'hh:mm:ss a'
    }
  },
  datetime: {
    type: 'CustomDatetimePicker',
    format: 'YYYY-MM-DD hh:mm:ss a',
    customDatetimePickerOptions: {
      format: 'YYYY-MM-DD hh:mm:ss a'
    }
  },
  pillbox: {
    type: 'CustomInputTag',
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
    type: 'CustomMultiSelect',
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
    type: 'CustomChecklist',
    validator: validators.array
  },
  json: {
    type: 'TreeView',
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
    type: 'Wysiwyg',
    overrideType: 'WysiwygField'
  },
  image: {
    type: 'ImageView',
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
    type: 'JsonEditor'
  },
  color: {
    type: 'ColorPicker',
    colorPickerOptions: {
    }
  },
  paragraphImage: {
    type: 'paragraphAttachmentView',
    overrideType: 'ParagraphAttachmentView',
    fileType: 'image',
    validator: customValidators.image
  },
  paragraphFile: {
    type: 'paragraphAttachmentView',
    overrideType: 'ParagraphAttachmentView',
    validator: customValidators.file
  }
}

_.each(typeMapper, (type) => {
  type.dense = true
  type.outlined = true
})

class FormService {
  constructor () {
    this.typeMapper = typeMapper
  }

  getKeyLocale (schema) {
    return getKeyLocale(schema)
  }
}

export default new FormService()
