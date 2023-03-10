<template>
  <div class="custom-input">
    <v-switch
      v-model="model.value"
      :dense="schema.dense ? true : false"
      :compact="schema.compact ? true : false"
      :disabled="schema.disabled ? true : false"
      :readonly="schema.readonly ? true : false"
      :filled="schema.filled ? true : false"
      :hide-details="schema.hideDetails ? true : false"
      :outlined="schema.outlined ? true : false"
      :solo="schema.solo ? true : false"
    />
  </div>
</template>

<script>
// import _ from 'lodash'
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
  }
}
</script>

<style lang="scss">
  .custom-input {

  }
</style>
