<template>
  <div class="paragraph-view">
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
            <custom-form :schema="getSchema(item)" :model="item" :paragraph-index="idx" :paragraph-level="paragraphLevel + 1" @error="onError" @input="onModelUpdated" />
          </div>
        </div>
      </v-card>
    </draggable>
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
      selectedType: false,
      subResourcesLoaded: false,
      localModel: {},
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
    this.localModel = _.cloneDeep(this.model)
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
            if (_.get(type, 'source', false) && _.isString(type.source)) {
              return await ResourceService.cache(type.source)
            }
          } catch (error) {
            console.error(`Failed to get extra resource ${type.source}`, error)
          }
        }
      }), {concurrency: 10})
      this.subResourcesLoaded = true
    },
    getTypes() {
      let types = _.get(this, 'schema.types', SchemaService.paragraphsDefaultTypes)
      types = _.map(types, (type)=> {
        return _.get(ResourceService.getParagraphSchema(type), 'schema', [])
      })
      this.types = _.map(_.flatten(types), type => {
        if (_.isString(type)) {
          type = {
            input: type,
            parentKey: this.schema.model
          }
        }
        if (!type.label) {
          type.label = _.includes(['select', 'multiselect'], type.input) ? `${type.input}(${type.source})` : type.input
        }
        return type
      })
    },
    getSchemaForItems() {
      this.items = _.map(this.items, (item)=> {
        if (!_.get(item, 'input', false) || !_.get(item, 'label', false)) {
          const foundField = _.find(this.types, {field: item.field})
          if (!_.isUndefined(foundField)) {
            return _.extend(_.omit(foundField, ['value']), item)
          }
          console.error(`Couldn't find field ${item.field} in the paragraph's fields`, this.types)
        }
        return item
      })
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
    debouncedValidate () {
      _.each(this.$refs.vfg, vfg => {
        vfg.debouncedValidate()
      })
    },
    clearValidationErrors () {
      _.each(this.$refs.vfg, vfg => {
        vfg.clearValidationErrors()
      })
    },
    getSchema (item) {
      let schemaItems = []
      const {resource, locale, userLocale, disabled} = this.schema
      if (item.input === 'group') {
        schemaItems = _.map(item.schema, schemaItems => {
          return _.extend({}, schemaItems, {
            field: `value.${schemaItems.field}`,
            localised: this.schema.localised,
            label: schemaItems.label || schemaItems.field
          })
        })
      } else {
        const schemaItem = _.extend({}, item, {
          field: 'value',
          localised: this.schema.localised
        })
        schemaItems.push(schemaItem)
      }
      _.each(schemaItems, item => {
        if (_.includes(['image', 'file'], item.input)) {
          item.input = _.camelCase(`paragraph ${item.input}`)
        }
      })
      let extraSources = _.isString(item.source) ? _.get(ResourceService.getSchema(item.source), 'extraSources', {}) : {}
      const fields = SchemaService.getSchemaFields(schemaItems, resource, locale, userLocale, disabled, extraSources, this.schema.rootView || this)
      const groups = SchemaService.getNestedGroups(resource, fields, 0, null, 'value.')
      return {fields: groups}
    },
    getAttachment (fileItemId, field) {
      const attach = _.find(this.model._attachments, {_fields: {fileItemId}})
      if (field) {
        return _.get(attach, field)
      }
      return attach
    },
    onChangeType (type) {
      const foundType = _.find(this.types, {label: type})
      if (_.isUndefined(foundType)) {
        // console.warn(`No type found for ${type} in types:`, this.types)
        return
      }
      this.selectedType = foundType
    },
    async onClickAddNewItem () {
      if (this.selectedType) {
        const newItem = _.cloneDeep(this.selectedType)
        this.items.push(newItem)
        this.updateItems()
      }
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
      // console.warn('REMOVE ITEM', item)
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
      _.set(this.items, `[${paragraphIndex}].${model}`, value)
      this.updateItems()
    },
    updateItems() {
      const items = _.map(this.items, (item)=> _.pick(item, ['field', 'value']))
      _.set(this.localModel, this.schema.model, items)
      this.$emit('input', items, this.schema.model)
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@a/scss/variables.scss';
.paragraph-view {
  width: 100%;
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
    padding: 16px;
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
  @for $i from 1 through 6 {
    $valIndex: get-level-index($i);
    &.nested-level-#{$i} {
      @include nested-paragraph-levels-border($valIndex);
      .paragraph-header {
        @include nested-paragraph-levels($valIndex);
      }
      .add-btn-wrapper {
        .remove-item {
          color: nth($levelColors, $valIndex) !important;
        }
      }
    }
  }
}

</style>
<style lang="scss">
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
    background-color: transparent;
  }
}
</style>
