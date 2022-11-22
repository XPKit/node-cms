<template>
  <input-tag v-model="tags"
             :allow-duplicates="options['allow-duplicates']"
             :limit="options['limit']"
             :read-only="options['read-only']"
             :placeholder="options['tagPlaceholder']"
             :add-tag-on-keys="options['add-tag-on-keys']"
  />
</template>

<script>
import InputTag from 'vue-input-tag'
import _ from 'lodash'
import { abstractField } from 'vue-form-generator'

export default {
  components: {
    inputTag: InputTag
  },
  mixins: [abstractField],
  props: [
    'locale'
  ],
  data () {
    return {
      tags: [],
      options: {
        'allow-duplicates': true
      }
    }
  },
  watch: {
    tags () {
      _.set(this.model, this.schema.model, this.tags)
    },
    'schema.model': function () {
      this.tags = _.get(this.model, this.schema.model)
    }
  },
  created () {
    this.options = _.extend(this.options, this.schema.selectOptions)
  },
  mounted () {
    this.tags = _.get(this.model, this.schema.model)
  },
  methods: {
  }
}
</script>
