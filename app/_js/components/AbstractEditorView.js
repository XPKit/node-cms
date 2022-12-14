import _ from 'lodash'
import axios from 'axios/dist/axios.min'
import TranslateServiceLib from '../services/TranslateService'
import SchemaService from '../services/SchemaService'

let TranslateService
if (window.TranslateService) {
  TranslateService = window.TranslateService
} else {
  TranslateService = TranslateServiceLib
}

export default {
  methods: {
    async uploadAttachments (id, attachments) {
      this.$loading.start('uploadAttachments')
      try {
        for (const attachment of attachments) {
          const data = new FormData()
          data.append(attachment._name, attachment.file)
          if (attachment._fields.locale) {
            data.append('locale', attachment._fields.locale)
          }
          if (attachment._fields.fileItemId) {
            data.append('fileItemId', attachment._fields.fileItemId)
          }
          await axios.post(`../api/${this.resource.title}/${id}/attachments`, data)
        }
      } catch (error) {
        console.error('Error happen during removeAttachments:', error)
      }
      this.$loading.stop('uploadAttachments')
    },
    async removeAttachments (id, attachments) {
      this.$loading.start('remove-attachments')
      try {
        for (const attachment of attachments) {
          await axios.delete(`../api/${this.resource.title}/${id}/attachments/${attachment._id}`)
        }
      } catch (error) {
        console.error('Error happen during removeAttachments:', error)
      }
      this.$loading.stop('remove-attachments')
    },
    manageError (error, type, record) {
      let typePrefix = 'Error'
      if (type === 'create') {
        typePrefix = TranslateService.get('TL_ERROR_ON_RECORD_CREATION')
      } else if (type === 'update') {
        typePrefix = TranslateService.get('TL_ERROR_ON_RECORD_UPDATE')
      } else if (type === 'delete') {
        typePrefix = TranslateService.get('TL_ERROR_ON_RECORD_DELETE')
      }
      let errorMessage = typePrefix
      if (_.get(error, 'response.data.code', 500) === 400) {
        const serverError = _.get(error, 'response.data')
        if (_.get(serverError, 'message', false)) {
          errorMessage = `${typePrefix}: ${serverError.message}`
        } else {
          errorMessage = `${typePrefix}: ${TranslateService.get('TL_UNKNOWN_ERROR')}`
        }
      }
      this.$notify({
        group: 'notification',
        type: 'error',
        text: errorMessage
      })
    },
    async updateSchema () {
      try {
        const disabled = !(this.record && this.record._local)
        this.$loading.start('loading-schema')
        const fields = SchemaService.getSchemaFields(this.resource.schema, this.resource, this.locale, this.userLocale, disabled, this.resource.extraSources)
        this.$loading.stop('loading-schema')
        const groups = SchemaService.getNestedGroups(this.resource, fields, 0)
        this.schema.fields = groups
        this.originalFieldList = fields
      } catch (error) {
        console.error('Error happen during updateSchema:', error)
      }
    }
  }
}
