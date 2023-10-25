<template>
  <tree-view v-if="schema" ref="input" :key="schema.model" :data="get(model,schema.model)" :options="options" @change-data="onChangeData" />
</template>

<script>
import _ from 'lodash'
import AbstractField from '@m/AbstractField'

export default {
  mixins: [AbstractField],
  data () {
    return {
      options: {
        maxDepth: 0,
        modifiable: !this.disabled,
        rootObjectKey: this.schema.model
      }
    }
  },
  watch: {
    'schema.model': function () {
      this.options.rootObjectKey = this.schema.model
    }
  },
  methods: {
    onChangeData (data) {
      console.warn('onChangeData - ', data)
      _.set(this.model, _.get(this.schema, 'model', false), data)
    },
    get: _.get
  }

}
</script>
