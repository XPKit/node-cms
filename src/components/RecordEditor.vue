<template>
  <v-card v-if="record" :dark="$vuetify.theme.dark" elevation="0" class="record-editor" :class="{frozen:!record._local}">
    <div class="top-bar">
      <top-bar-locale-list :locales="resource.locales" :locale="locale" :select-locale="selectLocale" :back="back" />
      <div class="buttons">
        <v-btn v-if="editingRecord._id" elevation="0" class="delete" icon @click="deleteRecord"><v-icon>mdi-trash-can-outline</v-icon></v-btn>
        <v-btn elevation="0" class="update" rounded @click="createUpdateClicked">{{ $filters.translate(editingRecord._id? "TL_UPDATE": "TL_CREATE") }}</v-btn>
      </div>
    </div>
    <div class="scroll-wrapper" :class="{'scrolled-to-bottom': scrolledToBottom}" @scroll="onScroll">
      <v-form :id="randomId" ref="vfg" v-model="formValid" class="record-editor-form" lazy-validation>
        <custom-form
          v-if="isReady"
          v-model:model="editingRecord"
          :schema="schema" :form-id="randomId"
          :form-options="formOptions"
          :paragraph-level="1"
          @error="onError" @input="onModelUpdated"
        />
      </v-form>
    </div>
  </v-card>
</template>

<script>
import _ from 'lodash'

import TranslateService from '@s/TranslateService'
import FieldSelectorService from '@s/FieldSelectorService'
import AbstractEditorView from './AbstractEditorView'
import Notification from '@m/Notification.vue'
import TopBarLocaleList from '@c/TopBarLocaleList.vue'
import RequestService from '@s/RequestService'
import ResourceService from '@s/ResourceService'

