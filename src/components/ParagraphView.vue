<template>
  <div class="paragraph-view">
    <draggable
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
          <vue-form-generator
            ref="vfg"
            :schema="getSchema(item)"
            :model="item"
            :options="formOptions"
            @model-updated="onModelUpdated"
          />
        </div>
        <button @click="onClickRemoveItem(item)">remove</button>
      </div>
      <div slot="header">
        <select v-model="selectedType">
          <option v-for="item in types" :key="`option-${item.input}`" :value="item">{{ item.label }}</option>
        </select>
        <button @click="onClickAddNewItem">Add</button>
      </div>
    </draggable>
  </div>
</template>

<script>
import _ from 'lodash'
import SchemaService from '@s/SchemaService'
import VueFormGenerator, { abstractField } from 'vue-form-generator'
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
    'vue-form-generator': VueFormGenerator.component
  },
  mixins: [abstractField],
  data () {
    return {
      items: _.cloneDeep(_.get(this.model, this.schema.model, [])),
      types: [],
      formOptions: {
        validateAfterLoad: true,
        validateAfterChanged: true
      },
      key: uuid()
    }
  },
  watch: {
    'schema.model': function () {
      this.items = _.cloneDeep(_.get(this.model, this.schema.model, []))
    }
  },
  mounted () {
    this.types = _.map(this.schema.types || defaultTypes, type => {
      if (_.isString(type)) {
        type = {
          input: type
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
    getKeyLocale () {
      const options = {}
      const list = this.schema.model.split('.')
      if (this.schema.localised) {
        options.locale = list.shift()
      }
      options.key = list.join('.')
      return options
    },
    onClickAddNewItem () {
      if (this.selectedType) {
        const newItem = _.cloneDeep(this.selectedType)
        this.items.push(newItem)
        _.set(this.model, this.schema.model, this.items)
        this.$emit('model-updated', this.schema.model, this.model)
      }
    },
    onClickRemoveItem (item) {
      let attachments = this.model._attachments = this.model._attachments || []
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
      _.set(this.model, this.schema.model, this.items)
      _.set(this.model, '_attachments', attachments)
      this.items = _.clone(this.items)
      this.key = uuid()
      this.$emit('model-updated', this.schema.model, this.model)
    },
    onChange () {
      _.set(this.model, this.schema.model, this.items)
      this.$emit('model-updated', this.schema.model, this.model)
    },
    onEndDrag () {
      _.set(this.model, this.schema.model, this.items)
      this.key = uuid()
      this.$emit('model-updated', this.schema.model, this.model)
    },
    onModelUpdated (value, model) {
      _.set(this.model, this.schema.model, this.items)
      this.$emit('model-updated', value, model)
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
