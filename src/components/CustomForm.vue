<template>
  <div v-if="schema != null" class="vue-form-generator">
    <fieldset v-if="schema.fields">
      <div v-for="field in schema.fields" :key="field.model" class="field-wrapper">
        <component :is="getFieldType(field)" :key="field.model" :schema="field" :model="model" :form-options="formOptions" :disabled="disabled" @input="onInput" />
      </div>
    </fieldset>
  </div>
</template>
<script>
import _ from 'lodash'

export default {
  components: {
  },
  props: ['schema', 'model', 'row', 'formOptions', 'disabled'],
  data () {
    return {
    }
  },
  computed: {
  },
  created () {
    this.checkIfComponentsExist()
  },
  methods: {
    getFieldType (field) {
      return _.get(field, 'overrideType', _.get(field, 'type', false))
    },
    onInput (value, model) {
      if (_.isUndefined(model)) {
        model = _.get(_.first(value), 'parentKey', false)
      }
      console.warn('CUSTOM FORM - onInput', value, model)
      this.$emit('input', value, model)
    },
    checkIfComponentsExist () {
      _.each(this.schema.fields, (field) => {
        // console.warn(`field = ${field.model}`, field)
        const fieldType = this.getFieldType(field)
        if (!(fieldType in Vue.options.components)) {
          console.error(`${fieldType} isn't defined as a custom field type, will not render it`)
        }
      })
    }
  }
}
</script>
