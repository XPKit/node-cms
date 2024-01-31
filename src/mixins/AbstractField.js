import { get as objGet, set as objSet, join, forEach, isFunction, isString, isArray, debounce, uniqueId, uniq as arrayUniq } from 'lodash'
import validators from '@u/validators'
import { slugifyFormID } from '@u/schema'

function convertValidator (validator) {
  if (isString(validator)) {
    if (validators[validator] != null) return validators[validator]
    else {
      console.warn(`'${validator}' is not a validator function!`)
      return null // caller need to handle null
    }
  }
  return validator
}

function attributesDirective (el, binding, vnode) {
  let attrs = objGet(vnode.context, 'schema.attributes', {})
  let container = binding.value || 'input'
  if (isString(container)) {
    attrs = objGet(attrs, container) || attrs
  }
  forEach(attrs, (val, key) => {
    el.setAttribute(key, val)
  })
}

export default {
  props: ['model', 'schema', 'formOptions', 'disabled', 'focused'],
  data () {
    return {
      errors: [],
      debouncedValidateFunc: null,
      debouncedFormatFunc: null
    }
  },
  directives: {
    attributes: {
      bind: attributesDirective,
      updated: attributesDirective,
      componentUpdated: attributesDirective
    }
  },
  watch: {
    focused () {
      if (this.focused === -1) {
        return
      }
      let elem = objGet(this.$refs, 'input', false)
      if (!elem) {
        return console.error('no input ref for ', this.schema)
      }
      // console.warn('elem = ', elem, this.schema.model, this.schema)
      if (!isFunction(elem.focus)) {
        // console.info('Cannot focus element', elem)
        return
      }
      if (this.focused) {
        elem.focus()
      }
      // console.warn(`focused changed ${this.focused}`, this.schema, elem)
      // return this.focused ? elem.focus() : elem.blur()
    }
  },
  computed: {
    value: {
      cache: false,
      get () {
        if (isFunction(objGet(this.schema, 'get'))) {
          return this.schema.get(this.model)
        }
        return objGet(this.model, this.schema.model)
      },
      set (newValue) {
        let oldValue = this.value
        if (isFunction(newValue)) {
          newValue(newValue, oldValue)
        } else {
          // console.warn(`UPDATE VAL ${this.schema.model}`, newValue)
          this.updateModelValue(newValue, oldValue)
        }
      }
    }
  },
  methods: {
    get (key) {
      return objGet(this.schema, key, false)
    },
    getOpt (opt, defaultVal) {
      return objGet(this.schema, `options.${opt}`, defaultVal)
    },
    getVariant () {
      let variant = []
      forEach(['underlined', 'outlined', 'filled', 'solo', 'solo-inverted', 'solo-filled', 'plain'], (key) => {
        if (this.get(key)) {
          variant.push(key)
        }
      })
      return join(variant, ' ')
    },
    validate (calledParent) {
      this.clearValidationErrors()
      let validateAsync = objGet(this.formOptions, 'validateAsync', false)
      let results = []
      if (this.schema.validator && this.schema.readonly !== true && this.disabled !== true) {
        let validators = []
        if (!isArray(this.schema.validator)) {
          validators.push(convertValidator(this.schema.validator).bind(this))
        } else {
          forEach(this.schema.validator, validator => {
            validators.push(convertValidator(validator).bind(this))
          })
        }
        forEach(validators, validator => {
          if (validateAsync) {
            results.push(validator(this.value, this.schema, this.model))
          } else {
            let result = validator(this.value, this.schema, this.model)
            if (result && isFunction(result.then)) {
              result.then(err => {
                if (err) {
                  this.errors = this.errors.concat(err)
                }
                let isValid = this.errors.length === 0
                this.$emit('validated', isValid, this.errors, this)
              })
            } else if (result) {
              results = results.concat(result)
            }
          }
        })
      }
      let handleErrors = (errors) => {
        let fieldErrors = []
        forEach(arrayUniq(errors), err => {
          if (isArray(err) && err.length > 0) {
            fieldErrors = fieldErrors.concat(err)
          } else if (isString(err)) {
            fieldErrors.push(err)
          }
        })
        if (isFunction(this.schema.onValidated)) {
          this.schema.onValidated.call(this, this.model, fieldErrors, this.schema)
        }
        let isValid = fieldErrors.length === 0
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
    debouncedValidate () {
      if (!isFunction(this.debouncedValidateFunc)) {
        this.debouncedValidateFunc = debounce(
          this.validate.bind(this),
          objGet(this.schema, 'validateDebounceTime', objGet(this.formOptions, 'validateDebounceTime', 500))
        )
      }
      this.debouncedValidateFunc()
    },
    updateModelValue (newValue, oldValue) {
      let changed = false
      if (isFunction(this.schema.set)) {
        this.schema.set(this.model, newValue)
        changed = true
      } else if (this.schema.model) {
        this.setModelValueByPath(this.schema.model, newValue)
        changed = true
      }
      if (changed) {
        // console.warn(`value for '${this.schema.model}' changed to `, newValue)
        if (isFunction(this.schema.onChanged)) {
          this.schema.onChanged.call(this, this.model, newValue, oldValue, this.schema)
        }
        if (objGet(this.formOptions, 'validateAfterChanged', false) === true) {
          if (objGet(this.schema, 'validateDebounceTime', objGet(this.formOptions, 'validateDebounceTime', 0)) > 0) {
            this.debouncedValidate()
          } else {
            this.validate()
          }
        }
        this.$emit('input', newValue, this.schema.model)
      }
    },
    clearValidationErrors () {
      this.errors.splice(0)
    },
    setModelValueByPath (path, value) {
      // convert array indexes to properties
      let s = path.replace(/\[(\w+)\]/g, '.$1')
      // strip a leading dot
      s = s.replace(/^\./, '')
      let o = this.model
      const a = s.split('.')
      let i = 0
      const n = a.length
      while (i < n) {
        let k = a[i]
        if (i < n - 1) {
          if (o[k] !== undefined) {
          // Found parent property. Step in
            o = o[k]
          } else {
          // Create missing property (new level)
            // TODO: hugo - check if it works properly with nested props
            objSet(this.model, k, {})
            // this.$root.$set(o, k, {})
            o = o[k]
          }
        } else {
          // Set final property value
          // TODO: hugo - check if it works properly with nested props
          objSet(this.model, k, value)
          // this.$root.$set(o, k, value)
          return
        }
        ++i
      }
    },
    getKeyLocale () {
      const options = {}
      const list = this.schema.model.split('.')
      if (this.schema.localised) {
        options.locale = list.shift()
      }
      options.key = list.join('.')
      return options
    },
    getFieldID (schema, unique = false) {
      const idPrefix = objGet(this.formOptions, 'fieldIdPrefix', '')
      return slugifyFormID(schema, idPrefix) + (unique ? '-' + uniqueId() : '')
    },
    getFieldClasses () {
      return objGet(this.schema, 'fieldClasses', [])
    }
  }
}
