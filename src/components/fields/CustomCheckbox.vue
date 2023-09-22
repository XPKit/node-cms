<template>
  <div class="custom-checkbox">
    <div class="field-label">{{ schema.label }}</div>
    <div class="border-wrapper">
      <v-checkbox
        ref="input"
        class="switch"
        :input-value="getValue()"
        :compact="schema.compact ? true : false"
        :disabled="schema.disabled ? true : false"
        :readonly="schema.readonly ? true : false"
        :filled="schema.filled ? true : false"
        dense hide-details solo
        :outlined="schema.outlined ? true : false"
        @change="onChange"
      />
    </div>
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
  computed: {
  },
  created () {
  },
  methods: {
    getValue () {
      const value = _.get(this.model, this.schema.model, false)
      return _.isNull(value) ? false : value
    },
    onChange (event) {
      this.$emit('input', event, this.schema.model)
    }
  }
}
</script>

<style lang="scss">
  .custom-checkbox {
    .switch {
      padding-top: 8px;
      margin: 16px;
      margin-bottom: 8px;
    }
    .v-input--selection-controls {
      margin-top: 0;
    }
  }
</style>
