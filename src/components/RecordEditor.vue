<template>
  <div v-if="record" class="record-editor" :class="{frozen:!record._local}">
    <v-tabs
      v-show="resource.locales"
      v-model="activeLocale"
      fixed-tabs background-color="white" dark height="39" hide-slider
    >
      <v-tab
        v-for="item in resource.locales" :key="item"
        class="locale"
        @click="selectLocale(item)"
      >
        {{ 'TL_'+item.toUpperCase() | translate }}
      </v-tab>
    </v-tabs>
    <v-form
      ref="vfg"
      v-model="formValid"
      lazy-validation
    >
      <custom-form
        v-if="isReady"
        :schema="schema"
        :form-options="formOptions"
        :model.sync="editingRecord"
        :row="rowOptions"
        @error="onError"
        @input="onModelUpdated"
      />
    </v-form>
    <div class="buttons">
      <v-btn class="back" @click="back">{{ "TL_BACK" | translate }}</v-btn>
      <v-btn class="update" color="primary" @click="createUpdateClicked">{{ (editingRecord._id? "TL_UPDATE": "TL_CREATE") | translate }}</v-btn>
      <v-btn class="delete" color="error" @click="deleteRecord">{{ 'TL_DELETE' | translate }}</v-btn>
    </div>
  </div>
</template>

<script>
import axios from 'axios/dist/axios.min'
import _ from 'lodash'

import TranslateService from '@s/TranslateService'
import AbstractEditorView from './AbstractEditorView'
import Notification from '@m/Notification'

