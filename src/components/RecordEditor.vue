<template>
  <div v-if="record" class="record-editor" :class="{frozen:!record._local}">
    <v-tabs
      v-show="resource.locales"
      fixed-tabs
      background-color="white"
      dark
    >
      <v-tab
        v-for="item in resource.locales" :key="item"
        :class="{ active: item == locale }" class="locale"
        @click="selectLocale(item)"
      >
        {{ 'TL_'+item.toUpperCase() | translate }}
      </v-tab>
    </v-tabs>
    <!-- <vue-form-generator
      v-if="isReady"
      ref="vfg"
      :schema="schema"
      :model="editingRecord"
      :options="formOptions"
      @error="onError"
      @model-updated="onModelUpdated"
    /> -->
    <vuetify-form-base-ssr
      v-if="isReady"
      ref="vfg"
      :schema="schema.fields"
      :model="editingRecord"
      :options="formOptions"
      :row="rowOptions"
      @error="onError"
      @model-updated="onModelUpdated"
    />
    <!-- <vuetify-form-base-ssr
      v-if="isReady"
      ref="vfg"
      :schema="testFormSchema"
      :options="formOptions"
      :row="rowOptions"
      @error="onError"
      @model-updated="onModelUpdated"
    /> -->
    <!-- <pre>{{ editingRecord }}</pre> -->
    <div class="buttons">
      <button class="back" @click="back">{{ "TL_BACK" | translate }}</button>
      <button class="update" @click="updateRecord">{{ (editingRecord._id? "TL_UPDATE": "TL_CREATE") | translate }}</button>
      <button class="delete" @click="deleteRecord">{{ 'TL_DELETE' | translate }}</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios/dist/axios.min'
import _ from 'lodash'
// import VueFormGenerator from 'vue-form-generator'
import VuetifyFormBaseSsr from 'vuetify-form-base-ssr/src/vuetify-form-base-ssr.vue'

import TranslateService from '@s/TranslateService'
import AbstractEditorView from './AbstractEditorView'

