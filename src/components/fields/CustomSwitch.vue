<template>
  <div class="custom-switch">
    <v-switch
      :label="schema.disabled ? '' : schema.model"
      :input-value="getValue()"
      :compact="schema.compact ? true : false"
      :disabled="schema.disabled ? true : false"
      :readonly="schema.readonly ? true : false"
      :filled="schema.filled ? true : false"
      dense
      hide-details
      solo
      :outlined="schema.outlined ? true : false"
      @change="onChange"
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
  .custom-switch {
    .v-input--selection-controls {
      margin-top: 0;
    }
  }
</style>
