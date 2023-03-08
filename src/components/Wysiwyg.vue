<template>
  <wysiwyg :id="editorId()" v-model="localObj[key]" :class="{frozen:disabled}" :disabled="disabled" @input="onChange" />
</template>

<script>
import _ from 'lodash'

export default {
  props: ['obj', 'vfg', 'model', 'disabled'],
  data () {
    return {
      localObj: this.model,
      key: null,
      schema: _.get(this.obj, 'schema', {})
    }
  },
  watch: {
    model () {
      this.updateObj()
    }
  },
  mounted () {
    this.updateObj()
  },
  created () {
    this.schema = _.cloneDeep(this.obj.schema)
  },
  methods: {
    updateObj () {
      const list = this.schema.model.split('.')
      this.key = list.pop()
      this.localObj = _.reduce(list, (memo, item) => memo[item], this.model)
      this.localObj[this.key] = this.localObj[this.key] || ''
    },
    onChange () {
      this.$emit('model-updated', this.obj[this.key], this.schema.model)

      // work around to force label update
      const dummy = this.schema.label
      this.schema.label = null
      this.schema.label = dummy
    },
    editorId () {
      return this.schema.model.replace(/\./g, '_')
    }
  }
}
</script>
