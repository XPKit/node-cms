<template>
  <multiselect
    :id="selectOptions.id"
    :options="options"
    :value="objectValue"
    :class="[schema.labelClasses]"
    :multiple="selectOptions.multiple"
    :track-by="selectOptions.trackBy || null" :label="selectOptions.label || null" :searchable="selectOptions.searchable" :clear-on-select="selectOptions.clearOnSelect" :hide-selected="selectOptions.hideSelected" :placeholder="schema.placeholder" :allow-empty="selectOptions.allowEmpty ? true : false" :reset-after="selectOptions.resetAfter" :close-on-select="selectOptions.closeOnSelect" :custom-label="customLabel"
    :taggable="selectOptions.taggable" :tag-placeholder="selectOptions.tagPlaceholder" :max="schema.max || null" :options-limit="selectOptions.optionsLimit" :group-values="selectOptions.groupValues" :group-label="selectOptions.groupLabel" :block-keys="selectOptions.blockKeys" :internal-search="selectOptions.internalSearch" :select-label="selectOptions.selectLabel" :selected-label="selectOptions.selectedLabel"
    :deselect-label="selectOptions.deselectLabel" :show-labels="selectOptions.showLabels" :limit="selectOptions.limit" :limit-text="selectOptions.limitText" :loading="selectOptions.loading" :disabled="disabled" :max-height="selectOptions.maxHeight" :show-pointer="selectOptions.showPointer" :option-height="selectOptions.optionHeight" @input="updateSelected"
    @select="onSelect" @remove="onRemove" @search-change="onSearchChange" @tag="addTag" @open="onOpen" @close="onClose"
  >
    <span slot="noResult">{{ selectOptions.noResult }}</span>
    <span slot="maxElements">{{ selectOptions.maxElements }}</span>
  </multiselect>
</template>
<script>
import Multiselect from 'vue-multiselect'
import _ from 'lodash'
import AbstractField from '@m/AbstractField'

export default {
  components: {
    Multiselect
  },
  mixins: [AbstractField],
  props: ['obj', 'vfg', 'model', 'disabled'],
  data () {
    return {
      objectValue: this.value
    }
  },
  computed: {
    selectOptions () {
      console.warn('test options', this.schema.selectOptions || {})
      return this.schema.selectOptions || {}
    },
    options () {
      let values = this.schema.values
      if (typeof values === 'function') {
        return values.apply(this, [this.model, this.schema])
      }
      return values
    },
    customLabel () {
      if (
        typeof this.schema.selectOptions !== 'undefined' &&
        typeof this.schema.selectOptions.customLabel !== 'undefined' &&
        typeof this.schema.selectOptions.customLabel === 'function'
      ) {
        return this.schema.selectOptions.customLabel
      }
      // this will let the multiselect library use the default behavior if customLabel is not specified
      return undefined
    }
  },
  created () {
    const key = this.getKey()
    const currentValue = _.get(this.model, _.get(this.schema, 'model', false), false)
    if (currentValue) {
      this.updateSelected(_.find(this.options, (option) => {
        return _.get(option, key, false) === currentValue
      }))
    }
  },
  methods: {
    getKey () {
      return _.get(this.schema, 'selectOptions.key')
    },
    updateSelected (value /* , id */) {
      this.objectValue = value
      const key = this.getKey()
      if (key) {
        this.value = _.get(this.objectValue, key)
      } else {
        this.value = this.objectValue
      }
      // TODO: hugo - when value set to none
    },
    addTag (newTag, id) {
      let onNewTag = this.selectOptions.onNewTag
      if (typeof onNewTag === 'function') {
        onNewTag(newTag, id, this.options, this.objectValue)
      }
    },
    onSearchChange (searchQuery, id) {
      let onSearch = this.selectOptions.onSearch
      if (typeof onSearch === 'function') {
        onSearch(searchQuery, id, this.options)
      }
    },
    onSelect (/* selectedOption, id */) {
      // console.log("onSelect", selectedOption, id);
    },
    onRemove (/* removedOption, id */) {
      // console.log("onRemove", removedOption, id);
    },
    onOpen (/* id */) {
      // console.log("onOpen", id);
    },
    onClose (/* value, id */) {
      // console.log("onClose", value, id);
    }
  }
}
</script>
