<template>
  <div class="multiselect-wrapper">
    <v-autocomplete
      :id="selectOptions.id"
      :label="getLabel()"
      :chips="selectOptions.multiple"
      :value="objectValue"
      :items="formattedOptions"
      :deletable-chips="selectOptions.multiple"
      clearable
      outlined
      dense
      :hide-selected="selectOptions.hideSelected"
      :disabled="disabled"
      hide-details
      :placeholder="schema.placeholder"
      :multiple="selectOptions.multiple"
      @change="updateSelected"
      @search-change="onSearchChange"
      @tag="addTag"
    />
    <!-- <multiselect
      :id="selectOptions.id"
      :options="options"
      :value="objectValue"
      :multiple="selectOptions.multiple"
      :track-by="selectOptions.trackBy || null"
      :label="getLabel()"
      :searchable="selectOptions.searchable"
      :clear-on-select="selectOptions.clearOnSelect"
      :hide-selected="selectOptions.hideSelected"
      :placeholder="schema.placeholder"
      :allow-empty="selectOptions.allowEmpty"
      :reset-after="selectOptions.resetAfter"
      :close-on-select="selectOptions.closeOnSelect"
      :custom-label="customLabel"
      :taggable="selectOptions.taggable"
      :tag-placeholder="selectOptions.tagPlaceholder"
      :max="schema.max || null"
      :options-limit="selectOptions.optionsLimit"
      :group-values="selectOptions.groupValues"
      :group-label="selectOptions.groupLabel"
      :block-keys="selectOptions.blockKeys"
      :internal-search="selectOptions.internalSearch"
      :select-label="selectOptions.selectLabel"
      :selected-label="selectOptions.selectedLabel"
      :deselect-label="selectOptions.deselectLabel"
      :show-labels="selectOptions.showLabels"
      :limit="selectOptions.limit"
      :limit-text="selectOptions.limitText"
      :loading="selectOptions.loading"
      :disabled="disabled"
      :max-height="selectOptions.maxHeight"
      :show-pointer="selectOptions.showPointer"
      :option-height="selectOptions.optionHeight"
      @input="updateSelected"
      @select="onSelect"
      @remove="onRemove"
      @search-change="onSearchChange"
      @tag="addTag"
      @open="onOpen"
      @close="onClose"
    >
      <span slot="noResult">{{ selectOptions.noResult }}</span>
      <span slot="maxElements">{{ selectOptions.maxElements }}</span>
    </multiselect> -->
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
      // console.warn('computed - selectOptions - ', this.value, this.model)
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
    updateSelected (value /* , id */) {
      this.objectValue = value
      const key = _.get(this.schema, 'selectOptions.key')
      if (key) {
        this.value = _.get(this.objectValue, key)
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
