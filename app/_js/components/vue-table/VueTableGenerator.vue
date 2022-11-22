<template>
  <div class="vue-table-generator vue-form-generator table">
    <div class="row header">
      <div v-if="isDisplay('_id')" :style="getSize('_id')" class="cell input-id" :class="generateClass('_id')" @click="setSortBy('_id')">
        {{ 'TL_ID'|translate }}
      </div>
      <template v-for="sItem in schemaFields">
        <div :key="sItem.field" :style="getSize(sItem)" class="cell" :class="generateClass(sItem.model)" @click="setSortBy(sItem.model)">
          {{ sItem.label }}
        </div>
      </template>
      <div v-if="isDisplay('_updatedAt')" :style="getSize('_updatedAt')" class="cell input-update" :class="generateClass('_updatedAt')" @click="setSortBy('_updatedAt')">
        {{ 'TL_UPDATED'|translate }}
      </div>
      <div class="cell header actions">
        {{ 'TL_ACTIONS'|translate }}
      </div>
    </div>
    <template v-for="(item, idx) in orderedItem">
      <div :key="idx" class="row" :class="{selected: item == selectedItem, frozen: !item._local}">
        <div v-if="isDisplay('_id')" :style="getSize('_id')" class="cell input-id">{{ item._id || "" }}</div>
        <template v-for="sItem in schemaFields">
          <div v-if="sItem" :key="idx+' '+sItem.model" :style="getSize(sItem)" class="cell" :class="'input-' + sItem.type">
            <div class="field" :class="'field-' + sItem.type">
              <div v-if="isText(sItem)" class="text">
                {{ display(item, sItem) }}
              </div>
              <div v-else-if="isImage(sItem)" class="image-view">
                <img :src="display(item, sItem)">
              </div>
              <div v-else class="field-wrap">
                <component :is="'field-' + sItem.type" :model="item" :disabled="true" :schema="sItem" :form-options="{fieldIdPrefix: `record-${idx}-`}" />
              </div>
            </div>
          </div>
        </template>
        <div v-if="isDisplay('_updatedAt')" :style="getSize('_updatedAt')" class="cell input-update"><timeago :since="item._updatedAt || Date.now()" :locale="TranslateService.locale" /></div>
        <div class="cell actions">
          <button v-if="item._local" @click="edit(item)"><i class="fi-pencil" /></button>
          <button v-if="item._local" @click="remove(item)"><i class="fi-trash" /></button>
        </div>
      </div>
    </template>
  </div>
</template>

<script>

import _ from 'lodash'
import VueFormGenerator from 'vue-form-generator'
import TranslateService from '../../services/TranslateService'

export default {
  components: VueFormGenerator.component.components.formGroup.components,
  props: [
    'resource',
    'schema',
    'items',
    'locale',
    'options'
  ],
  data () {
    return {
      TranslateService,
      sortBy: null,
      actionsSize: 110,
      idSize: 180,
      updatedAtSize: 110
    }
  },
  computed: {
    orderedItem () {
      let list = this.items
      if (this.sortBy) {
        list = _.sortBy(list, (item) => _.get(item, this.sortBy.field))
        if (this.sortBy.reverse) {
          list = _.reverse(list)
        }
      }
      return list
    },
    schemaFields () {
      let fields = this.schema.fields
      let newFields = []
      _.forEach(fields, field => {
        if (_.get(field, 'options.breakdown', false)) {
          _.forEach(this.resource.locales, locale => {
            if (field.model === `${locale}.${field.originalModel}`) {
              field.localised = false
            } else {
              let newField = _.clone(field)
              newField.localised = false
              const name = field.originalModel && TranslateService.get(field.originalModel)
              newField.label = `${name} (${TranslateService.get(`TL_${locale.toUpperCase()}`)})`
              newField.model = `${locale}.${field.originalModel}`
              newFields.push(newField)
            }
          })
        }
      })
      fields = fields.concat(newFields)
      let list = _.filter(fields, (item) => _.isNumber(_.get(item, 'options.index', false)))
      if (_.isEmpty(list)) {
        return this.schema.fields
      }
      return _.sortBy(list, (item) => item.options.index)
    }
  },
  methods: {
    calculatedSize () {
      let size = this.actionsSize
      let totalFieldsCount = this.schemaFields.length + 1
      let sizedFieldsCount = 1
      if (this.options.displayId) {
        totalFieldsCount = totalFieldsCount + 1
        sizedFieldsCount = sizedFieldsCount + 1
        size = size + this.idSize
      }
      if (this.options.displayUpdatedAt) {
        totalFieldsCount = totalFieldsCount + 1
        sizedFieldsCount = sizedFieldsCount + 1
        size = size + this.updatedAtSize
      }
      for (const fieldItem of this.schemaFields) {
        const fieldSize = _.get(fieldItem, 'options.size', 'auto')
        if (fieldSize !== 'auto') {
          size = size + Number(fieldSize)
          sizedFieldsCount = sizedFieldsCount + 1
        }
      }
      return `width: calc((${100}% - ${size}px) / ${totalFieldsCount - sizedFieldsCount});`
    },
    getSize (sItem) {
      if (sItem === '_id' || sItem === '_updatedAt') {
        let size = this.idSize
        if (sItem === '_updatedAt') {
          size = this.updatedAtSize
        }
        return `max-width: ${size}px; min-width: ${size}px; width: ${size}px;`
      } else {
        const size = _.get(sItem, 'options.size', 'auto')
        if (size !== 'auto') {
          return `max-width: ${size}px; min-width: ${size}px; width: ${size}px;`
        }
        return this.calculatedSize()
      }
    },
    isDisplay (name) {
      if (name === '_id') {
        return this.options.displayId
      } else if (name === '_updatedAt') {
        return this.options.displayUpdatedAt
      } else {
        return true
      }
    },
    generateClass (name) {
      return {sortBy: this.sortBy && this.sortBy.field === name, reverse: this.sortBy && this.sortBy.field === name && this.sortBy.reverse}
    },
    display (item, sItem) {
      if (this.isImage(sItem)) {
        const attachments = _.get(item, '_attachments', [])
        if (sItem.localised) {
          const key = sItem.model.replace(`${this.locale}.`, '')
          const attachment = _.find(attachments, attachment => {
            return attachment._name === key && _.get(attachment, '_fields.locale', '?') === this.locale
          })
          return _.get(attachment, 'url', '')
        } else {
          const attachment = _.find(attachments, attachment => {
            return attachment._name === sItem.model
          })
          return _.get(attachment, 'url', '')
        }
      }
      return _.get(item, sItem.model, '')
    },
    isText (sItem) {
      return _.includes(['input', 'textArea', 'select'], sItem.type)
    },
    isImage (sItem) {
      return _.includes(['imageView'], sItem.type)
    },
    prepareValue (item, sItem) {
      return _.get(item, sItem.model)
    },
    remove (record) {
      this.$emit('remove', record)
    },
    edit (record) {
      this.$emit('edit', record)
    },
    setSortBy (field) {
      this.sortBy = this.sortBy || {}
      if (this.sortBy.field === field) {
        this.sortBy.reverse = !this.sortBy.reverse
      } else {
        this.sortBy.reverse = false
      }
      this.sortBy.field = field
      this.sortBy = _.clone(this.sortBy)
    }
  }

}
</script>
