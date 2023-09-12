import _ from 'lodash'
import axios from 'axios/dist/axios.min'
import TranslateServiceLib from '@s/TranslateService'
import SchemaService from '@s/SchemaService'
import Notification from '@m/Notification'

const TranslateService = window.TranslateService || TranslateServiceLib

export default {
  mixins: [Notification],
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
          if (attachment._filename) {
            data.append('_filename', attachment._filename)
          }
          if (attachment._fields.fileItemId) {
            data.append('fileItemId', attachment._fields.fileItemId)
          }
          if (_.get(attachment, 'cropOptions', false)) {
            console.warn('detected cropOptions, will add it to the request')
            data.append('cropOptions', JSON.stringify(attachment.cropOptions))
          }
          if (_.get(attachment, 'orderUpdated', false) && _.get(attachment, 'order', false)) {
            // console.warn('detected orderUpdated, will add it to the request')
            data.append('order', attachment.order)
          }
          await axios.post(`../api/${this.resource.title}/${id}/attachments`, data)
        }
      } catch (error) {
        console.error('Error happen during uploadAttachments:', error)
      }
      this.$loading.stop('uploadAttachments')
    },
    async updateAttachments (id, attachments) {
      this.$loading.start('updateAttachments')
      try {
        for (const [i, attachment] of attachments.entries()) {
          const cropOptions = _.omit(_.get(attachment, 'cropOptions', {}), ['updated'])
          const order = _.get(attachment, 'order', i + 1)
          await axios.put(`../api/${this.resource.title}/${id}/attachments/${attachment._id}`, {cropOptions, order})
        }
      } catch (error) {
        console.error('Error happen during updateAttachments:', error)
      }
      this.$loading.stop('updateAttachments')
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
    getTypePrexix (type) {
      let typePrefix = 'TL_ERROR_ON_RECORD_'
      if (type === 'create') {
        typePrefix += 'CREATION'
      } else if (type === 'update') {
        typePrefix += 'UPDATE'
      } else if (type === 'delete') {
        typePrefix += 'DELETE'
      }
      return typePrefix ? TranslateService.get(typePrefix) : 'Error'
    },
    manageError (error, type, record) {
      let typePrefix = this.getTypePrexix(type)
      let errorMessage = typePrefix
      if (_.get(error, 'response.data.code', 500) === 400) {
        const serverError = _.get(error, 'response.data')
        if (_.get(serverError, 'message', false)) {
          errorMessage = `${typePrefix}: ${serverError.message}`
        } else {
          errorMessage = `${typePrefix}: ${TranslateService.get('TL_UNKNOWN_ERROR')}`
        }
      }
      console.error(errorMessage, record)
      this.notify(errorMessage, 'error')
    },
    formatSchemaLayout () {
      if (!_.get(this.schema, 'layout.lines', false)) {
        return
      }
      const alreadyPlacedFields = []
      _.each(this.schema.layout.lines, (line) => {
        line.slots = line.slots || _.get(line, 'fields.length', 1)
        _.each(line.fields, (field) => {
          field.schema = _.find(this.schema.fields, {model: field.model})
          if (_.isUndefined(field.schema)) {
            field.schema = _.find(this.schema.fields, {originalModel: field.model})
          }
          if (_.isUndefined(field.schema)) {
            console.error(`Couldn't find schema for field ${field.model}`)
          } else {
            alreadyPlacedFields.push(field.model)
          }
        })
      })
      _.each(this.schema.fields, (field) => {
        if (!_.includes(alreadyPlacedFields, field.model) && !_.includes(alreadyPlacedFields, field.originalModel)) {
          this.schema.layout.lines.push({fields: [{model: field.model, schema: field}]})
        }
      })
    },
    async updateSchema () {
      try {
        const disabled = !(this.record && this.record._local)
        this.$loading.start('loading-schema')
        const fields = SchemaService.getSchemaFields(this.resource.schema, this.resource, this.locale || this.userLocale, this.userLocale, disabled, this.resource.extraSources)
        this.$loading.stop('loading-schema')
        const groups = SchemaService.getNestedGroups(this.resource, fields, 0)
        this.schema.fields = groups
        this.schema.layout = this.resource.layout
        this.formatSchemaLayout()
        // console.warn('AbstractEditorView - schema ', this.schema)
        this.originalFieldList = fields
        // console.warn('AbstractEditorView - updateSchema', this.schema)
      } catch (error) {
        console.error('AbstractEditorView - updateSchema - Error happen during updateSchema:', error)
      }
    }
  }
}
