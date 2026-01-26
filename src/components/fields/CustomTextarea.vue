<template>
  <div class="custom-textarea">
    <v-textarea
      ref="input" multi-line :class="[schema.labelClasses]" :type="getType()" :model-value="_value" :max-length="schema.max" :min-length="schema.min"
      :density="get('density')" :flat="get('flat')" :disabled="schema.disabled ? true : false" :readonly="schema.readonly ? true : false" :rules="[validateField]"
      hide-details :variant="getVariant()" rounded="get('rounded')" @update:model-value="onChangeData" @update:focused="onFieldFocus"
    >
      <template #prepend><field-label :schema="schema" /></template>
    </v-textarea>
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
      }
      if (_.isFunction(this.schema.validator)) {
        return !!this.schema.validator(val, this.schema.model, this.model)
      }
      return true
    },
  },
}
</script>

<style lang="scss">
@use '@a/scss/variables.scss' as *;
@use '@a/scss/mixins.scss' as *;
  .custom-textarea {
    .v-field__input {
      padding-top: 8px;
    }
    textarea {
      @include textarea-text;
    }
  }
</style>
