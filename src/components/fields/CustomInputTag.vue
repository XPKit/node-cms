<template>
  <v-combobox
    ref="input"
    :theme="theme" :class="[schema.labelClasses]" :type="getType()" :model-value="value" :input-value="value"
    :max-length="schema.max" :min-length="schema.min" autocomplete="off" validate-on-submit :rules="[validateField]" persistent-placeholder hide-details chips multiple
    :variant="getVariant()" :flat="get('flat')" :rounded="get('rounded')" :density="get('density')" :disabled="disabled" :readonly="get('readonly')" clearable
    @update:model-value="onChangeData"
  >
    <template #prepend><field-label :schema="schema" /></template>
    <template #label />
  </v-combobox>
</template>

<script>
import _ from 'lodash'
import AbstractField from '@m/AbstractField'

export default {
  mixins: [AbstractField],
  methods: {
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
