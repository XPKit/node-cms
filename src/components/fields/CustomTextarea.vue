<template>
  <div class="custom-textarea">
    <v-textarea
      ref="input" multi-line :class="[schema.labelClasses]" :type="getType()" :model-value="_value" :max-length="schema.max" :min-length="schema.min"
      :density="get('density')" :flat="get('flat')" :disabled="schema.disabled ? true : false" :readonly="schema.readonly ? true : false"
      hide-details :variant="getVariant()" rounded="get('rounded')" @update:model-value="onChangeData" @update:focused="onFieldFocus"
    >
      <template #prepend><field-label :schema="schema" /></template>
    </v-textarea>
  </div>
</template>

<script>
import _ from 'lodash'
import AbstractField from '@m/AbstractField'

export default {
  mixins: [AbstractField],
  methods: {
    getType () {
      return _.get(this.schema, 'inputFieldType', 'text')
    }
  }
}
</script>

<style lang="scss">
@import '@a/scss/variables.scss';
  .custom-textarea {
    .v-field__input {
      padding-top: 8px;
    }
    textarea {
      @include textarea-text;
    }
  }
</style>
