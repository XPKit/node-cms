<template>
  <div class="paragraph-view">
    <div class="paragraph-footer">
      <v-autocomplete
        ref="input"
        :ripple="false" :menu-props="menuProps"
        :theme="theme" transition="none"
        :model-value="selectedType" :items="types" item-title="label" item-value="label"
        hide-details rounded density="compact" persistent-placeholder variant="solo-filled" flat :rules="[validateField]"
        :disabled="disabled || schema.disabled" menu-icon="mdi-chevron-down" @update:model-value="onChangeType"
      >
        <template #prepend><field-label :schema="schema" /></template>
        <template #label />
      </v-autocomplete>
      <div class="add-btn-wrapper">
        <v-btn elevation="0" class="add-new-item" rounded :disabled="blockMoreItems()" @click="onClickAddNewItem"><span>{{ $filters.translate('TL_ADD') }}</span></v-btn>
      </div>
    </div>
    <draggable
      v-if="schema && subResourcesLoaded" :key="`${schema.model}-${key}`" :list="items"
      :class="{disabled, 'dynamic-layout-container': isDynamicLayoutContainer}" draggable=".item" v-bind="dragOptions" handle=".handle" :group="`${schema.model}-${key}`" ghost-class="ghost" @end="onEndDrag"
    >
      <v-card v-for="(item, idx) in items" :key="`paragraph-item-${idx}`" :theme="theme" elevation="0" :class="getItemClasses(paragraphLevel, idx, item)" :style="getItemStyles(item)" :data-slots="getItemSlots(item)">
        <v-card-title class="handle paragraph-header">
          <div class="paragraph-title">{{ item.label }}</div>
          <div class="add-btn-wrapper">
            <v-btn class="remove-item" :disabled="disabled || schema.disabled" variant="text" icon rounded size="small" @click="onClickRemoveItem(item)"><v-icon>mdi-trash-can-outline</v-icon></v-btn>
          </div>
        </v-card-title>
        <div class="item-main-wrapper">
          <div class="item-main">
            <div v-if="item.showConvert || item.cannotConvert" class="convert-paragraph">
              <div v-if="item.cannotConvert" class="error-message">{{ $filters.translate('TL_INVALID_PARAGRAPH_CANNOT_BE_CONVERTED') }}</div>
              <div v-else class="error-message">{{ $filters.translate('TL_INVALID_PARAGRAPH_WOULD_YOU_LIKE_TO_CONVERT_IT') }}</div>
              <json-viewer :value="item" tabindex="-1" />
              <template v-if="item.showConvert">
                <div class="convert-action">
                  <v-select
                    :model-value="item.showConvert"
                    :menu-props="menuProps"
                    :theme="theme" transition="none"
                    :items="types" hide-details rounded density="compact" persistent-placeholder variant="solo-filled" flat
                  >
                    <template #prepend><field-label :schema="{label: $filters.translate('TL_CONVERT_TO')}" /></template>
                    <template #label />
                  </v-select>
                  <v-btn elevation="0" rounded @click="convertParagraph(item)">{{ $filters.translate('TL_CONVERT') }}</v-btn>
                </div>
              </template>
            </div>
            <custom-form v-else :schema="getSchema(item, idx)" :model="item" :paragraph-index="idx" :paragraph-level="paragraphLevel + 1" @error="onError" @input="onModelUpdated" />
          </div>
        </div>
      </v-card>
    </draggable>
  </div>
</template>

<script>
import _ from 'lodash'
import SchemaService from '@s/SchemaService'
import FieldSelectorService from '@s/FieldSelectorService'
import ResourceService from '@s/ResourceService'
import DragList from '@m/DragList'
import {v4 as uuid} from 'uuid'
import pAll from 'p-all'

