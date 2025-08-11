<template>
  <v-combobox
    ref="input"
    :theme="theme" :class="[schema.labelClasses]" :type="getType()" :model-value="_value" :input-value="_value"
    :max-length="schema.max" :min-length="schema.min" autocomplete="off" validate-on-submit :rules="[validateField]" persistent-placeholder hide-details chips closable-chips multiple
    :variant="getVariant()" :flat="get('flat')" :rounded="get('rounded')" :density="get('density')" :disabled="disabled" :readonly="get('readonly')" clearable
    @update:model-value="onChangeData" @update:focused="onFieldFocus" @paste="onPaste"
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
      },
      onChangeData(newValue) {
        // Process the new value to handle comma-separated strings
        const processedValue = this.processCommaSeparatedValues(newValue)
        this.$emit('input', processedValue, this.schema.model)
      },
      onPaste(event) {
        // Handle paste event to automatically split comma-separated values
        event.preventDefault()
        const pastedText = (event.clipboardData || window.clipboardData).getData('text')

        if (pastedText && pastedText.includes(',')) {
          // Split by comma and clean up the values
          const newTags = pastedText
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)

          // Merge with existing values, avoiding duplicates
          const currentValues = this._value || []
          const mergedValues = [...currentValues, ...newTags.filter(tag => !currentValues.includes(tag))]

          this.$emit('input', mergedValues, this.schema.model)
        } else {
          // If no comma, treat as single tag
          const currentValues = this._value || []
          const trimmedText = pastedText.trim()
          if (trimmedText && !currentValues.includes(trimmedText)) {
            this.$emit('input', [...currentValues, trimmedText], this.schema.model)
          }
        }
      },
      processCommaSeparatedValues(value) {
        if (!value || !Array.isArray(value)) {
          return value
        }

        const processedValues = []

        value.forEach(item => {
          if (typeof item === 'string' && item.includes(',')) {
            // Split comma-separated string into individual tags
            const splitTags = item
              .split(',')
              .map(tag => tag.trim())
              .filter(tag => tag.length > 0)
            processedValues.push(...splitTags)
          } else {
            processedValues.push(item)
          }
        })

        // Remove duplicates
        return [...new Set(processedValues)]
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
