
import _ from 'lodash'
import TranslateServiceLib from '@s/TranslateService'

const TranslateService = window.TranslateService || TranslateServiceLib
const getKeyLocale = (schema) => {
  const options = {}
  const list = _.get(schema, 'model', '').split('.')
  if (_.get(schema, 'localised', false)) {
    options.locale = list.pop()
  }
  options.key = list.join('.')
  return options
}

const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
}

const validators = {
  url: (u) => {
    try {
      const validUrl = new URL(u)
      return !!validUrl
    } catch {
      return false
    }
  },
  number: (n) => _.isNumber(n),
  integer: (n) => _.isNumber(n) && _.isInteger(n),
  double: (n) => _.isNumber(n) && (_.isInteger(n) || (n === +n && n !== (n | 0))),
  text: (t) => _.isString(t),
  array: (a) => _.isArray(a),
  email: (e) => validateEmail(e)
}

const fieldIsRequired = () => {
  return TranslateService.get('TL_FIELD_IS_REQUIRED')
}
const invalidFormat = () => {
  return TranslateService.get('TL_INVALID_FORMAT')
}

const checkNumber = (field, value, model, type) => {
  if (_.get(field, 'required', false) && !_.isNumber(value)) {
    return TranslateService.get('TL_FIELD_IS_REQUIRED')
  }
  const func = _.get(validators, type, false)
  if (func) {
    return func(Number(value || 0), field, model, {
      fieldIsRequired: fieldIsRequired(),
      invalidFormat: invalidFormat()
    })
  }
  console.error(`checkNumber - No validator found for type '${type}'`)
  return false
}

const customLabel = (item, labelProp) => {
  return _.get(labelProp, item, item)
}

const customValidators = {
  array: (a) => _.isArray(a),
  email: (e) => (new RegExp('/^\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})+$/')).test(e),
  text: (value, field) => {
    if (_.get(field, 'required', false) && (!_.isString(value) || _.isEmpty(value))) {
      return fieldIsRequired()
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
        return `${invalidFormat()} (${TranslateService.get(regexDescription)})`
      }
    }
    return true
  },
  number: (value, field, model) => checkNumber(field, value, model, 'number'),
  double: (value, field, model) => checkNumber(field, value, model, 'double'),
  integer: (value, field, model) => {
    if (_.isUndefined(value)) {
      value = ''
    }
    if (value.toString().indexOf('.') !== -1) {
      return false
    }
    return checkNumber(field, value, model, 'integer')
  },
  image: (value, field, model) => {
    const { key, locale } = getKeyLocale(field)
    const attachment = _.find(_.get(model, '_attachments', []), (item) => {
      return item._name === key && (!locale || item._fields.locale === locale)
    })
    if (_.get(field, 'required', false) && !attachment && _.get(value, 'length', 0) === 0) {
      return fieldIsRequired()
    }
    return true
  },
  file: (value, field, model) => {
    const { key, locale } = getKeyLocale(field)
    const attachment = _.find(_.get(model, '_attachments', []), (item) => {
      return item._name === key && (!locale || item._fields.locale === locale)
    })
    if (_.get(field, 'required', false) && !attachment) {
      return fieldIsRequired()
    }
    return true
  },
  select: (value, field) => {
    return _.get(field, 'required', false) && _.isEmpty(value) ? fieldIsRequired() : true
  },
  pillbox: (value, field) => {
    if (_.get(field, 'required', false) && (!_.isArray(value) || _.isEmpty(value))) {
      return fieldIsRequired()
    }
    return true
  }
}

let typeMapper = {
  string: {
    type: 'input',
    overrideType: 'CustomInput',
    validator: customValidators.text
  },
  transliterate: {
    type: 'input',
    overrideType: 'Transliterate',
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
    overrideType: 'CustomCheckbox'
  },
  date: {
    type: 'CustomDatetimePicker',
    format: 'YYYY-MM-DD',
    customDatetimePickerOptions: {
      placeholder: 'YYYY-MM-DD'
    }
  },
  time: {
    type: 'CustomDatetimePicker',
    format: 'HH:mm:ss a',
    customDatetimePickerOptions: {
      placeholder: 'HH:mm:ss'
    }
  },
  datetime: {
    type: 'CustomDatetimePicker',
    format: 'YYYY-MM-DD HH:mm:ss',
    customDatetimePickerOptions: {
      placeholder: 'YYYY-MM-DD HH:mm:ss'
    }
  },
  pillbox: {
    type: 'CustomInputTag',
    selectOptions: {
      multiple: true,
      searchable: true,
      onNewTag (newTag, id, options, value) {
        options.push(newTag)
        value.push(newTag)
      }
    },
    values: [],
    validator: customValidators.pillbox
  },
  select: {
    type: 'CustomMultiSelect',
    selectOptions: {
      multiple: false,
      trackBy: '_id',
      customLabel,
      searchable: true
    },
    validator: customValidators.select
  },
  multiselect: {
    type: 'CustomMultiSelect',
    selectOptions: {
      multiple: true,
      listBox: true,
      trackBy: '_id',
      chips: true,
      deletableChips: true,
      customLabel,
      searchable: true
    },
    validator: validators.array
  },
  json: {
    type: 'TreeView',
    overrideType: 'CustomTreeView',
    treeViewOptions: {
      maxDepth: 4,
      rootObjectKey: 'root',
      modifiable: false
    }
  },
  code: {
    type: 'Code',
    overrideType: 'CustomCode',
    options: {
    }
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
    type: 'group',
    overrideType: 'Group'
  },
  object: {
    type: 'JsonEditor'
  },
  color: {
    type: 'ColorPicker',
    colorPickerOptions: {
    }
  }
}

_.each(typeMapper, (type) => {
  type.density = 'compact'
  type.rounded = true
  type.flat = true
  _.set(type, 'solo-filled', true)
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