export default {
  mixins: [DragList],
  props: ['schema', 'vfg', 'model', 'disabled', 'paragraphLevel', 'theme'],
  data () {
    return {
      items: _.cloneDeep(_.get(this.model, this.schema.model, [])),
      types: [],
      fileInputTypes: ['file', 'img', 'image', 'imageView', 'attachmentView'],
      selectedType: false,
      subResourcesLoaded: false,
      key: uuid(),
      maxCount: _.get(this.schema, 'options.maxCount', -1),
      menuProps: {
        contentProps: {
          density: 'compact'
        }
      },
      highlight: {
        level: -1,
        index: -1
      }
    }
  },
  computed: {
    isDynamicLayoutContainer() {
      // Enable dynamic layout in two ways:
      // 1. Explicitly set options.dynamicLayout: true in paragraph field config
      // 2. Automatically detect when any items have slots properties
      // This makes dynamic layout work for ANY paragraph type, not just reportItems
      return this.schema && (
        _.get(this.schema, 'options.dynamicLayout', false) ||
        _.some(this.items, item => _.has(item, '_value.slots') || _.has(item, 'slots'))
      )
    },
    parentSlots() {
      if (!this.isDynamicLayoutContainer) {
        return 12
      }
      // Get slots from parent model (e.g., from a container paragraph with slots field)
      // Default to 12 if not specified (like Bootstrap's 12-column grid)
      return _.get(this.model, 'slots') || _.get(this.vfg, 'model.slots') || 12
    }
  },
  watch: {
    'schema.model': function () {
      this.items = _.cloneDeep(_.get(this.model, this.schema.model, []))
    }
  },
  created () {
  },
  async mounted () {
    this.getTypes()
    this.getSchemaForItems()
    await this.getSubResources()
    this.selectedType = _.first(this.types)
    FieldSelectorService.events.on('highlight-paragraph', this.onHighlightParagraph)
  },
  unmounted() {
    FieldSelectorService.events.off('highlight-paragraph', this.onHighlightParagraph)
  },
  methods: {
    getItemClasses(paragraphLevel, idx, item) {
      const classes = ['item', `nested-level-${paragraphLevel}`]
      if (this.isHighlighted(idx, paragraphLevel)) {
        classes.push('highlighted')
      } else if (this.highlight.level !== -1 && this.highlight.index !== -1) {
        classes.push('not-highlighted')
      }
      if (this.isDynamicLayoutContainer) {
        const slots = _.get(item, '_value.slots') || _.get(item, 'slots')
        if (slots) {
          classes.push('dynamic-layout-item')
          classes.push(`slots-${slots}`)
        }
      }
      return classes
    },
    getItemStyles(item) {
      // Apply flex-basis style for dynamic layout items
      if (this.isDynamicLayoutContainer) {
        const slots = _.get(item, '_value.slots') || _.get(item, 'slots')
        if (slots) {
          const percentage = (slots / this.parentSlots) * 100
          // Calculate gap adjustment
          // For a 12-column grid with 16px gaps:
          // - 2 items of 6 columns each need: calc(50% - 8px) each (total gap: 16px split between 2 items)
          // - 3 items of 4 columns each need: calc(33.333% - 10.667px) each (total gap: 32px split between 3 items)
          // - 4 items of 3 columns each need: calc(25% - 12px) each (total gap: 48px split between 4 items)
          // Number of items that would fit in one row with this slots count
          const itemsPerRow = Math.floor(this.parentSlots / slots)
          // Total gap space in one row (n-1 gaps for n items)
          const totalGapInRow = Math.max(0, (itemsPerRow - 1) * 16)
          // Gap space to subtract from each item
          const gapPerItem = itemsPerRow > 1 ? totalGapInRow / itemsPerRow : 0
          const adjustedWidth = `calc(${percentage}% - ${gapPerItem}px)`
          // Debug logging (remove in production)
          console.log('🎨 Dynamic layout calculation:', {
            item: _.get(item, '_value.name') || _.get(item, 'name') || _.get(item, '_value.title') || _.get(item, 'title'),
            slots,
            parentSlots: this.parentSlots,
            percentage: `${percentage}%`,
            itemsPerRow,
            totalGapInRow,
            gapPerItem,
            adjustedWidth
          })
          return {
            flexBasis: adjustedWidth,
            maxWidth: adjustedWidth,
            width: adjustedWidth
          }
        }
      }
      return {}
    },
    getItemSlots(item) {
      if (!this.isDynamicLayoutContainer) {
        return ''
      }
      const slots = _.get(item, '_value.slots') || _.get(item, 'slots')
      return slots ? `${slots}/${this.parentSlots}` : ''
    },
    convertParagraph(item) {
      item._type = item.showConvert
      delete item.showConvert
      this.getSchemaForItems()
    },
    validateField () {
      return this.schema.required && _.get(this.items, 'length', 0) === 0 ? false : true
    },
    onHighlightParagraph(level, index) {
      this.highlight = {level, index}
      this.$forceUpdate()
    },
    isHighlighted(idx, paragraphLevel) {
      return paragraphLevel === this.highlight.level && idx === this.highlight.index
    },
    async getSubResources() {
      await pAll(_.map(this.types, type => {
        return async () => {
          try {
            await this.requestResourcesForParagraph(type)
          } catch (error) {
            console.error(`Failed to get extra resource ${type.source}`, error)
          }
        }
      }), {concurrency: 1})
      this.subResourcesLoaded = true
    },
    getTypes() {
      this.types = _.compact(_.map(_.get(this, 'schema.types', []), (type)=> {
        let schema = false
        schema = ResourceService.getParagraphSchema(type)
        if (schema) {
          schema.input = 'group'
          schema.label = _.get(schema, 'displayname', schema.title)
          schema.field = schema.title
        } else {
          console.error(`Couldn't get schema for paragraph type ${type}`)
        }
        return schema
      }))
    },
    getSchemaForItems() {
      this.items = _.map(this.items, (item)=> {
        if (!_.get(item, 'input', false) || !_.get(item, 'label', false)) {
          if (this.schema.localised) {
            item.localised = true
          }
          const foundParagraphType = _.find(this.types, {field: item._type})
          if (!_.isUndefined(foundParagraphType)) {
            return _.extend(_.omit(foundParagraphType, ['_value', '_type']), {
              _value: _.omit(item, '_type')
            })
          }
          const fieldName = _.get(this.schema, 'originalModel', _.get(this.schema, 'model', 'not-found'))
          console.error(`Paragraph of type ${item._type} is not allowed in field '${fieldName}', will show option to convert to`,_.get(this, 'schema.types', []))
          item.showConvert = _.get(this.types, '[0].title', false)
          if (!item.showConvert) {
            item.cannotConvert = true
          }
        }
        return item
      })
      // console.warn('getSchemaForItems ----', this.items, this.schema.model)
    },
    blockMoreItems() {
      return (this.disabled || this.schema.disabled) || (this.maxCount !== -1 && this.items.length >= this.maxCount)
    },
    onError (error) {
      console.error('ParagraphView - error', error)
    },
    validate () {
      _.each(this.$refs.vfg, vfg => {
        if (!vfg.validate()) {
          this.errors = vfg.errors
          throw new Error('group validation error')
        }
      })
      return true
    },
    getSchema (item, index) {
      let schemaItems = []
      const {resource, locale, userLocale, disabled} = this.schema
      if (item.input === 'group') {
        schemaItems = _.map(item.schema, schemaItems => {
          let paragraphKey = `${this.paragraphLevel > 1 ? this.schema.paragraphKey : this.schema.model}[${index}].${schemaItems.field}`
          return _.extend({}, schemaItems, {
            field: `_value.${schemaItems.field}`,
            paragraphKey,
            paragraphType: item.title,
            localised: _.get(schemaItems, 'localised', false),
            label: schemaItems.label || schemaItems.field
          })
        })
      } else {
        schemaItems.push(_.extend({}, item, {
          field: '_value',
          localised: this.schema.localised
        }))
      }
      let extraSources = _.isString(item.source) ? _.get(ResourceService.getSchema(item.source), 'extraSources', {}) : {}
      const fields = SchemaService.getSchemaFields(schemaItems, resource, locale, userLocale, disabled, extraSources, this.schema.rootView || this)
      const groups = SchemaService.getNestedGroups(resource, fields, 0, null, '_value.')
      return {fields: groups}
    },
    getAttachment (fileItemId, field) {
      const attach = _.find(this.model._attachments, {_fields: {fileItemId}})
      return field ? _.get(attach, field) : attach
    },
    onChangeType (type) {
      const foundType = _.find(this.types, {label: type})
      if (_.isUndefined(foundType)) {
        console.warn(`No type found for ${type} in types:`, this.types)
        return
      }
      this.selectedType = foundType
    },
    async requestResourcesForParagraph(paragraph) {
      // NOTE: Requests additional resources
      await pAll(_.map(paragraph.schema, (field)=> {
        return async () => {
          if (_.includes(['select', 'multiselect'], _.get(field, 'input', false)) && _.isString(_.get(field, 'source', false))) {
            const result = ResourceService.get(field.source)
            if (_.isUndefined(result)) {
              await ResourceService.cache(field.source)
            }
          }
        }
      }), {concurrency: 5})
    },
    async onClickAddNewItem () {
      if (!this.selectedType) {
        return
      }
      const newItem = _.cloneDeep(this.selectedType)
      await this.requestResourcesForParagraph(newItem)
      this.items.push(newItem)
      this.updateItems()
    },
    findIds (obj) {
      const ids = []
      _.each(obj, (value, key) => {
        if (key === 'id') {
          return ids.push(value)
        }
        if (_.isPlainObject(value) || _.isArray(value)) {
          ids.push(...this.findIds(value))
        }
      })
      return ids
    },
    onClickRemoveItem (item) {
      let attachments = _.get(this.model, '_attachments', [])
      if (_.includes(['image', 'file', 'group'], item.input)) {
        _.each(this.findIds(item), fileItemId => {
          attachments = _.reject(attachments, {_fields: {fileItemId}})
        })
      }
      _.set(this.model, '_attachments', attachments)
      this.items = _.difference(this.items, [item])
      this.key = uuid()
      this.updateItems()
    },
    onEndDrag () {
      this.key = uuid()
      this.updateItems()
    },
    onModelUpdated (value, model, paragraphIndex) {
      if (value instanceof Event) {
        return
      }
      _.set(this.items, `[${paragraphIndex}].${model}`, value)
      this.updateItems()
    },
    updateItems() {
      // console.warn('updateItems before ', _.cloneDeep(this.items))
      const items = _.map(this.items, (item)=> {
        const obj = _.get(item, '_value', {})
        obj._type = item.title
        return obj
      })
      this.$emit('input', items, this.schema.model)
    }
  }
}
</script>

