<template>
  <wysiwyg :id="editorId()" v-model="obj[key]" :class="{frozen:disabled}" :disabled="disabled" @input="onChange" />
</template>

<script>
import _ from 'lodash'
import { abstractField } from 'vue-form-generator'

export default {
  mixins: [abstractField],
  data () {
    return {
      obj: this.model,
      key: null
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
  methods: {
    updateObj () {
      const list = this.schema.model.split('.')
      this.key = list.pop()
      this.obj = _.reduce(list, (memo, item) => memo[item], this.model)
      this.obj[this.key] = this.obj[this.key] || ''
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
