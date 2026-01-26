import {
  uniq as arrayUniq,
  forEach,
  includes,
  isArray,
  isFunction,
  isString,
  join,
  get as objGet,
  set as objSet,
} from 'lodash'
import FieldSelectorService from '@s/FieldSelectorService'
import validators from '@u/validators'

function convertValidator(validator) {
  if (isString(validator)) {
    if (validators[validator] != null) return validators[validator]
    else {
      console.warn(`'${validator}' is not a validator function!`)
      return null // caller need to handle null
    }
  }
  return validator
}

function attributesDirective(el, binding, vnode) {
  let attrs = objGet(vnode.context, 'schema.attributes', {})
  const container = binding.value || 'input'
  if (isString(container)) {
    attrs = objGet(attrs, container) || attrs
  }
  forEach(attrs, (val, key) => {
    el.setAttribute(key, val)
  })
}

export default {
  props: ['model', 'schema', 'formOptions', 'disabled', 'focused', 'paragraphLevel', 'paragraphIndex', 'theme'],
  data() {
    return {
      errors: [],
    }
  },
  directives: {
    attributes: {
      bind: attributesDirective,
      updated: attributesDirective,
      componentUpdated: attributesDirective,
    },
  },
  watch: {
    focused() {
      if (this.focused === -1) {
        return
      }
      const elem = objGet(this.$refs, 'input', false)
      const fieldType = objGet(this.schema, 'type', false)
      if (!elem && !includes(['Wysiwyg', 'ImageView', 'AttachmentView'], fieldType)) {
        return console.error('no input ref for ', this.schema)
      }
      if (!isFunction(objGet(elem, 'focus'))) {
        return
      }
      if (this.focused) {
        elem.focus()
      }
    },
  },
  computed: {
    _value: {
      cache: false,
      get() {
        return isFunction(objGet(this.schema, 'get'))
          ? this.schema.get(this.model)
          : objGet(this.model, this.schema.model)
      },
      set(newValue) {
        const oldValue = this._value
        if (isFunction(newValue)) {
          newValue(newValue, oldValue)
        } else {
          this.updateModelValue(newValue, oldValue)
        }
      },
    },
  },
  methods: {
    showHint() {
      return objGet(this.schema, 'options.hint') && !this.errors.length
    },
    onFieldFocus(focused) {
      if (!focused) {
        return FieldSelectorService.highlightParagraph(-1, -1)
      }
      FieldSelectorService.highlightParagraph(this.paragraphLevel - 1, this.paragraphIndex)
    },
    get(key, defaultVal = false) {
      return objGet(this.schema, key, defaultVal)
    },
    getOpt(opt, defaultVal) {
      return objGet(this.schema, `options.${opt}`, defaultVal)
    },
    getVariant() {
      const variant = []
      forEach(['underlined', 'outlined', 'filled', 'solo', 'solo-inverted', 'solo-filled', 'plain'], (key) => {
        if (this.get(key)) {
          variant.push(key)
        }
      })
      return join(variant, ' ')
    },
    onChangeData(data) {
      this._value = data
    },
    async validate(calledParent) {
      this.clearValidationErrors()
      const validateAsync = objGet(this.formOptions, 'validateAsync', false)
      let results = []
      if (this.schema.validator && this.schema.readonly !== true && this.disabled !== true) {
        const validators = []
        if (!isArray(this.schema.validator)) {
          validators.push(convertValidator(this.schema.validator).bind(this))
        } else {
          forEach(this.schema.validator, (validator) => {
            validators.push(convertValidator(validator).bind(this))
          })
        }
        forEach(validators, (validator) => {
          if (validateAsync) {
            results.push(validator(this._value, this.schema, this.model))
          } else {
            const result = validator(this._value, this.schema, this.model)
            if (result && isFunction(result.then)) {
              result.then((err) => {
                if (err) {
                  this.errors = this.errors.concat(err)
                }
                const isValid = this.errors.length === 0
                this.$emit('validated', isValid, this.errors, this)
              })
            } else if (result) {
              results = results.concat(result)
            }
          }
        })
      }
      const handleErrors = (errors) => {
        let fieldErrors = []
        forEach(arrayUniq(errors), (err) => {
          if (isArray(err) && err.length > 0) {
            fieldErrors = fieldErrors.concat(err)
          } else if (isString(err)) {
            fieldErrors.push(err)
          }
        })
        if (isFunction(this.schema.onValidated)) {
          this.schema.onValidated.call(this, this.model, fieldErrors, this.schema)
        }
        const isValid = fieldErrors.length === 0
        if (!calledParent) {
          this.$emit('validated', isValid, fieldErrors, this)
        }
        this.errors = fieldErrors
        return fieldErrors
      }
      if (!validateAsync) {
        return handleErrors(results)
      }
      return Promise.all(results).then(handleErrors)
    },
    async updateModelValue(newValue, oldValue) {
      let changed = false
      if (isFunction(this.schema.set)) {
        this.schema.set(this.model, newValue)
        changed = true
      } else if (this.schema.model) {
        objSet(this.model, this.schema.model, newValue)
        changed = true
      }
      if (changed) {
        if (isFunction(this.schema.onChanged)) {
          this.schema.onChanged.call(this, this.model, newValue, oldValue, this.schema)
        }
        if (objGet(this.formOptions, 'validateAfterChanged', false) === true) {
          await this.validate()
        }
        this.$emit('input', newValue, this.schema.model)
      }
    },
    clearValidationErrors() {
      this.errors.splice(0)
    },
    getKeyLocale() {
      const options = {}
      const list = this.schema.model.split('.')
      if (this.schema.localised) {
        options.locale = list.pop()
      }
      options.key = list.join('.')
      return options
    },
    getFieldClasses() {
      return objGet(this.schema, 'fieldClasses', [])
    },
  },
}
