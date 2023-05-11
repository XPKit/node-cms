<template>
  <!-- TODO: hugo - handle limit -->
  <v-combobox
    clearable
    :hide-selected="!options['allow-duplicates']"
    :readonly="options['read-only']"
    :placeholder="options['tagPlaceholder']"
    dense
    multiple
    outlined
    small-chips
  />
  <!-- <input-tag
    v-model="tags"
    :allow-duplicates="options['allow-duplicates']"
    :limit="options['limit']"
    :read-only="options['read-only']"
    :placeholder="options['tagPlaceholder']"
    :add-tag-on-keys="options['add-tag-on-keys']"
  /> -->
</template>

<script>
import _ from 'lodash'
import AbstractField from '@m/AbstractField'

export default {
  mixins: [AbstractField],
  props: ['locale'],
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
