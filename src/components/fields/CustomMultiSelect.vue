<template>
  <div class="multiselect-wrapper">
    <v-autocomplete
      :id="selectOptions.id"
      ref="input"
      :chips="selectOptions.chips"
      :value="objectValue"
      :items="formattedOptions"
      :deletable-chips="selectOptions.deletableChips || selectOptions.multiple"
      :hide-selected="selectOptions.hideSelected"
      :disabled="disabled || schema.disabled"
      :placeholder="schema.placeholder"
      :multiple="selectOptions.multiple"
      :ripple="false"
      :clearable="selectOptions.clearable"
      :small-chips="selectOptions.multiple"
      filled dense rounded hide-details append-icon="mdi-chevron-down"
      @change="updateSelected"
      @search-change="onSearchChange"
      @tag="addTag"
    >
      <template #prepend>
        <span v-if="schema.required" class="red--text"><strong>* </strong></span>{{ getLabel() }}
        <v-btn v-if="schema.listBox" small rounded elevation="0" @click="onChangeSelectAll">{{ (allOptionsSelected() ? 'TL_DESELECT_ALL' : 'TL_SELECT_ALL') | translate }}</v-btn>
      </template>
      <template #label />
      <template #item="{item, attrs}">
        <div v-if="selectOptions.multiple" class="checkbox">
          <v-icon :class="{displayed: attrs.inputValue}" small>mdi-check-bold</v-icon>
        </div>
        <div class="label" :class="{selected: attrs.inputValue}">{{ item.text ? item.text : item }}</div>
      </template>
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
    allOptionsSelected () {
      return _.get(this.formattedOptions, 'length', 0) === _.get(this.objectValue, 'length', 0)
    },
    onChangeSelectAll (checked) {
      const allSelected = this.allOptionsSelected()
      if (allSelected) {
        this.objectValue = []
      } else {
        let allValues = _.compact(_.map(this.formattedOptions, 'value'))
        if (_.get(allValues, 'length', 0) === 0) {
          allValues = this.formattedOptions
        }
        this.objectValue = allValues
      }
      this.value = this.objectValue
      this.$emit('input', this.value, this.schema.model)
    },
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

<style lang="scss">
.multiselect-wrapper {
  .v-input__prepend-outer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .v-autocomplete.v-select--chips {
    input {
      padding: 0;
      height: 100%;
      max-height: 100% !important;
    }
  }
  .v-select__selections {
    .v-chip--select {
      &:first-child {
        margin-left: 0px;
      }
    }
  }
  span.v-chip--select.v-chip.v-chip--clickable.v-chip--no-color.v-chip--removable.theme--light.v-size--small {
    margin-top: 3px;
    margin-bottom: 3px;
  }
}
</style>
