<template>
  <div class="custom-textarea">
    <v-textarea
      ref="input"
      multi-line
      :class="[schema.labelClasses]"
      :type="getType()"
      :model-value="value"
      :max-length="schema.max"
      :min-length="schema.min"
      :density="schema.density="compact" ? true : false && 'compact'"
      :compact="schema.compact ? true : false"
      :disabled="schema.disabled ? true : false"
      :readonly="schema.readonly ? true : false"
      :variant="schema.filled ? true : false && 'filled'"
      hide-details
      :variant="schema.outlined ? true : false && 'outlined'"
      :variant="schema.solo ? true : false && 'solo'"
      @update:model-value="onChangeData"
    >
      <template #prepend>
        <span v-if="schema.required" class="text-red"><strong>* </strong></span>{{ schema.label }}
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
