<template>
  <div class="wysiwyg-wrapper">
    <div class="label">{{ schema.label }}</div>
    <wysiwyg v-if="loaded" :id="editorId()" v-model="localObj[key]" :class="{frozen:disabled}" :disabled="disabled" @input="onChange" />
  </div>
</template>

<script>
import _ from 'lodash'
import AbstractField from '@m/AbstractField'

export default {
  mixins: [AbstractField],
  data () {
    return {
      localObj: this.model,
      loaded: false,
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
  created () {
  },
  methods: {
    updateObj () {
      if (!_.get(this.schema, 'model', false)) {
        return false
      }
      const list = this.schema.model.split('.')
      this.key = list.pop()
      this.localObj = _.reduce(list, (memo, item) => {
        return memo[item]
      }, this.model)
      this.localObj[this.key] = this.localObj[this.key] || ''
      this.loaded = true
    },
    onChange () {
      this.$emit('input', this.localObj[this.key], this.schema.model)
      // work around to force label update
      const dummy = this.schema.label
      this.schema.label = null
      this.schema.label = dummy
    },
    editorId () {
      if (!_.get(this.schema, 'model', false)) {
        return false
      }
      return this.schema.model.replace(/\./g, '_')
    }
  }
}
</script>
