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
      density="compact"
      :compact="schema.compact ? true : false"
      :disabled="schema.disabled ? true : false"
      :readonly="schema.readonly ? true : false"
      hide-details
      :variant="getVariant()"
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
    },
    getVariant () {
      if (_.get(this.schema, 'filled', false)) {
        return 'filled'
      }
      if (_.get(this.schema, 'outlined', false)) {
        return 'outlined'
      }
      return ''
    }
  }
}
</script>

<style lang="scss">
  .custom-textarea {

  }
</style>
