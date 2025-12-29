<template>
  <v-card v-if="record" :dark="$vuetify.theme.dark" elevation="0" class="record-editor" :class="{frozen:!record._local, 'full-width': resource && resource.maxCount === 1}">
    <div class="top-bar">
      <top-bar-locale-list :locales="resource.locales" :locale="locale" :select-locale="selectLocale" :back="back" />
      <div class="buttons">
        <v-btn v-if="editingRecord._id" elevation="0" class="delete" icon @click="deleteRecord"><v-icon icon="$trashCanOutline" /></v-btn>
        <v-btn elevation="0" class="update" :class="{blinking: blinkButton}" rounded :disabled="!canCreateUpdate" @click="createUpdateClicked">{{ getActionText() }}</v-btn>
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
          @input="onModelUpdated"
        />
      </v-form>
    </div>
  </v-card>
</template>

<script>
  import _ from 'lodash'
  import { flatten } from 'flat'
  import pAll from 'p-all'
  import TranslateService from '@s/TranslateService'
  import FieldSelectorService from '@s/FieldSelectorService'
  import AbstractEditorView from './AbstractEditorView'
  import Notification from '@m/Notification'
  import TopBarLocaleList from '@c/TopBarLocaleList.vue'
  import RequestService from '@s/RequestService'

  export default {
    components: {TopBarLocaleList},
    mixins: [AbstractEditorView, Notification],
    props: {
      resource: { type: Object, default: () => ({}) },
      record: { type: Object, default: () => ({}) },
      locale: { type: String, default: () => 'enUS' },
      userLocale: { type: String, default: () => 'enUS' }
    },
    data () {
      return {
        canCreateUpdate: true,
        blinkButton: false,
        blinkButtonTimeout: false,
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
        this.editingRecord = _.cloneDeep(this.editingRecord)
        this.checkDirty()
      },
      async record () {
        await this.updateSchema()
        this.cloneEditingRecord()
      },
      async userLocale () {
        await this.updateSchema()
        this.editingRecord = _.cloneDeep(this.editingRecord)
        this.checkDirty()
      }
    },
    async mounted () {
      await this.updateSchema()
      this.cloneEditingRecord()
      this.isReady = true
      // console.info('EDITING RECORD - ', this.editingRecord)
      FieldSelectorService.events.on('select', this.onFieldSelected)
      await this.$nextTick()
      this.formElem = document.getElementById(this.randomId)
    },
    beforeUnmount () {
      FieldSelectorService.events.off('select', this.onFieldSelected)
    },
    methods: {
      getActionText() {
        return TranslateService.get(this.editingRecord._id ? 'TL_UPDATE' : 'TL_CREATE')
      },
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
        return _.get(elem, '$el.offsetTop', elem.offsetTop, 0) - 50
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
      selectLocale (item) {
        this.$emit('update:locale', item)
      },
      cloneValue(field, value) {
        value = this.fieldValueOrDefault(field, value)
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
        this.editingRecord = _.cloneDeep(dummy)
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
            this.notify(TranslateService.get('TL_RECORD_DELETED', { id: this.editingRecord._id }))
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
        if (!_.isUndefined(firstInvalidField)) {
          console.error('First invalid field', firstInvalidField)
          formValid = false
          document.querySelector(`#${firstInvalidField.id}`).focus()
        }
        this.formValid = formValid
        // TODO: hugo - check validation of fields which aren't part of vuetify i.e, WYSIWYG fields
        this.canCreateUpdate = true
        if (!this.formValid) {
          // const notificationText = this.editingRecord._id ? TranslateService.get('TL_ERROR_CREATING_RECORD_ID', { id: this.editingRecord._id }) : TranslateService.get('TL_ERROR_CREATING_RECORD')
          const notificationText = TranslateService.get('TL_FORM_IS_INVALID')
          this.notify(notificationText, 'error')
          this.blinkButton = true
          clearTimeout(this.blinkButtonTimeout)
          this.blinkButtonTimeout = setTimeout(() => {
            this.blinkButton = false
          }, 500)
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
            // return this.handleFormNotValid(`getLocalisedFieldValue - ${locale}`)
            return
          }
          const fieldName = `${field.field}.${locale}`
          const value = this.fieldValueOrDefault(field, _.get(data, fieldName))
          if (field.required &&
            (_.isUndefined(value) || (field.input === 'string' && value.length === 0))) {
            if (locale !== this.locale) {
              this.selectLocale(locale)
            }
            this.formValid = false
            this.canCreateUpdate = true
            this.$forceUpdate()
            this.$nextTick(async () => {
              await this.checkFormValid()
            })
            console.error('required field empty 1', locale, field, fieldName, fieldValue, value)
            // this.notify(TranslateService.get('TL_REQUIRED_FIELD_EMPTY', 'error'))
            return
          }
          if (_.includes(this.fileInputTypes, field.input) || !_.isEqual(value, _.get(originalData, fieldName))) {
            _.set(fieldValue, fieldName, _.isUndefined(value) ? null : value)
          }
        })
        return fieldValue
      },
      handleFormNotValid (msg) {
        console.info('form not valid', msg)
      },
      getFieldValue(originalData, data, field) {
        const isLocalised = this.resource.locales && (field.localised || _.isUndefined(field.localised))
        if (isLocalised) {
          return this.getLocalisedFieldValue(originalData, data, field)
        }
        const fieldName = field.field
        const value = this.fieldValueOrDefault(field, _.get(data, fieldName))
        const originalValue = _.get(originalData, fieldName)
        if (!_.isEqual(value, originalValue)) {
          const obj = {}
          _.set(obj, fieldName, _.isUndefined(value) ? null : value)
          return obj
        }
        if (field.required &&
          (_.isUndefined(value) || (field.input === 'string' && value.length === 0))) {
          this.formValid = false
          this.canCreateUpdate = true
          this.$forceUpdate()
          this.$nextTick(async () => {
            await this.checkFormValid()
          })
          console.error('required field empty 2', field, this.formValid)
          return
        }
        return value
      },
      getAttachmentsOfRecord(resource, record) {
        let attachments = []
        let attachmentsPaths = []
        const fieldsRegExpressions = _.keys(_.get(resource, '_attachmentFields', {}))
        const locales = _.get(resource, 'locales', [])
        const content = flatten(record)
        for (const key in content) {
          if (_.endsWith(key, '_isAttachment')) {
            let filePath = key.slice(0, -1 * '._isAttachment'.length)
            let attachment = _.cloneDeep(_.get(record, filePath, false))
            if (attachment) {
              let hasFoundAny = false
              _.each(fieldsRegExpressions, fieldsRegExpression => {
                const regex = new RegExp(fieldsRegExpression, 'g')
                let match = regex.exec(filePath)
                if (match !== null) {
                  hasFoundAny = true
                  const pathToCleanIndex = match.length - 1
                  const pathToClean = _.get(match, pathToCleanIndex, '')
                  let _name = filePath.slice(0, -1 * pathToClean.length)
                  let _index = 0
                  let subPath = _.split(pathToClean, '.')
                  if (subPath.length === 3) {
                    _index = _.get(subPath, 2, 0)
                    const locale =  _.get(subPath, 1, false)
                    if (locale) {
                      _name = `${_name}.${locale}`
                    }
                  } else {
                    _index = _.get(subPath, 1, 0)
                  }
                  attachment._name = `${_name}`
                  _.set(attachment, '_payload.index', _index)
                  attachment = _.omit(attachment, ['_createdAt', '_updatedAt', '_md5sum'])
                  _.each(locales, locale => {
                    if (_.endsWith(_name, `.${locale}`)) {
                      _name = _name.slice(0, -1 * `.${locale}`)
                    }
                  })
                  attachmentsPaths.push(_name)
                }
                if (hasFoundAny) {
                  return false
                }
              })
              if (!hasFoundAny) {
                _.each(locales, locale => {
                  if (_.endsWith(filePath, `.${locale}`)) {
                    filePath = filePath.slice(0, -1 * `.${locale}`)
                  }
                })
                attachmentsPaths.push(filePath)
              }
              attachments.push(attachment)
            }
          }
        }
        attachmentsPaths = _.compact(_.uniq(attachmentsPaths))
        attachments = _.compact(attachments)
        return {attachments, attachmentsPaths}
      },
      cleanAttachments(attachments, removeDuplicate = true) {
        attachments = _.map(attachments, attachment => {
          delete attachment._isAttachment
          return attachment
        })
        if (removeDuplicate) {
          attachments = _.compact(_.uniqBy(attachments, attachment => attachment._id))
        }
        return attachments
      },

      attachmentWasUpdated(oldA, newA) {
        if (_.get(newA, '_name', '?') !== _.get(oldA, '_name', '?') ||
          _.get(newA, '_payload.index', 0) !== _.get(oldA, '_payload.index', 0) ||
          _.get(newA, 'cropOptions.updated', false)) {
          return true
        }
        return false
      },
      getDataToUpload(resource, originalRecord, record) {
        // console.log(originalRecord)
        let originalRecordAttachments = this.getAttachmentsOfRecord(resource, originalRecord)
        let recordAttachments = this.getAttachmentsOfRecord(resource, record)
        const uploadObject = _.cloneDeep(record)
        _.each(recordAttachments.attachmentsPaths, attachmentsPath => {
          _.unset(uploadObject, attachmentsPath)
        })
        let deletedAttachments = []
        let updatedAttachments = []
        let untouchedAttachments = []
        let newAttachments = _.filter(recordAttachments.attachments, attachment => !attachment._id)
        recordAttachments.attachments = _.filter(recordAttachments.attachments, attachment => attachment._id)
        _.each(originalRecordAttachments.attachments, attachment => {
          const hasAttachment = _.find(recordAttachments.attachments, {_id: attachment._id})
          if (!hasAttachment) {
            deletedAttachments.push(attachment)
          } else if (this.attachmentWasUpdated(attachment, hasAttachment)) {
            updatedAttachments.push(hasAttachment)
          } else {
            untouchedAttachments.push(attachment)
          }
        })
        deletedAttachments = this.cleanAttachments(deletedAttachments)
        updatedAttachments = this.cleanAttachments(updatedAttachments)
        untouchedAttachments = this.cleanAttachments(untouchedAttachments)
        newAttachments = this.cleanAttachments(newAttachments, false)
        return {
          originalAttachments: originalRecordAttachments.attachments,
          deletedAttachments: deletedAttachments,
          updatedAttachments: updatedAttachments,
          untouchedAttachments: untouchedAttachments,
          newAttachments: newAttachments,
          uploadObject: uploadObject
        }
      },
      async checkFormValidForAllLocales() {
        await pAll(_.map(this.resource.locales, locale => {
          return async () => {
            this.selectLocale(locale)
            await this.$nextTick()
            await this.checkFormValid()
            if (!this.formValid) {
              throw new Error(`Record is not valid for locale ${locale}`)
            }
          }
        }), {concurrency: 1})
      },
      async createUpdateClicked () {
        if (!this.canCreateUpdate)  {
          return
        }
        try {
          if (_.get(this.resource, 'locales.length', 0) > 1) {
            console.info('will check data for all locales')
            const currentLocale = this.locale
            await this.checkFormValidForAllLocales()
            this.selectLocale(currentLocale)
          } else {
            console.info('will check data')
            await this.$nextTick()
            await this.checkFormValid()
            if (!this.formValid) {
              throw new Error(`Record is not valid`)
            }
          }
        } catch (error) {
          console.error(error)
          this.formValid = false
          return
        }
        this.canCreateUpdate = false
        const dataToUpload = this.getDataToUpload(this.resource, _.cloneDeep(this.record), this.editingRecord)
        const newAttachments = dataToUpload.newAttachments
        const updatedAttachments = dataToUpload.updatedAttachments
        const deletedAttachments = dataToUpload.deletedAttachments
        if (!this.formValid) {
          this.canCreateUpdate = true
          return this.handleFormNotValid('createUpdateClicked 2')
        }
        _.each(newAttachments, (attachment) => {
          console.info(`Will clean field ${attachment.field} from uploadObject`)
          _.set(dataToUpload.uploadObject, attachment.field, undefined)
        })
        if (_.isUndefined(this.editingRecord._id)) {
          await this.createRecord(dataToUpload.uploadObject, newAttachments)
        } else {
          await this.updateRecord(dataToUpload.uploadObject, newAttachments, updatedAttachments, deletedAttachments)
        }
        window.DialogService.send(false)
        this.canCreateUpdate = true
      },
      async createRecord (uploadObject, newAttachments) {
        this.$loading.start('create-record')
        try {
          let data = await RequestService.post(`../api/${this.resource.title}`, uploadObject)
          await this.uploadAttachments(data._id, newAttachments)
          this.notify(TranslateService.get('TL_RECORD_CREATED', { id: data._id }))
          this.$emit('updateRecordList', data)
        } catch (error) {
          console.error('Error happen during createRecord:', error)
          this.manageError(error, 'create')
        }
        this.$loading.stop('create-record')
      },
      async handleAttachmentsUpdates(newAttachments, updatedAttachments, deletedAttachments) {
        if (deletedAttachments.length > 0) {
          await this.removeAttachments(this.editingRecord._id, deletedAttachments)
        }
        if (newAttachments.length > 0) {
          await this.uploadAttachments(this.editingRecord._id, newAttachments)
        }
        if (updatedAttachments.length > 0) {
          await this.updateAttachments(this.editingRecord._id, updatedAttachments)
        }
      },
      async updateRecord (uploadObject, newAttachments, updatedAttachments, deletedAttachments) {
        this.$loading.start('update-record')
        try {
          let data = this.editingRecord
          await this.handleAttachmentsUpdates(newAttachments, updatedAttachments, deletedAttachments)
          const url = `../api/${this.resource.title}/${this.editingRecord._id}`
          if (!_.isEmpty(uploadObject)) {
            data = await RequestService.put(url, uploadObject)
          } else {
            data = await RequestService.get(url)
          }
          this.notify(TranslateService.get('TL_RECORD_UPDATED', { id: this.editingRecord._id }))
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
      getUpdatedAttachments (attachments) {
        return _.filter(attachments, (attachment) => _.get(attachment, 'cropOptions.updated', false))
      },
      updateFields (value, model) {
        if (!model || _.isUndefined(model)) {
          return
        }
        _.set(this.editingRecord, model, value)
      },
      onModelUpdated (value, model) {
        this.updateFields(value, model)
        this.checkDirty()
      },
      isAttachmentField (model) {
        const foundField = _.get(_.find(_.get(this.schema, 'fields', []), {model: model}), 'originalModel', false)
        const fieldType = _.get(_.find(this.resource.schema, {field: foundField}), 'input', false)
        return _.includes(this.fileInputTypes, fieldType)
      },
      checkDirty () {
        let formIsDirty = false
        _.each(this.originalFieldList, (field) => {
          const isEqual = _.isEqual(_.get(this.record, field.model), _.get(this.editingRecord, field.model))
          field.labelClasses = isEqual ? '' : 'dirty'
          if (!isEqual) {
            formIsDirty = true
          }
        })
        window.DialogService.send(formIsDirty)
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
