<template>
  <v-text-field
    ref="input"
    :class="[schema.labelClasses]" :type="getType()" :value="value" :input-value="value"
    :max-length="schema.max" :min-length="schema.min" autocomplete="off"
    validate-on-submit :rules="[validateField]"
    :filled="get('filled')" :rounded="get('rounded')" :dense="get('dense')" :compact="get('compact')" :disabled="disabled" :readonly="get('readonly')" :outlined="get('outlined')"
    persistent-placeholder hide-details
    @input="onChangeData"
  >
    <template #prepend>
      <span v-if="schema.required" class="red--text"><strong>* </strong></span>{{ schema.label }}
    </template>
    <template #label />
  </v-text-field>
</template>

<script>
import _ from 'lodash'
import AbstractField from '@m/AbstractField'

export default {
  mixins: [AbstractField],
  data () {
    return {
      rules: []
    }
  },
  methods: {
    onChangeData (data) {
      this.value = data
    },
    get (key) {
      return _.get(this.schema, key, false)
    },
    getType () {
      return _.get(this.schema, 'inputFieldType', 'text')
    },
    validateField (val) {
      if (this.schema.required && (_.isNull(val) || _.isUndefined(val) || val === '')) {
        return false
      }
      if (this.schema.validator && _.isFunction(this.schema.validator)) {
        return !!this.schema.validator(val, this.schema.model, this.model)
      }
      return true
    }
  }
}
</script>
