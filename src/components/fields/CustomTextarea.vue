<template>
  <div class="custom-textarea">
    <v-textarea
      ref="input" multi-line :class="[schema.labelClasses]" :type="getType()" :model-value="value" :max-length="schema.max" :min-length="schema.min"
      :density="get('density')" :flat="get('flat')" :disabled="schema.disabled ? true : false" :readonly="schema.readonly ? true : false"
      hide-details :variant="getVariant()" @update:model-value="onChangeData"
    >
      <template #prepend><field-label v-if="paragraphLevel == 1" :schema="schema" /></template>
    </v-textarea>
  </div>
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
    }
  }
}
</script>

<style lang="scss">
  .custom-textarea {
    .v-field__input {
      padding-top: 8px;
    }
  }
</style>