<style lang="scss" scoped>
@use '@a/scss/variables.scss' as *;
@use '@a/scss/mixins.scss' as *;
.paragraph-view {
  width: 100%;
  border: 2px $paragraph-top-bar-background solid;
  border-radius: 8px;
  padding: 8px;
}
.item {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  align-items: stretch;
  border: 2px $paragraph-top-bar-background solid;
  border-radius: 8px;
  .handle, .file-item-handle {
    cursor: pointer;
  }
  .handle {
    border-radius: 0px !important;
    @include h5;
  }
  .file-item-handle {
    width: 20px;
    background-color: grey;
  }

  textarea, input {
    width: 100%;
  }
  textarea {
    height: 100px;
  }
  .row {
    display: flex;
    span {
      display: block;
      width: calc(100% - 50px);
      &:first-child {
        width: 50px;
      }
    }
  }
  .item-main {
    width: 100%;
    padding: 8px;
  }
  .file-item {
    display: flex;
    margin-bottom: 10px;
    textarea {
      height: 50px;
    }
  }

  .file-item-main {
    width: 100%;

    img {
      max-width: 200px;
      max-height: 113px;
    }
  }
}
.disabled {
  pointer-events: none;
}
.add-new-item, .remove-item {
  color: $btn-action-color !important;
  max-height: 34px;
  button {
    &:before {
      transform: translate(50%, 0);
    }
  }
  span {
    @include cta-text;
    text-transform: none;
    text-transform: uppercase !important;
    letter-spacing: 0;
  }
}
.add-btn-wrapper {
  .add-new-item {
    background-color: $btn-action-background !important;
  }
}
.paragraph-footer, .paragraph-header {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  width: 100%;
  justify-content: flex-start;
  gap: 16px;
}
.paragraph-footer {
  margin-bottom: 16px;
}
.paragraph-header {
  background-color: $paragraph-top-bar-background;
  color: $paragraph-top-bar-color !important;
  display: flex;
  align-items: center;
  align-content: center;
  justify-content: space-between;
  height: 34px;
  padding: 8px;
  padding-left: 16px;
  .paragraph-title {
    height: 100%;
    @include subtext;
  }
}