export default {
  components: {TopBarLocaleList},
  mixins: [AbstractEditorView, Notification],
  props: {
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
      scrolledToBottom: false,
      randomId: Math.random(),
      formValid: false,
      fileInputTypes: ['file', 'img', 'image', 'imageView', 'attachmentView'],
      cachedMap: {},
      editingRecord: {},
      originalFieldList: [],
      schema: { fields: [] },
      isReady: false,
      formElem: false,
      formOptions: {
        validateAfterLoad: true,
        validateAfterChanged: true
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
    },
    async userLocale () {
      await this.updateSchema()
      this.editingRecord = _.clone(this.editingRecord)
      this.checkDirty()
    }
    // model () {
    //   console.warn('MODEL CHANGED: ', this.model)
    // }
  },
  async mounted () {
    await this.updateSchema()
    this.cloneEditingRecord()
    this.isReady = true
    // console.warn('EDITING RECORD - ', this.editingRecord)
    FieldSelectorService.events.on('select', this.onFieldSelected)
    this.$nextTick(() => {
      this.formElem = document.getElementById(this.randomId)
    })
  },
  beforeUnmount () {
    FieldSelectorService.events.off('select', this.onFieldSelected)
  },
  methods: {
    onScroll ({ target: { scrollTop, clientHeight, scrollHeight } }) {
      this.scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 50
    },
    toggleLocale () {
      this.selectLocale(_.find(this.resource.locales, (l) => l !== this.locale))
    },
    getLocaleTranslation (locale) {
      return TranslateService.get('TL_' + locale.toUpperCase())
    },
    getFieldRealOffset (elem) {
      // NOTE: Minus the navbar height
      return _.get(elem, '$el.offsetTop', elem.offsetTop) - 50
    },
    onFieldSelected (field) {
      this.schema.fields = _.map(this.schema.fields, (f) => {
        const key = `${field.field}${f.localised ? `.${TranslateService.locale}` : ''}`
        if (f.model === key) {
          const elem = document.getElementById(`${key}-${this.randomId}`)
          const top = this.getFieldRealOffset(elem)
          this.formElem.scrollTo({top})
        }
        return f
      })
    },
    back () {
      this.$emit('back')
    },
    onError (error) {
      console.log(999, 'error', error)
    },
    selectLocale (item) {
      this.$emit('update:locale', item)
    },
    cloneValue(field, value) {
      if (field.input === 'pillbox') {
        return value || []
      }
      if (field.input === 'json') {
        return value || {}
      }
      if (_.isPlainObject(value)) {
        value = _.cloneDeep(value)
      }
      return value
    },
    cloneEditingRecord () {
      const dummy = {}
      _.each(this.resource.schema, (field) => {
        if (this.resource.locales && (field.localised || _.isUndefined(field.localised))) {
          _.each(this.resource.locales, (locale) => {
            const fieldName = `${field.field}.${locale}`
            let value = _.get(this.record, fieldName)
            _.set(dummy, fieldName, this.cloneValue(field, value))
          })
        } else {
          const fieldName = field.field
          let value = _.get(this.record, fieldName)
          _.set(dummy, fieldName, this.cloneValue(field, value))
        }
      })
      this.editingRecord = _.clone(dummy)
      this.editingRecord._id = this.record._id
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
          await RequestService.delete(`../api/${this.resource.title}/${this.editingRecord._id}`)
          this.notify(TranslateService.get('TL_RECORD_DELETED', null, { id: this.editingRecord._id }))
          this.$emit('updateRecordList', null)
        } catch (error) {
          console.error('Error happen during deleteRecord:', error)
          this.manageError(error, 'delete', this.editingRecord)
        }
        this.$loading.stop('delete-record')
      }
    },
    async checkFormValid () {
      let formValid = false
      try {
        this.$refs.vfg.resetValidation()
        formValid = _.get(await this.$refs.vfg.validate(), 'valid', false)
      } catch (error) {
        console.error('Not valid: ', error)
        formValid = false
      }
      const firstInvalidField = _.find(this.$refs.vfg.items, (input) => !input.isValid)
      console.error('First invalid field', firstInvalidField)
      if (!_.isUndefined(firstInvalidField)) {
        formValid = false
        document.querySelector(`#${firstInvalidField.id}`).focus()
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
    getLocalisedFieldValue (originalData, data, field) {
      let fieldValue = {}
      _.each(this.resource.locales, (locale) => {
        if (!this.formValid) {
          return this.handleFormNotValid()
        }
        const fieldName = `${field.field}.${locale}`
        const value = this.fieldValueOrDefault(field, _.get(data, fieldName))
        if (locale !== this.locale && field.required &&
        (_.isUndefined(value) || (field.input === 'string' && value.length === 0))) {
          this.selectLocale(locale)
          this.formValid = false
          this.$forceUpdate()
          this.$nextTick(async () => {
            await this.checkFormValid()
          })
          console.warn('required field empty', field, this.formValid)
          return
        }
        if (_.includes(this.fileInputTypes, field.input) || !_.isEqual(value, _.get(originalData, fieldName))) {
          _.set(fieldValue, fieldName, _.isUndefined(value) ? null : value)
        }
      })
      return fieldValue
    },
    handleFormNotValid () {
      console.info('form not valid')
    },
    getFieldValue(originalData, data, field) {
      const isLocalised = this.resource.locales && (field.localised || _.isUndefined(field.localised))
      if (isLocalised) {
        return this.getLocalisedFieldValue(originalData, data, field)
      }
      const fieldName = field.field
      const value = this.fieldValueOrDefault(field, _.get(data, fieldName))
      if (!_.isEqual(value, _.get(originalData, fieldName))) {
        const obj = {}
        _.set(obj, fieldName, _.isUndefined(value) ? null : value)
        return obj
      }
      return value
    },
    getDataToUpload(resource, originalRecord, record, uploadObject = {}, allAttachments = [], isParagraph = false) {
      const schema = _.get(resource, 'schema', [])
      const attachmentFields = _.get(resource, '_attachments', [])
      _.each(schema, (field) => {
        let fieldValue = this.getFieldValue(originalRecord, record, field)
        if (_.includes(attachmentFields, field.field)) {
          let attachmentsArray = _.get(fieldValue, field.field, fieldValue)
          if (field.localised) {
            _.each(this.resource.locales, (locale)=> {
              _.each(_.get(attachmentsArray, locale, []), (attachment)=> {
                allAttachments.push(attachment)
              })
            })
          } else {
            if (isParagraph)  {
              attachmentsArray = _.get(record, field.field, [])
            }
            _.each(attachmentsArray, (attachment)=> {
              allAttachments.push(attachment)
            })
          }
          return
        } else if (field.input === 'paragraph' && !_.isUndefined(fieldValue)) {
          const paragraphs = _.get(fieldValue, field.field, [])
          if (!paragraphs) {
            return
          }
          if (paragraphs.length !== 0) {
            const newFieldValue = {}
            _.each(paragraphs, (paragraph)=> {
              const paragraphSchema = ResourceService.getParagraphSchema(paragraph._type)
              const test = this.getDataToUpload(paragraphSchema, originalRecord, paragraph, {}, allAttachments, true)
              const obj = test.uploadObject
              obj._type = paragraph._type
              const array = _.get(newFieldValue, field.field, [])
              array.push(obj)
              _.set(newFieldValue, field.field, array)
            })
            fieldValue = newFieldValue
          } else {
            fieldValue = undefined
          }
        }
        uploadObject = _.extend(uploadObject, fieldValue)
      })
      return {uploadObject, allAttachments}
    },
    async createUpdateClicked () {
      await this.checkFormValid()
      if (!this.formValid) {
        return this.handleFormNotValid()
      }
      // console.warn('BEFORE ---', _.cloneDeep(this.editingRecord))
      const { uploadObject, allAttachments } = this.getDataToUpload(this.resource, this.record, this.editingRecord)
      // console.warn('UPLOAD OBJECT', uploadObject)
      // console.warn('All ATTACHMENTS', allAttachments)
      const newAttachments = _.filter(allAttachments, item => !item._id)
      if (!_.isEmpty(allAttachments)) {
        console.info('All attachments ', allAttachments)
      }
      if (!_.isEmpty(newAttachments)) {
        console.info('New attachments ', newAttachments)
      }
      if (!this.formValid) {
        return this.handleFormNotValid()
      }
      if (_.isUndefined(this.editingRecord._id)) {
        return this.createRecord(uploadObject, newAttachments)
      }
      this.updateRecord(uploadObject, newAttachments, allAttachments)
    },
    async createRecord (uploadObject, newAttachments) {
      this.$loading.start('create-record')
      try {
        let data = await RequestService.post(`../api/${this.resource.title}`, uploadObject)
        await this.uploadAttachments(data._id, newAttachments)
        this.notify(TranslateService.get('TL_RECORD_CREATED', null, { id: data._id }))
        this.$emit('updateRecordList', data)
      } catch (error) {
        console.error('Error happen during createRecord:', error)
        this.manageError(error, 'create')
      }
      this.$loading.stop('create-record')
    },
    async handleAttachmentsUpdates(previousData, currentData, uploadObject, newAttachments, allAttachments) {
      await this.uploadAttachments(this.editingRecord._id, newAttachments)
      const newAttachmentsIds = _.map(newAttachments, '_id')
      const updatedAttachments = _.filter(allAttachments, item => {
        return item._id && !_.includes(newAttachmentsIds, item._id) && (_.get(item, 'cropOptions.updated', false) || _.get(item, 'orderUpdated', false))
      })
      if (!_.isEmpty(updatedAttachments)) {
        // console.warn('UPDATED ATTACHMENTS = ', _.map(updatedAttachments, a => `${a.order}-${a._filename}`))
        await this.updateAttachments(this.editingRecord._id, updatedAttachments)
      }
      const removedAttachments = _.filter(previousData.allAttachments, item => !_.find(currentData.allAttachments, { _id: item._id }))
      if (!_.isEmpty(removedAttachments)) {
        // console.warn('REMOVED ATTACHMENTS = ', removedAttachments)
        await this.removeAttachments(this.editingRecord._id, removedAttachments)
      }
    },
    async updateRecord (uploadObject, newAttachments, allAttachments) {
      this.$loading.start('update-record')
      try {
        let data = this.editingRecord
        const previousData = this.getDataToUpload(this.resource, {}, this.record)
        const currentData = this.getDataToUpload(this.resource, {}, this.editingRecord)
        await this.handleAttachmentsUpdates(previousData, currentData, uploadObject, newAttachments, allAttachments)
        const url = `../api/${this.resource.title}/${this.editingRecord._id}`
        if (!_.isEmpty(uploadObject)) {
          console.info('Will send', uploadObject)
          data = await RequestService.put(url, uploadObject)
        } else {
          data = await RequestService.get(url)
          // data = await RequestService.get(url)
        }
        this.notify(TranslateService.get('TL_RECORD_UPDATED', null, { id: this.editingRecord._id }))
        this.$emit('updateRecordList', data)
        console.log('record is now: ', data)
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
    getUpdatedAttachments (attachments) {
      return _.filter(attachments, (attachment) => _.get(attachment, 'cropOptions.updated', false))
    },
    updateFields (value, model) {
      if (!model || _.isUndefined(model)) {
        // console.info('No model found for value', value)
        return
      }
      _.set(this.editingRecord, model, value)
      console.warn(`Updated ${model} in record`, value, _.cloneDeep(this.editingRecord))
    },
    onModelUpdated (value, model) {
      // console.warn('ON MODEL UPDATED', model, value, _.cloneDeep(this.editingRecord))
      this.updateFields(value, model)
      this.checkDirty()
    },
    isAttachmentField (model) {
      const foundField = _.get(_.find(_.get(this.schema, 'fields', []), {model: model}), 'originalModel', false)
      const fieldType = _.get(_.find(this.resource.schema, {field: foundField}), 'input', false)
      return _.includes(this.fileInputTypes, fieldType)
    },
    checkDirty () {
      _.each(this.originalFieldList, (field) => {
        let isEqual = _.isEqual(_.get(this.record, field.model), _.get(this.editingRecord, field.model))
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
        options.locale = list.pop()
      }
      options.key = list.join('.')
      return options
    }
  }
}
</script>
