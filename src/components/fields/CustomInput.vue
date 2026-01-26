<template>
  <div class="custom-input">
    <v-text-field
      ref="input"
      :theme="theme" :class="[schema.labelClasses]" :type="getType()" :model-value="_value"
      :max-length="schema.max" :min-length="schema.min" autocomplete="off" validate-on-submit :rules="[validateField]"
      :variant="getVariant()" :flat="get('flat')" :rounded="get('rounded')" :density="get('density')" :disabled="disabled" :readonly="get('readonly')"
      persistent-placeholder hide-details @update:model-value="onChangeData" @update:focused="onFieldFocus"
    >
      <template #prepend><field-label :schema="schema" /></template>
      <template #label />
    </v-text-field>
    <div v-if="showHint()" class="help-block">
      <v-icon size="small" icon="$information" />
      <span>{{ schema.options.hint }}</span>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import AbstractField from '@m/AbstractField'

export default {
  mixins: [AbstractField],
  methods: {
    getType() {
      return _.get(this.schema, 'inputFieldType', 'text')
    },
    validateField(val) {
      if (this.schema.required && (_.isNull(val) || _.isUndefined(val) || val === '')) {
        return false
      } else if (_.isFunction(this.schema.validator)) {
        return !!this.schema.validator(val, this.schema.model, this.model)
      }
      return true
    },
  },
}
</script>
