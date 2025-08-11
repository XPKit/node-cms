<template>
  <div class="multiselect-wrapper">
    <v-autocomplete
      :id="selectOptions.id"
      ref="input"
      :theme="theme"
      :chips="getSelectOpt('chips')"
      :menu-props="menuProps"
      :model-value="objectValue || _value" :items="options" :closable-chips="getSelectOpt('deletableChips') || getSelectOpt('multiple')" :hide-selected="getSelectOpt('hideSelected')"
      :disabled="disabled || schema.disabled" :placeholder="schema.placeholder" :multiple="getSelectOpt('multiple')" :ripple="false" :flat="get('flat')" :rules="[validateField]"
      :item-title="customLabel" :item-value="getValue"
      menu-icon="mdi-chevron-down" :clearable="getSelectOpt('clearable')" :variant="getVariant()" :density="get('density')" rounded hide-details
      @update:model-value="updateSelected" @search-change="onSearchChange" @tag="addTag"
      @update:focused="onFieldFocus"
    >
      <template #prepend>
        <field-label :schema="schema" :label="getLabel()" />
        <v-btn v-if="schema.listBox" variant="tonal" size="small" rounded elevation="0" @click="onChangeSelectAll">{{ $filters.translate(allOptionsSelected() ? 'TL_DESELECT_ALL' : 'TL_SELECT_ALL') }}</v-btn>
      </template>
      >
      <template #chip="{ props, item }">
        <v-chip
          v-bind="props"
          @contextmenu.stop.prevent="copyToClipboard(item.value)"
        />
      </template>
      <template #label />
      <template #append />
      <template #item="{props, item}">
        <v-list-item density="compact" v-bind="props" :title="customLabel(item)" />
      </template>
    </v-autocomplete>
  </div>
</template>
<script>
  import _ from 'lodash'
  import AbstractField from '@m/AbstractField'
  import Notification from '@m/Notification'

  export default {
    mixins: [AbstractField, Notification],
    data () {
      return {
        objectValue: this._value,
        menuProps: {
          contentProps: {
            density: 'compact'
          }
        }
      }
    },
    computed: {
      selectOptions () {
        return this.schema.selectOptions || {}
      },
      options () {
        let values = this.schema.values
        if (_.isFunction(values)) {
          return values.apply(this, [this.model, this.schema])
        }
        return values
      }
    },
    methods: {
      valEmpty(val) {
        return _.isNull(val) || _.isUndefined(val) || val === '' || (_.isArray(val) && val.length === 0)
      },
      copyToClipboard(value) {
        navigator.clipboard.writeText(value)
        this.notify('Value has been copied.')
      },
      validateField (val) {
        if (this.valEmpty(val)) {
          return this.schema.required ? false : true
        } else if (this.schema.validator && _.isFunction(this.schema.validator)) {
          return !!this.schema.validator(val, this.schema.model, this.model)
        }
        return true
      },
      getValue (item) {
        const val = _.get(item, 'raw', item)
        return _.get(val, '_id', _.get(val, '_value', val))
      },
      customLabel (item) {
        const val = _.get(item, 'raw', item)
        if (_.get(this.schema, `options.labels.${val}.${this.schema.locale}`, false)) {
          return _.get(this.schema, `options.labels.${val}.${this.schema.locale}`, val)
        } else if (_.get(this.schema, `options.labels.${val}`, false)) {
          return _.get(val, 'text', val)
        } else if (!_.get(this.schema, 'localised', false)) {
          return this.schema.selectOptions.customLabel(val)
        } else if (_.get(val, '_id', false)) {
          const fieldKey = _.first(_.without(_.keys(val), '_id'))
          return _.get(val, `${fieldKey}.${this.schema.locale}`, _.get(val, fieldKey, val))
        } else if (_.get(val, 'text', false)) {
          return val.text
        }
        return this.schema.selectOptions.customLabel(val)
      },
      getSelectOpt (key) {
        return _.get(this.selectOptions, key, false)
      },
      allOptionsSelected () {
        return _.get(this.options, 'length', 0) === _.get(this.objectValue || this._value, 'length', 0)
      },
      onChangeSelectAll () {
        const allSelected = this.allOptionsSelected()
        if (allSelected) {
          this.objectValue = []
        } else {
          let allValues = _.compact(_.map(this.options, '_value'))
          if (_.get(allValues, 'length', 0) === 0) {
            allValues = this.options
          }
          this.objectValue = allValues
        }
        this._value = this.objectValue
        this.$emit('input', this._value, this.schema.model)
      },
      getLabel () {
        if (this.disabled) {
          return ''
        }
        return !_.isString(this.selectOptions.label) ? this.schema.label : this.selectOptions.label
      },
      updateSelected (value) {
        this.objectValue = value
        const key = _.get(this.schema, 'selectOptions.key', false)
        if (key) {
          value = _.isString(value) ? value : _.get(value, key, value)
        }
        this.$emit('input', value, this.schema.model)
      },
      addTag (newTag, id) {
        const onNewTag = this.selectOptions.onNewTag
        if (_.isFunction(onNewTag)) {
          onNewTag(newTag, id, this.options, this.objectValue)
        }
      },
      onSearchChange (searchQuery, id) {
        const onSearch = this.selectOptions.onSearch
        if (_.isFunction(onSearch)) {
          onSearch(searchQuery, id, this.options)
        }
      }
    }
  }
</script>

<style lang="scss">
.multiselect-wrapper {
  .v-input__prepend {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .v-autocomplete {
    // input {
    //   position: absolute;
    // }
    .v-chip {
      &:hover {
        background: rgba(0,0,0,.25);
        cursor: copy;
      }
    }
    &.v-select--chips {
      input {
        padding: 0;
        height: 100%;
        max-height: 100% !important;
      }
    }
  }
  .v-select__selections {
    .v-chip--select {
      &:first-child {
        margin-left: 0px;
      }
    }
  }
}
</style>
