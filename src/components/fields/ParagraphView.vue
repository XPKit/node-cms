<template>
  <div class="paragraph-view">
    <draggable
      v-if="schema"
      :key="`${schema.model}-${key}`"
      :list="items"
      draggable=".item"
      v-bind="dragOptions"
      handle=".handle"
      :group="`${schema.model}-${key}`"
      ghost-class="ghost"
      :class="{disabled}"
      @end="onEndDrag"
      @start="dragging = true"
    >
      <v-card v-for="(item, idx) in items" :key="`paragraph-item-${idx}`" class="item">
        <span class="handle" />
        <div class="item-main-wrapper">
          <div class="item-main">
            <custom-form
              :schema="getSchema(item)"
              :model="item"
              :paragraph-index="idx"
              @error="onError"
              @input="onModelUpdated"
            />
          </div>
          <div class="add-btn-wrapper">
            <v-btn class="add-new-item" :disabled="disabled || schema.disabled" text rounded small @click="onClickRemoveItem(item)"><v-icon>mdi-minus-circle-outline</v-icon></v-btn>
          </div>
        </div>
      </v-card>
      <div slot="header" class="paragraph-header">
        <v-select
          ref="input"
          transition="none"
          :value="selectedType" :menu-props="{ bottom: true, offsetY: true }" :items="types" item-text="label" item-value="label"
          hide-details filled rounded dense persistent-placeholder
          :disabled="disabled || schema.disabled"
          @change="onChangeType"
        >
          <template #prepend>
            <span v-if="schema.required" class="red--text"><strong>* </strong></span>{{ schema.label }}
          </template>
          <template #label />
        </v-select>
        <div class="add-btn-wrapper">
          <v-btn elevation="0" class="add-new-item" text rounded small :disabled="disabled || schema.disabled" @click="onClickAddNewItem"><v-icon small>mdi-plus-thick</v-icon><span>{{ 'TL_ADD_NEW_FIELD' | translate }}</span></v-btn>
        </div>
      </div>
    </draggable>
  </div>
</template>

<script>
import _ from 'lodash'
import SchemaService from '@s/SchemaService'
import ResourceService from '@s/ResourceService'
import DragList from '@m/DragList'
import {v4 as uuid} from 'uuid'

const defaultTypes = [
  'string',
  'text',
  'password',
  'email',
  'url',
  'number',
  'double',
  'integer',
  'checkbox',
  'date',
  'time',
  'datetime',
  'pillbox',
  'json',
  'code',
  'wysiwyg',
  'object',
  'color',
  'image',
  'file'
]

export default {
  mixins: [DragList],
  props: ['schema', 'vfg', 'model', 'disabled'],
  data () {
    return {
      items: _.cloneDeep(_.get(this.model, this.schema.model, [])),
      types: [],
      selectedType: false,
      localModel: {},
      key: uuid()
    }
  },
  watch: {
    'schema.model': function () {
      this.items = _.cloneDeep(_.get(this.model, this.schema.model, []))
    }
  },
  created () {
    this.updateLocalData()
  },
  mounted () {
    const types = _.get(this, 'schema.types', defaultTypes)
    this.types = _.map(types, type => {
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
    this.selectedType = _.first(this.types)
  },
  methods: {
    onError (error) {
      console.error('ParagraphView - error', error)
    },
    updateLocalData () {
      this.localModel = _.cloneDeep(this.model)
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
      let extraSources = {}
      if (_.isString(item.source)) {
        extraSources = _.get(ResourceService.getSchema(item.source), 'extraSources', {})
      }
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
        return console.warn(`No type found for ${type} in types:`, this.types)
      }
      this.selectedType = foundType
    },
    onClickAddNewItem () {
      if (this.selectedType) {
        const newItem = _.cloneDeep(this.selectedType)
        this.items.push(newItem)
        _.set(this.localModel, this.schema.model, this.items)
        this.$emit('input', this.items, this.schema.model)
      }
    },
    onClickRemoveItem (item) {
      let attachments = _.get(this.model, '_attachments', [])
      if (_.includes(['image', 'file', 'group'], item.input)) {
        const findIds = obj => {
          const ids = []
          _.each(obj, (value, key) => {
            if (key === 'id') {
              return ids.push(value)
            }
            if (_.isPlainObject(value) || _.isArray(value)) {
              ids.push(...findIds(value))
            }
          })
          return ids
        }
        const ids = findIds(item)
        console.warn('IDS = ', ids)
        _.each(ids, fileItemId => {
          attachments = _.reject(attachments, {_fields: {fileItemId}})
        })
      }
      this.items = _.difference(this.items, [item])
      // console.warn('PARAGRAPH - ITEMS - ', this.items)
      // console.warn('PARAGRAPH - ATTACHMENTS - ', attachments)
      // console.warn('PARAGRAPH - LOCAL ATTACHMENTS - ', _.get(this.localModel, '_attachments', []))
      _.set(this.localModel, this.schema.model, this.items)
      _.set(this.model, '_attachments', attachments)
      this.items = _.clone(this.items)
      this.key = uuid()
      this.$emit('input', this.items, this.schema.model)
    },
    onChange () {
      _.set(this.localModel, this.schema.model, this.items)
      this.$emit('input', this.items, this.schema.model)
    },
    onEndDrag () {
      this.dragging = false
      _.set(this.localModel, this.schema.model, this.items)
      // console.warn('onEndDrag ', this.items)
      this.key = uuid()
      this.$emit('input', this.items, this.schema.model)
    },
    onModelUpdated (value, model, paragraphIndex) {
      if (_.includes(model, '.')) {
        _.set(this.items, `[${paragraphIndex}].${model}`, value)
      }
      _.set(this.localModel, this.schema.model, this.items)
      this.$emit('input', this.items, this.schema.model)
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
  margin-bottom: 5px;
  align-items: stretch;
  border: 1px grey solid;
  .handle, .file-item-handle {
    display: inline-block;
    width: 20px;
    background-color: grey;
    cursor: pointer;
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
    // padding: 10px;
    padding-left: 10px;
    padding-bottom: 10px;
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
      max-width: 100px;
      max-height: 100px;
    }
  }
}
.disabled {
  pointer-events: none;
}
.add-new-item {
  margin: 6px 0;
  text-align: right;
  .v-btn__content {
    justify-content: flex-end;
  }
  span {
    @include subtext;
    text-transform: none;
    letter-spacing: 0;
  }
}
.paragraph-header {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  align-content: stretch;
  justify-content: flex-start;
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
  .custom-switch {
    margin-top: 12px;
  }
  .add-btn-wrapper {
    display: flex;
    justify-content: flex-end;
  }
}
</style>
