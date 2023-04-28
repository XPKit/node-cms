<template>
  <div class="paragraph-view">
    <draggable
      v-if="schema"
      :key="`${schema.model}-${key}`"
      v-model="items"
      draggable=".item"
      handle=".handle"
      :class="{disabled}"
      @end="onEndDrag"
    >
      <div v-for="(item, idx) in items" :key="`paragraph-item-${idx}`" class="item">
        <span class="handle" />
        <div class="item-main">
          <custom-form
            :schema="getSchema(item)"
            :model="item"
            @error="onError"
            @input="onModelUpdated"
          />
        </div>
        <v-btn @click="onClickRemoveItem(item)">remove</v-btn>
      </div>
      <div slot="header">
        <v-select :label="schema.label" :value="selectedType" hide-details="" :menu-props="{ bottom: true, offsetY: true }" outlined dense :items="types" item-text="label" item-value="label" @change="onChangeType" />
        <!-- <option v-for="item in types" :key="`option-${item.input}`" :value="item">{{ item.label }}</option>
        </v-select> -->
        <v-btn @click="onClickAddNewItem">Add</v-btn>
      </div>
    </draggable>
  </div>
</template>

<script>
import _ from 'lodash'
import SchemaService from '@s/SchemaService'
import ResourceService from '@s/ResourceService'
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
  components: {
  },
  props: ['schema', 'vfg', 'model', 'disabled'],
  data () {
    return {
      props: ['obj', 'vfg', 'model', 'disabled'],
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
      console.warn('watch !!!', this.items)
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
        console.warn('NEW ITEM ADDED: ', this.selectedType, this.localModel)
        this.$emit('input', this.localModel, this.schema.model)
      }
    },
    onClickRemoveItem (item) {
      let attachments = this.localModel._attachments = this.localModel._attachments || []
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
        _.each(ids, fileItemId => {
          attachments = _.reject(attachments, {_fields: {fileItemId}})
        })
      }
      this.items = _.difference(this.items, [item])
      _.set(this.localModel, this.schema.model, this.items)
      _.set(this.localModel, '_attachments', attachments)
      this.items = _.clone(this.items)
      this.key = uuid()
      this.$emit('input', this.items, this.schema.model)
      // this.$emit('input', this.localModel._attachments, this.schema.model)
    },
    onChange () {
      _.set(this.localModel, this.schema.model, this.items)
      this.$emit('input', this.items, this.schema.model)
    },
    onEndDrag () {
      _.set(this.localModel, this.schema.model, this.items)
      this.key = uuid()
      this.$emit('input', this.items, this.schema.model)
    },
    onModelUpdated (value, model) {
      _.set(this.localModel, this.schema.model, this.items)
      this.$emit('input', this.items, this.schema.model)
    }
  }
}
</script>

<style lang="scss" scoped>
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
    width: 40px;
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
    padding: 10px;
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
</style>
