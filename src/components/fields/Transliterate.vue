<template>
  <v-text-field
    ref="input"
    :theme="theme"
    :class="[schema.labelClasses]"
    :model-value="_value"
    :readonly="isReadonly"
    autocomplete="off"
    :variant="getVariant()"
    :flat="get('flat')"
    :rounded="get('rounded')"
    :density="get('density')"
    :disabled="disabled"
    persistent-placeholder
    hide-details
    @update:model-value="onChangeData"
  >
    <template #prepend><field-label :schema="schema" /></template>
    <template #label />
  </v-text-field>
</template>

<script>
  import _ from 'lodash'
  import { slugify } from 'transliteration'
  import AbstractField from '@m/AbstractField'

  export default {
    mixins: [AbstractField],
    data() {
      return {
        userHasEdited: false // Track if user has manually edited the field
      }
    },
    computed: {
      // Check if field should be readonly (default true)
      isReadonly() {
        return this.getOpt('readonly', true)
      },
      // Get the value from the source field specified in options.valueFrom
      sourceValue() {
        const sourceField = this.getOpt('valueFrom')
        if (!sourceField) {
          console.warn('Transliterate field requires options.valueFrom to be specified')
          return ''
        }
        return _.get(this.model, sourceField, '')
      },
      // Check if the transliterate field is empty
      isFieldEmpty() {
        return !this._value || this._value.trim() === ''
      }
    },
    watch: {
      // Watch for changes in the source field
      sourceValue: {
        handler(newValue) {
          // Only auto-update if:
          // 1. Field is readonly, OR
          // 2. Field is editable but user hasn't edited it yet, OR
          // 3. Field is editable but currently empty
          if (this.isReadonly || !this.userHasEdited || this.isFieldEmpty) {
            if (newValue && newValue.trim() !== '') {
              // Use transliteration to create a slug
              const slugified = slugify(newValue, {
                lowercase: true,
                separator: '-',
              })
              this.updateModelValue(slugified)
            } else {
              // If source field is empty, clear the transliterate field too
              this.updateModelValue('')
            }
          }
        },
        immediate: true
      },
      // Watch for changes in the field value to reset userHasEdited when empty
      _value: {
        handler(newValue) {
          // If field becomes empty and it's editable, reset the userHasEdited flag
          // so it can start auto-updating again
          if (!this.isReadonly && (!newValue || newValue.trim() === '')) {
            this.userHasEdited = false
          }
        }
      }
    },
    methods: {
      onChangeData(data) {
        // Mark that user has manually edited the field
        if (!this.isReadonly) {
          this.userHasEdited = true
        }
        // Update the model value properly to trigger reactivity
        this.updateModelValue(data)
      }
    }
  }
</script>