export default {
  mixins: [AbstractEditorView, Notification],
  props: {
    resourceList: {
      type: [Array, Boolean],
      default: () => []
    },
    resource: {
      type: Object,
      default: () => {}
    },
    record: {
      type: Object,
      default: () => {}
    },
    locale: {
      type: String,
      default: () => 'enUS'
    },
    userLocale: {
      type: String,
      default: () => 'enUS'
    }
  },
  data () {
    return {
      formValid: false,
      fileInputTypes: ['file', 'img', 'image', 'imageView', 'attachmentView'],
      cachedMap: {},
      editingRecord: {},
      activeLocale: _.indexOf(this.resource.locales, this.locale),
      originalFieldList: [],
      schema: { fields: [] },
      isReady: false,
      formOptions: {
        validateAfterLoad: true,
        validateAfterChanged: true
      },
      // TODO: hugo - LATER -  put the formatting in the resource's definition to allow custom layout
      rowOptions: { justify: 'start', align: 'start', noGutters: false }
    }
  },
  watch: {
    async locale () {
      await this.updateSchema()
      this.editingRecord = _.clone(this.editingRecord)
      this.activeLocale = _.indexOf(this.resource.locales, this.locale)
      this.checkDirty()
    },
    async record () {
      await this.updateSchema()
      this.cloneEditingRecord()
    },
    async userLocale () {
      await this.updateSchema()
      this.editingRecord = _.clone(this.editingRecord)
      this.checkDirty()
    },
    model () {
      console.warn('MODEL CHANGED: ', this.model)
    }
  },
  async mounted () {
    await this.updateSchema()
    this.cloneEditingRecord()
    this.isReady = true
    console.warn('EDITING RECORD - ', this.editingRecord)
  },
  methods: {
    back () {
      this.$emit('back')
    },
    onError (error) {
      console.log(999, 'error', error)
    },
    selectLocale (item) {
      this.activeLocale = _.indexOf(this.resource.locales, item)
      this.$emit('update:locale', item)
    },
    cloneEditingRecord () {
      const dummy = {}
      _.each(this.resource.schema, (field) => {
        if (_.includes(this.fileInputTypes, field.input)) {
          return
        }
        const isLocalised = this.resource.locales && (field.localised || _.isUndefined(field.localised))

        if (isLocalised) {
          _.each(this.resource.locales, (locale) => {
            const fieldName = `${locale}.${field.field}`
            let value = _.get(this.record, fieldName)
            if (field.input === 'pillbox') {
              value = value || []
            } else if (field.input === 'json') {
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
          if (field.input === 'json') {
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
      this.removeDirtyFlags()
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
          this.notify(TranslateService.get('TL_RECORD_DELETED', null, { id: this.editingRecord._id }))
          this.$emit('updateRecordList', null)
        } catch (error) {
          console.error('Error happen during deleteRecord:', error)
          this.manageError(error, 'delete', this.editingRecord)
        }
        this.$loading.stop('delete-record')
      }
    },
    checkFormValid () {
      let formValid = false
      try {
        formValid = this.$refs.vfg.validate()
      } catch (error) {
        console.error('Not valid: ', error)
        formValid = false
      }
      const firstInvalidField = _.find(this.$refs.vfg.inputs, (input) => !input.valid)
      if (!_.isUndefined(firstInvalidField)) {
        formValid = false
        firstInvalidField.focus()
      }
      this.formValid = formValid
      if (!this.formValid) {
        const notificationText = this.editingRecord._id ? TranslateService.get('TL_ERROR_CREATING_RECORD_ID', null, { id: this.editingRecord._id }) : TranslateService.get('TL_ERROR_CREATING_RECORD')
        this.notify(notificationText, 'error')
      }
    },
    fieldValueOrDefault (field, value) {
      if (field.input === 'pillbox') {
        return value || []
      } else if (field.input === 'json') {
        return value || {}
      }
      return value
    },
    updateLocalisedField (uploadObject, field) {
      _.each(this.resource.locales, (locale) => {
        if (!this.formValid) {
          return this.handleFormNotValid()
        }
        const fieldName = `${locale}.${field.field}`
        const value = this.fieldValueOrDefault(field, _.get(this.editingRecord, fieldName))
        if (locale !== this.locale && field.required &&
        (_.isUndefined(value) || (field.input === 'string' && value.length === 0))) {
          this.selectLocale(locale)
          this.formValid = false
          this.$forceUpdate()
          this.$nextTick(() => {
            this.checkFormValid()
          })
          console.warn('required field empty', field, this.formValid)
          return
        }
        if (!_.isEqual(value, _.get(this.record, fieldName))) {
          _.set(uploadObject, fieldName, value)
        }
      })
    },
    handleFormNotValid () {
      console.info('form not valid')
    },
    async createUpdateClicked () {
      this.checkFormValid()
      if (!this.formValid) {
        return this.handleFormNotValid()
      }
      const uploadObject = {}
      _.each(this.resource.schema, (field) => {
        if (!this.formValid || _.includes(this.fileInputTypes, field.input)) {
          return
        }
        const isLocalised = this.resource.locales && (field.localised || _.isUndefined(field.localised))
        if (isLocalised) {
          this.updateLocalisedField(uploadObject, field)
        } else {
          const fieldName = field.field
          const value = this.fieldValueOrDefault(field, _.get(this.editingRecord, fieldName))
          if (!_.isEqual(value, _.get(this.record, fieldName))) {
            _.set(uploadObject, fieldName, value)
          }
        }
      })
      const newAttachments = _.filter(this.editingRecord._attachments, item => !item._id)
      if (!_.isEmpty(newAttachments)) {
        console.warn('NEW ATTACHMENTS = ', newAttachments)
      }
      if (!this.formValid) {
        return this.handleFormNotValid()
      }
      if (_.isUndefined(this.editingRecord._id)) {
        return this.createRecord(uploadObject, newAttachments)
      }
      this.updateRecord(uploadObject, newAttachments)
    },
    async createRecord (uploadObject, newAttachments) {
      this.$loading.start('create-record')
      try {
        const {data} = await axios.post(`../api/${this.resource.title}`, uploadObject)
        await this.uploadAttachments(data._id, newAttachments)
        this.notify(TranslateService.get('TL_RECORD_CREATED', null, { id: data._id }))
        this.$emit('updateRecordList', data)
      } catch (error) {
        console.error('Error happen during createRecord:', error)
        this.manageError(error, 'create')
      }
      this.$loading.stop('create-record')
    },
    async updateRecord (uploadObject, newAttachments) {
      this.$loading.start('update-record')
      try {
        let data = this.editingRecord
        console.warn('Will send', uploadObject)
        if (!_.isEmpty(uploadObject)) {
          const response = await axios.put(`../api/${this.resource.title}/${this.editingRecord._id}`, uploadObject)
          data = response.data
        }
        await this.uploadAttachments(data._id, newAttachments)
        const newAttachmentsIds = _.map(newAttachments, '_id')
        const updatedAttachments = _.filter(this.editingRecord._attachments, item => {
          return item._id && !_.includes(newAttachmentsIds, item._id) && (_.get(item, 'cropOptions.updated', false) || _.get(item, 'orderUpdated', false))
        })
        if (!_.isEmpty(updatedAttachments)) {
          console.warn('UPDATED ATTACHMENTS = ', _.map(updatedAttachments, a => `${a.orderUpdated}-${a.order}-${a._filename}`))
          await this.updateAttachments(data._id, updatedAttachments)
        }
        const removedAttachments = _.filter(this.record._attachments, item => !_.find(this.editingRecord._attachments, { _id: item._id }))
        if (!_.isEmpty(removedAttachments)) {
          console.warn('REMOVED ATTACHMENTS = ', _.map(removedAttachments, a => `${a.order}-${a._filename}`))
          await this.removeAttachments(data._id, removedAttachments)
        }
        this.notify(TranslateService.get('TL_RECORD_UPDATED', null, { id: this.editingRecord._id }))
        this.$emit('updateRecordList', data)
      } catch (error) {
        console.error('Error happen during updateRecord:', error)
        this.manageError(error, 'update', this.editingRecord)
      }
      this.$loading.stop('update-record')
    },
    getAttachmentModel (attachment) {
      const modelParts = []
      if (_.get(attachment, '_fields.locale', false)) {
        modelParts.push(attachment._fields.locale)
      }
      modelParts.push(attachment._name)
      return _.join(modelParts, '.')
    },
    updateFields (value, model) {
      if (!this.isAttachmentField(model)) {
        return _.set(this.editingRecord, model, value)
      }
      _.set(this.editingRecord, '_attachments', value)
      console.info(`Will update attachment ${model}`, value)
    },
    onModelUpdated (value, model) {
      this.updateFields(value, model)
      console.info('editingRecord =', this.editingRecord)
      this.$refs.vfg.validate()
      this.checkDirty()
    },
    isAttachmentField (model) {
      const foundField = _.get(_.find(_.get(this.schema, 'fields', []), {model: model}), 'originalModel', false)
      const fieldType = _.get(_.find(this.resource.schema, {field: foundField}), 'input', false)
      return _.includes(this.fileInputTypes, fieldType)
    },
    checkDirty () {
      _.each(this.originalFieldList, (field) => {
        let isEqual = true
        if (_.includes(['AttachmentView', 'ImageView'], field.type)) {
          const { key, locale } = this.getKeyLocale(field)
          const list1 = _.filter(this.record._attachments, attachment => attachment._name === key && (attachment._fields && attachment._fields.locale) === locale)
          const list2 = _.filter(this.editingRecord._attachments, attachment => attachment._name === key && (attachment._fields && attachment._fields.locale) === locale)
          isEqual = _.isEqual(list1, list2)
        } else {
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
