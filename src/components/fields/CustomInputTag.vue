<template>
  <v-combobox
    v-model="tags"
    clearable
    :hide-selected="!options['allowDuplicates']"
    :readonly="options['readOnly']"
    :placeholder="options['placeholder']"
    :multiple="options['multiple']"
    dense
    outlined
    small-chips
    deletable-chips
    @change="onChangeData"
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
        allowDuplicates: this.getOpt('allowDuplicates', true),
        readOnly: this.getOpt('disabled', false),
        placeholder: this.getOpt('placeholder', ''),
        dense: this.getOpt('dense', false),
        multiple: this.getOpt('multiple', false),
        outlined: this.getOpt('outlined', false),
        deletableChips: this.getOpt('deletableChips', false),
        smallChips: this.getOpt('smallChips', false),
        limit: this.getOpt('limit', -1)
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
    onChangeData (value) {
      if (_.get(this.options, 'limit', -1) !== -1) {
        this.value = _.take(value, this.options.limit)
      } else {
        this.value = value
      }
      console.warn('value = ', this.value)
    }
  }
}
</script>
