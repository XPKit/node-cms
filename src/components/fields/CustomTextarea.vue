<template>
  <div class="custom-textarea">
    <v-textarea
      ref="input"
      multi-line
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
      hide-details
      :outlined="schema.outlined ? true : false"
      :solo="schema.solo ? true : false"
      @input="onChangeData"
    >
      <template #prepend>
        <span v-if="schema.required" class="red--text"><strong>* </strong></span>{{ schema.label }}
      </template>
      <template #label />
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

  }
</style>
