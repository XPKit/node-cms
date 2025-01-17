<template>
  <v-combobox
    ref="input"
    :theme="theme" :class="[schema.labelClasses]" :type="getType()" :model-value="_value" :input-value="_value"
    :max-length="schema.max" :min-length="schema.min" autocomplete="off" validate-on-submit :rules="[validateField]" persistent-placeholder hide-details chips closable-chips multiple
    :variant="getVariant()" :flat="get('flat')" :rounded="get('rounded')" :density="get('density')" :disabled="disabled" :readonly="get('readonly')" clearable
    @update:model-value="onChangeData" @update:focused="onFieldFocus"
  >
    <template #prepend><field-label :schema="schema" /></template>
    <template #label />
    <template #chip="{ props, item }">
      <v-chip
        v-bind="props"
        @contextmenu.stop.prevent="copyToClipboard(item.value)"
      />
    </template>
  </v-combobox>
</template>

<script>
import _ from 'lodash'
import AbstractField from '@m/AbstractField'
import Notification from '@m/Notification'

export default {
  mixins: [AbstractField, Notification],
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
    },
    copyToClipboard(value) {
      navigator.clipboard.writeText(value)
      this.notify('Value has been copied.')
    }
  }
}
</script>

<style lang="scss">
.v-field {
  .v-chip {
    &:hover {
      background: rgba(0,0,0,.25);
      cursor: copy;
    }
  }
}
</style>
