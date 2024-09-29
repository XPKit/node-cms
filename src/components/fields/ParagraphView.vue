<template>
  <div class="paragraph-view">
    <div class="paragraph-footer">
      <v-autocomplete
        ref="input"
        :ripple="false" :menu-props="menuProps"
        :theme="theme" transition="none"
        :model-value="selectedType" :items="types" item-title="label" item-value="label"
        hide-details rounded density="compact" persistent-placeholder variant="solo-filled" flat
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
      :class="{disabled}" draggable=".item" v-bind="dragOptions" handle=".handle" :group="`${schema.model}-${key}`" ghost-class="ghost" @end="onEndDrag" @start="dragging = true"
    >
      <v-card v-for="(item, idx) in items" :key="`paragraph-item-${idx}`" :theme="theme" elevation="0" :class="`item nested-level-${paragraphLevel}`">
        <v-card-title class="handle paragraph-header">
          <div class="paragraph-title">{{ item.label }}</div>
          <div class="add-btn-wrapper">
            <v-btn class="remove-item" :disabled="disabled || schema.disabled" variant="text" icon rounded size="small" @click="onClickRemoveItem(item)"><v-icon>mdi-trash-can-outline</v-icon></v-btn>
          </div>
        </v-card-title>
        <div class="item-main-wrapper">
          <div class="item-main">
            <custom-form :schema="getSchema(item, idx)" :model="item" :paragraph-index="idx" :paragraph-level="paragraphLevel + 1" @error="onError" @input="onModelUpdated" />
          </div>
        </div>
      </v-card>
    </draggable>
  </div>
</template>

<script>
import _ from 'lodash'
import SchemaService from '@s/SchemaService'
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
      }
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
  },
  methods: {
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
      this.types = _.map(_.get(this, 'schema.types', []), (type)=> {
        let schema = false
        schema = ResourceService.getParagraphSchema(type)
        if (schema) {
          schema.input = 'group'
          schema.label = _.get(schema, 'displayname', schema.title)
          schema.field = schema.title
        } else {
          console.error(`Couldnt get schema for paragraph type ${type}`)
        }
        return schema
      })
    },
    getSchemaForItems() {
      this.items = _.map(this.items, (item)=> {
        if (!_.get(item, 'input', false) || !_.get(item, 'label', false)) {
          if (this.schema.localised) {
            item.localised = true
          }
          let foundField = _.find(this.types, {field: item._type})
          if (!_.isUndefined(foundField)) {
            // console.warn('---------- foundField', foundField, item)
            foundField = _.extend(_.omit(foundField, ['_value', '_type']), {
              _value: _.omit(item, '_type')
            })
            return foundField
          }
          console.error(`Couldn't find field ${item.field} in the paragraph's fields`, this.types)
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
      this.dragging = false
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
@import '@a/scss/variables.scss';
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

</style>
<style lang="scss">
@import '@a/scss/variables.scss';
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
    &.item {
      &:has(.v-input__control:hover, .v-input__control:focus, .switch:hover, .switch:focus, .wysiwyg-wrapper:hover, .wysiwyg-wrapper:focus) {
        border-color: $level-hover-border;
      }
      &:has(.v-card.item .v-input__control:hover, .v-card.item .v-input__control:focus, ,.v-card.item .switch:hover, .v-card.item .switch:focus, .v-card.item .wysiwyg-wrapper:hover, .v-card.item .wysiwyg-wrapper:focus) {
        @include nested-paragraphs;
      }
    }
    &:not(.editor) {
      background-color: transparent;
      margin-bottom: 0;
    }
  }
}
</style>
