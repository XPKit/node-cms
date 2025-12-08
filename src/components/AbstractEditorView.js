import _ from 'lodash'
import TranslateServiceLib from '@s/TranslateService'
import SchemaService from '@s/SchemaService'
import Notification from '@m/Notification'
import RequestService from '@s/RequestService'
import pAll from 'p-all'

const TranslateService = window.TranslateService || TranslateServiceLib

export default {
  mixins: [Notification],
  methods: {
    async uploadAttachments (id, attachments) {
      this.$loading.start('uploadAttachments')
      const url = `../api/${this.resource.title}/${id}/attachments`
      try {
        await pAll(_.map(attachments, attachment => {
          return async () => {
            const data = new FormData()
            data.append(attachment.field, attachment.file)
            if (_.get(attachment, '_fields.locale', false)) {
              data.append('locale', attachment._fields.locale)
            }
            if (attachment._filename) {
              data.append('_filename', attachment._filename)
            }
            if (_.get(attachment, 'cropOptions', false)) {
              console.info('detected cropOptions, will add it to the request')
              data.append('cropOptions', JSON.stringify(attachment.cropOptions))
            }
            if (_.get(attachment, 'orderUpdated', false) && _.get(attachment, 'order', false)) {
              console.info('detected orderUpdated, will add it to the request')
              data.append('order', attachment.order)
            }
            await RequestService.post(url, data)
          }}), {concurrency: 5})
      } catch (error) {
        console.error('Error happen during uploadAttachments:', error)
      }
      this.$loading.stop('uploadAttachments')
    },
    formatAttachments(attachments, fieldsToKeep = ['_id', 'cropOptions', 'order', '_name']) {
      return _.map(attachments, (attachment)=> _.pick(attachment, fieldsToKeep))
    },
    async updateAttachments (id, attachments) {
      this.$loading.start('updateAttachments')
      try {
        await RequestService.put(`../api/${this.resource.title}/${id}/attachments`, this.formatAttachments(attachments))
      } catch (error) {
        console.error('Error happen during updateAttachments:', error)
      }
      this.$loading.stop('updateAttachments')
    },
    async removeAttachments (id, attachments) {
      this.$loading.start('remove-attachments')
      try {
        await RequestService.delete(`../api/${this.resource.title}/${id}/attachments`, this.formatAttachments(attachments, ['_id']))
      } catch (error) {
        console.error('Error happen during removeAttachments:', error)
      }
      this.$loading.stop('remove-attachments')
    },
    getTypePrexix (type) {
      return TranslateService.get(`TL_ERROR_ON_RECORD_${_.toUpper(type)}`)
    },
    manageError (error, type, record) {
      let errorMessage = this.getTypePrexix(type)
      if (_.get(error, 'code', 500) === 400 && _.get(error, 'message', false)) {
        errorMessage += `: ${_.get(error, 'message', TranslateService.get('TL_UNKNOWN_ERROR'))}`
      }
      console.error(errorMessage, record)
      this.notify(errorMessage, 'error')
    },
    formatSchemaLayout (schema) {
      if (!_.get(schema, 'layout.lines', false)) {
        return schema
      }
      const alreadyPlacedFields = []
      _.each(schema.layout.lines, (line) => {
        line.slots = line.slots || _.get(line, 'fields.length', 1)
        _.each(line.fields, (field) => {
          field.schema = _.find(schema.fields, {model: field.model})
          if (_.isUndefined(field.schema)) {
            field.schema = _.find(schema.fields, {originalModel: field.model})
          }
          if (_.isUndefined(field.schema)) {
            console.error(`Couldn't find schema for field ${field.model}`)
          } else {
            alreadyPlacedFields.push(field.model)
          }
        })
      })
      _.each(schema.fields, (field) => {
        if (!_.includes(alreadyPlacedFields, field.model) && !_.includes(alreadyPlacedFields, field.originalModel)) {
          schema.layout.lines.push({fields: [{model: field.model, schema: field}]})
        }
      })
      return schema
    },
    async updateSchema () {
      try {
        const disabled = !(this.record && this.record._local)
        this.$loading.start('loading-schema')
        const fields = SchemaService.getSchemaFields(this.resource.schema, this.resource, this.locale || this.userLocale, this.userLocale, disabled, this.resource.extraSources)
        const groups = SchemaService.getNestedGroups(this.resource, fields, 0)
        this.schema = this.formatSchemaLayout({
          fields: groups,
          layout: _.cloneDeep(this.resource.layout)
        })
        this.$loading.stop('loading-schema')
        this.originalFieldList = fields
      } catch (error) {
        console.error('AbstractEditorView - updateSchema - Error happen during updateSchema:', error)
      }
    }
  }
}
