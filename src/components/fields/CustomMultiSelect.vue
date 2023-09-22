<template>
  <div class="multiselect-wrapper">
    <v-autocomplete
      :id="selectOptions.id"
      ref="input"
      :chips="selectOptions.chips"
      :value="objectValue"
      :items="formattedOptions"
      :deletable-chips="selectOptions.deletableChips"
      :hide-selected="selectOptions.hideSelected"
      :disabled="disabled || schema.disabled"
      :placeholder="schema.placeholder"
      :multiple="selectOptions.multiple"
      :clearable="selectOptions.clearable"
      filled dense rounded hide-details append-icon="mdi-chevron-down"
      @change="updateSelected"
      @search-change="onSearchChange"
      @tag="addTag"
    >
      <template #prepend>
        <span v-if="schema.required" class="red--text"><strong>* </strong></span>{{ getLabel() }}
      </template>
      <template #label />
      <!-- <template #selection="{index}">
        <span v-if="index === objectValue.length - 1">{{ 'TL_NB_SELECTED_ITEMS' | translate(null, { num: objectValue.length }) }}</span>
      </template> -->
    </v-autocomplete>
  </div>
</template>
<script>
import _ from 'lodash'
import AbstractField from '@m/AbstractField'

export default {
  mixins: [AbstractField],
  data () {
    return {
      objectValue: this.value
    }
  },
  computed: {
    selectOptions () {
      return this.schema.selectOptions || {}
    },
    options () {
      let values = this.schema.values
      if (typeof (values) === 'function') {
        return values.apply(this, [this.model, this.schema])
      }
      return values
    },
    formattedOptions () {
      const formattedOptions = this.selectOptions.label || this.options
      if (_.isString(_.first(formattedOptions))) {
        return formattedOptions
      }
      const customLabel = this.customLabel
      if (!_.isFunction(this.customLabel)) {
        return formattedOptions
      }
      return _.map(formattedOptions, (option) => {
        const optionLabel = customLabel(option)
        if (_.isString(optionLabel)) {
          option.text = optionLabel
        }
        if (_.isUndefined(_.get(option, 'value', undefined))) {
          option.value = _.get(option, '_id', undefined)
        }
        return option
      })
    },
    hasCustomLabel () {
      const selectOptions = _.get(this.schema, 'selectOptions')
      return typeof selectOptions !== 'undefined' && typeof selectOptions.customLabel !== 'undefined' && typeof selectOptions.customLabel === 'function'
    },
    customLabel () {
      if (_.isString(_.first(this.options))) {
        return this.options
      }
      if (!this.hasCustomLabel) {
        // this will let the multiselect library use the default behavior if customLabel is not specified
        return 'text'
      }
      return this.schema.selectOptions.customLabel
    }
  },
  methods: {
    getLabel () {
      if (this.disabled) {
        return ''
      }
      if (!_.isString(this.selectOptions.label)) {
        return this.schema.label
      }
      return this.selectOptions.label
    },
    updateSelected (value) {
      this.objectValue = value
      const key = _.get(this.schema, 'selectOptions.key')
      if (key) {
        if (_.isString(this.objectValue)) {
          this.value = this.objectValue
        } else {
          this.value = _.get(this.objectValue, key)
        }
      } else {
        this.value = this.objectValue
      }
      this.$emit('input', value, this.schema.model)
    },
    addTag (newTag, id) {
      const onNewTag = this.selectOptions.onNewTag
      if (typeof onNewTag === 'function') {
        onNewTag(newTag, id, this.options, this.objectValue)
      }
    },
    onSearchChange (searchQuery, id) {
      const onSearch = this.selectOptions.onSearch
      if (typeof onSearch === 'function') {
        onSearch(searchQuery, id, this.options)
      }
    }
  }
}
</script>
