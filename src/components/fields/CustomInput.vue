<template>
  <v-text-field
    ref="input"
    :class="[schema.labelClasses]" :type="getType()" :model-value="value"
    :max-length="schema.max" :min-length="schema.min" autocomplete="off"
    validate-on-submit :rules="[validateField]"
    :flat="get('flat')"
    :variant="getVariant()" elevation="0" :rounded="get('rounded')" :density="get('density')" :disabled="disabled" :readonly="get('readonly')"
    persistent-placeholder hide-details
    @update:model-value="onChangeData"
  >
    <template #prepend>
      <span v-if="schema.required" class="text-red"><strong>* </strong></span>{{ schema.label }}
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
    }
  },
  methods: {
    onChangeData (data) {
      this.value = data
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