.item {
  @include nested-paragraphs;
}
.convert-paragraph {
  .convert-action {
    display: flex;
    align-items: flex-end;
    gap: 16px;
  }
  .error-message, .v-btn {
    @include cta-text;
  }
  .error-message {
    color: $imag-orange;
  }
  .v-btn {
    color: $btn-action-color;
    background-color: $btn-action-background;
  }
}

</style>
<style lang="scss">
@use '@a/scss/variables.scss' as *;
@use '@a/scss/mixins.scss' as *;
.paragraph-view {
  .item-main-wrapper {
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    flex: 1 0;
    > .v-btn {
      margin: 10px;
    }
    .field-wrapper {
      margin-bottom: 0;
    }
  }
  .paragraph-footer {
    .field-label {
      padding-left: 8px;
    }
  }
  .custom-checkbox {
    margin-top: 12px;
  }
  .add-btn-wrapper {
    display: flex;
    justify-content: flex-end;
    .add-new-item {
      margin: 0;
    }
  }
  .v-input {
    display: flex;
    flex-direction: column;
  }
  .v-card {
    pointer-events: auto;
    touch-action: auto;
    &.item {
      &.highlighted, &:hover:not(.not-highlighted) {
        @include highlight-paragraph;
      }
      &:hover {
        &:has(.v-card.item:hover) {
          @include nested-paragraphs;
          .v-card.item:hover {
            @include highlight-paragraph;
          }
        }
      }
      // has sub paragraph
      // &:has(.v-card.item) {
      //   &:hover {
      //     // background-color: red;
      //     &:has(.v-card.item:hover) {
      //       @include nested-paragraphs;
      //       .v-card.item:hover {
      //         @include highlight-paragraph;
      //       }
      //     }
      //     &:not(:has(.v-card.item:hover)) {
      //       @include highlight-paragraph;
      //       .v-card {
      //         @include nested-paragraphs;
      //       }
      //     }
      //     &:not(:has(.v-card.item:hover, .v-card.item:has(.v-field--focused, .switch:focus, .ProseMirror-focused))) {
      //       background-color: green;
      //       @include highlight-paragraph;
      //       .v-card.item {
      //         @include nested-paragraphs;
      //       }
      //     }
      //   }
        // if not hovered and has a focused field
        // &:not(:hover):has(.v-field--focused, .switch:focus, .ProseMirror-focused) {
        //   background-color: orange;
        //   // if focused field is not in a sub paragraph
        //   .v-card.item:has(.v-field--focused, .switch:focus, .ProseMirror-focused) {
        //     background-color: blue;
        //   }
        //   &:not(:has(.v-card.item:has(.v-field--focused, .switch:focus, .ProseMirror-focused))) {
        //     background-color: red;
        //   }
        // }
      // }

    }
    &:not(.editor) {
      background-color: transparent;
      margin-bottom: 0;
      +.v-card.item {
        margin-top: vw(16px);
      }
    }
  }
}

