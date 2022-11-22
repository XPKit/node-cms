<template>
  <tree-view :key="schema.model" :data="_get(model,schema.model)" :options="options" @change-data="onChangeData"></tree-view>
</template>

<script>
  import _ from 'lodash'
  import { abstractField } from 'vue-form-generator'

export default {
    mixins: [abstractField],
    methods: {
      onChangeData(data) {
        _.set(this.model, this.schema.model, data)
      },
      _get: _.get
    },
    watch: {
      'schema.model': function () {
        this.options.rootObjectKey = this.schema.model
      }
    },
    data() {
      return {
        options: {
          maxDepth: 0,
          modifiable: !this.disabled,
          rootObjectKey: this.schema.model
        }
      }
    }

  }
</script>
