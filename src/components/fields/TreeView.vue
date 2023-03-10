<template>
  <tree-view :key="schema.model" :data="_get(model,schema.model)" :options="options" @change-data="onChangeData" />
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
      _.set(this.model, this.schema.model, data)
    },
    _get: _.get
  }

}
</script>