// Dynamic layout styles
.paragraph-view {
  .dynamic-layout-container {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: stretch; // Make all items same height

    // Remove the default margin-bottom from items in dynamic layout
    .item {
      margin-bottom: 0 !important;
    }
    // Override the default +.v-card.item margin
    .v-card.item + .v-card.item {
      margin-top: 0 !important;
    }
    .dynamic-layout-item {
      flex-shrink: 0;
      flex-grow: 0;
      box-sizing: border-box;
      min-width: 0; // Prevent overflow
      // Ensure the item content doesn't break the layout
      .item-main {
        overflow: hidden;
      }
      // Add some visual indication for development
      &::before {
        content: attr(data-slots);
        position: absolute;
        top: 2px;
        right: 2px;
        background: rgba(0, 0, 0, 0.1);
        font-size: 10px;
        padding: 2px 4px;
        border-radius: 2px;
        color: #666;
        font-family: monospace;
        z-index: 10;
        pointer-events: none;
      }
    }

    // Responsive behavior for smaller screens
    @media (max-width: 768px) {
      .dynamic-layout-item {
        width: 100% !important;
        max-width: 100% !important;
        flex-basis: 100% !important;
      }
    }

    @media (max-width: 1024px) and (min-width: 769px) {
      .dynamic-layout-item {
        // On tablets, ensure items don't get too small
        &[style*="flex-basis: calc(8.33%"], // 1/12
        &[style*="flex-basis: calc(16.67%"], // 2/12
        &[style*="flex-basis: calc(25%"] { // 3/12
          width: calc(33.33% - 10.667px) !important;
          max-width: calc(33.33% - 10.667px) !important;
          flex-basis: calc(33.33% - 10.667px) !important;
        }
      }
    }
  }
}
</style>
