<template>
  <div class="custom-input">
    <v-text-field
      :class="[schema.labelClasses]"
      :type="getType()"
      :value="value"
      :max-length="schema.max"
      :min-length="schema.min"
      :dense="schema.dense ? true : false"
      :compact="schema.compact ? true : false"
      :disabled="schema.disabled ? true : false"
      :readonly="schema.readonly ? true : false"
      :filled="schema.filled ? true : false"
      :hide-details="schema.hideDetails ? true : false"
      :outlined="schema.outlined ? true : false"
      :solo="schema.solo ? true : false"
      @input="onChangeData"
    />
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
  .custom-input {

  }
</style>
