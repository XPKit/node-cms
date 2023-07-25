<template>
  <div class="custom-input">
    <v-text-field
      :class="[schema.labelClasses]"
      :type="getType()"
      :label="schema.label"
      :value="value"
      :input-value="value"
      :max-length="schema.max"
      :autocomplete="getAutocomplete()"
      :min-length="schema.min"
      :dense="schema.dense ? true : false"
      :compact="schema.compact ? true : false"
      :disabled="schema.disabled ? true : false"
      :readonly="schema.readonly ? true : false"
      :filled="schema.filled ? true : false"
      hide-details
      :rules="[validateField]"
      :outlined="schema.outlined ? true : false"
      :solo="schema.solo ? true : false"
      @input="onChangeData"
    >
      <template v-if="schema.required" #label>
        <span class="red--text"><strong>* </strong></span>{{ schema.label }}
      </template>
    </v-text-field>
  </div>
</template>

<script>
import _ from 'lodash'
import AbstractField from '@m/AbstractField'

export default {
  mixins: [AbstractField],
  data () {
    return {}
  },
  methods: {
    onChangeData (data) {
      this.value = data
    },
    getAutocomplete () {
      return _.get(this.schema, 'inputFieldType', 'text') === 'password' ? 'current-password' : 'null'
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

<style lang="scss">
  .custom-input {

  }
</style>