export default {
  components: {
    // 'vue-form-generator': VueFormGenerator.component
    'vuetify-form-base-ssr': VuetifyFormBaseSsr
  },
  mixins: [AbstractEditorView],
  props: [
    'resourceList',
    'resource',
    'record',
    'locale',
    'userLocale'
  ],
  data () {
    return {
      cachedMap: {},
      editingRecord: {},
      originalFieldList: [],
      schema: { fields: [] },
      isReady: false,
      formOptions: {
        validateAfterLoad: true,
        validateAfterChanged: true
      },
      rowOptions: { justify: 'start', align: 'start', noGutters: false },
      testFormSchema: {
        name: { type: 'text', label: 'Name' },
        position: { type: 'text', label: 'Position' },
        tasks: {
          type: 'array',
          schema: {
            done: { type: 'checkbox', label: 'done', col: 4 },
            title: { type: 'text', col: 4 }
          }
        }
      }
    }
  },
  watch: {
    async locale () {
      await this.updateSchema()
      this.editingRecord = _.clone(this.editingRecord)
      this.checkDirty()
    },
    async record () {
      await this.updateSchema()
      this.cloneEditingRecord()
      this.removeDirtyFlags()
    },
    async userLocale () {
      await this.updateSchema()
      this.editingRecord = _.clone(this.editingRecord)
      this.checkDirty()
      this.updateValidationMessage()
    }
  },
  async mounted () {
    await this.updateSchema()
    this.cloneEditingRecord()
    this.removeDirtyFlags()
    this.updateValidationMessage()
    this.isReady = true
    console.warn('SCHEMA = ', this.schema)
    console.warn('EDITING RECORD = ', this.editingRecord)
    console.warn('FORM OPTIONS = ', this.formOptions)
  },
  methods: {
    back () {
      this.$emit('back')
    },
    onError (error) {
      console.log(999, 'error', error)
    },
    selectLocale (item) {
      this.$emit('update:locale', item)
    },
    cloneEditingRecord () {
      const dummy = {}
      _.each(this.resource.schema, (field) => {
        if (field.input === 'file' || field.input === 'image') {
          return
        }
        const isLocalised = this.resource.locales && (field.localised || _.isUndefined(field.localised))

        if (isLocalised) {
          _.each(this.resource.locales, (locale) => {
            const fieldName = `${locale}.${field.field}`
            let value = _.get(this.record, fieldName)
            if (field.input === 'pillbox') {
              value = value || []
            }
            if (_.includes(['code', 'json'], field.input)) {
              value = value || {}
            }
            if (_.isPlainObject(value)) {
              value = _.cloneDeep(value)
            }
            _.set(dummy, fieldName, value)
          })
        } else {
          const fieldName = field.field
          let value = _.get(this.record, fieldName)
          if (field.input === 'pillbox') {
            value = value || []
          }
          if (_.includes(['code', 'json'], field.input)) {
            value = value || {}
          }
          if (_.isPlainObject(value)) {
            value = _.cloneDeep(value)
          }
          _.set(dummy, fieldName, value)
        }
      })
      this.editingRecord = _.clone(dummy)
      this.editingRecord._id = this.record._id
      try {
        this.editingRecord._attachments = _.cloneDeep(this.record._attachments || [])
      } catch (error) {
        console.error('Error during cloneEditingRecord:', error)
        this.editingRecord._attachments = []
      }
    },
    async deleteRecord () {
      if (!window.confirm(
        TranslateService.get('TL_ARE_YOU_SURE_TO_DELETE'),
        TranslateService.get('TL_YES'),
        TranslateService.get('TL_NO')
      )) {
        return
      }
      if (_.isUndefined(this.editingRecord._id)) {
        this.editingRecord = {}
        this.$emit('update:record', null)
      } else {
        this.$loading.start('delete-record')
        try {
          await axios.delete(`../api/${this.resource.title}/${this.editingRecord._id}`)
          this.$notify({
            group: 'notification',
            text: TranslateService.get('TL_RECORD_DELETED', null, { id: this.editingRecord._id })
          })
          this.$emit('updateRecordList', null)
        } catch (error) {
          console.error('Error happen during deleteRecord:', error)
          this.manageError(error, 'delete', this.editingRecord)
        }
        this.$loading.stop('delete-record')
      }
    },
    async updateRecord () {
      let isValid = false
      try {
        isValid = this.$refs.vfg.validate()
      } catch (error) {
        isValid = false
      }
      if (!isValid) {
        this.$notify({
          group: 'notification',
          type: 'error',
          text: this.editingRecord._id ? TranslateService.get('TL_ERROR_CREATING_RECORD_ID', null, { id: this.editingRecord._id }) : TranslateService.get('TL_ERROR_CREATING_RECORD')
        })
        return
      }

      const uploadObject = {}
      _.each(this.resource.schema, (field) => {
        if (field.input === 'file') {
          return
        }
        if (field.input === 'image') {
          return
        }
        const isLocalised = this.resource.locales && (field.localised || _.isUndefined(field.localised))

        if (isLocalised) {
          _.each(this.resource.locales, (locale) => {
            const fieldName = `${locale}.${field.field}`
            let value = _.get(this.editingRecord, fieldName)
            if (field.input === 'pillbox') {
              value = value || []
            }
            if (_.includes(['code', 'json'], field.input)) {
              value = value || {}
            }
            if (_.isEqual(value, _.get(this.record, fieldName))) {
              return
            }
            _.set(uploadObject, fieldName, value)
          })
        } else {
          const fieldName = field.field
          let value = _.get(this.editingRecord, fieldName)
          if (field.input === 'pillbox') {
            value = value || []
          }
          if (_.includes(['code', 'json'], field.input)) {
            value = value || {}
          }
          if (_.isEqual(value, _.get(this.record, fieldName))) {
            return
          }
          _.set(uploadObject, fieldName, value)
        }
      })

      const newAttachments = _.filter(this.editingRecord._attachments, item => !item._id)
      const removeAttachments = _.filter(this.record._attachments, item => !_.find(this.editingRecord._attachments, { _id: item._id }))

      if (_.isUndefined(this.editingRecord._id)) {
        this.$loading.start('create-record')
        try {
          const response = await axios.post(`../api/${this.resource.title}`, uploadObject)
          await this.uploadAttachments(response.data._id, newAttachments)
          this.$notify({
            group: 'notification',
            text: TranslateService.get('TL_RECORD_CREATED', null, { id: response.data._id })
          })
          this.$emit('updateRecordList', response.data)
        } catch (error) {
          console.error('Error happen during updateRecord/create:', error)
          this.manageError(error, 'create')
        }
        this.$loading.stop('create-record')
      } else {
        this.$loading.start('update-record')
        try {
          let response
          if (!_.isEmpty(uploadObject)) {
            response = await axios.put(`../api/${this.resource.title}/${this.editingRecord._id}`, uploadObject)
          } else {
            response = { data: this.editingRecord }
          }
          await this.uploadAttachments(response.data._id, newAttachments)
          await this.removeAttachments(response.data._id, removeAttachments)
          this.$notify({
            group: 'notification',
            text: TranslateService.get('TL_RECORD_UPDATED', null, { id: this.editingRecord._id })
          })
          this.$emit('updateRecordList', response.data)
        } catch (error) {
          console.error('Error happen during updateRecord/update:', error)
          this.manageError(error, 'update', this.editingRecord)
        }
        this.$loading.stop('update-record')
      }
    },
    onModelUpdated () {
      this.$refs.vfg.validate()
      this.checkDirty()
    },
    checkDirty () {
      _.each(this.originalFieldList, (field) => {
        let isEqual = true
        switch (field.type) {
          case 'attachmentView':
          case 'imageView':
            const { key, locale } = this.getKeyLocale(field)
            const list1 = _.filter(this.record._attachments, attachment => attachment._name === key && (attachment._fields && attachment._fields.locale) === locale)
            const list2 = _.filter(this.editingRecord._attachments, attachment => attachment._name === key && (attachment._fields && attachment._fields.locale) === locale)
            isEqual = _.isEqual(list1, list2)
            break
          default:
            isEqual = _.isEqual(_.get(this.record, field.model), _.get(this.editingRecord, field.model))
        }
        field.labelClasses = isEqual ? '' : 'dirty'
      })
    },
    removeDirtyFlags () {
      _.each(this.originalFieldList, (field) => {
        delete field.labelClasses
      })
    },
    updateValidationMessage () {
      console.warn('updateValidationMessage - TEST')
      // VueFormGenerator.validators.resources.fieldIsRequired = TranslateService.get('TL_FIELD_IS_REQUIRED')
      // VueFormGenerator.validators.resources.invalidFormat = TranslateService.get('TL_INVALID_FORMAT')
    },
    getKeyLocale (schema) {
      const options = {}
      const list = schema.model.split('.')
      if (schema.localised) {
        options.locale = list.shift()
      }
      options.key = list.join('.')
      return options
    }
  }
}
</script>
