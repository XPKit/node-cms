<template>
  <v-combobox
    ref="input"
    v-model="tags"
    clearable hide-details deletable-chips small-chips dense filled rounded
    validate-on-submit :rules="[validateField]"
    :hide-selected="!options['allowDuplicates']" :readonly="options['readOnly']" :placeholder="options['tagPlaceholder']" :multiple="options['multiple']"
    @change="onChangeData"
  >
    <template #prepend>
      <span v-if="schema.required" class="red--text"><strong>* </strong></span>{{ schema.label }}
    </template>
    <template #label />
  </v-combobox>
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
        multiple: this.getOpt('multiple', false)
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
    get (key) {
      return _.get(this.schema, key, false)
    },
    validateField (val) {
      if (this.schema.required && (_.isNull(val) || _.isUndefined(val) || _.isEmpty(val))) {
        return false
      }
      if ((this.schema.selectOptions.min && _.get(val, 'length', 0) < this.schema.selectOptions.min) ||
      (this.schema.selectOptions.max && _.get(val, 'length', 0) > this.schema.selectOptions.max)) {
        return false
      }
      if (this.schema.validator && _.isFunction(this.schema.validator)) {
        return !!this.schema.validator(val, this.schema.model, this.model)
      }
      return true
    },
    onChangeData (value) {
      if (_.get(this.options, 'limit', -1) !== -1) {
        this.value = _.take(value, this.options.limit)
      } else {
        this.value = value
      }
    }
  }
}
</script>
