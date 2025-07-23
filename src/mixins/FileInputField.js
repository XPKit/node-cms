import _ from 'lodash'
import TranslateService from '@s/TranslateService'

export default {
  data () {
    return {
      dragover: false,
      attachments: []
    }
  },
  mounted () {
    this.attachments = _.cloneDeep(this._value) || []
  },
  methods: {
    onEndDrag () {
      const attachments = _.map(this.getAttachments(), (item, i) => {
        if (item.order !== i + 1) {
          item.order = i + 1
          item.orderUpdated = true
        }
        return item
      })
      this._value = attachments
    },
    getImageSrc (attachment = false) {
      const a = attachment || this.attachment()
      return a.data ? a.data : this.getPreviewUrl(a)
    },
    isImage (attachment = false) {
      const a = attachment || this.attachment()
      const attachmentFilename = this.getAttachmentFilename(a)
      if (attachmentFilename) {
        const isAnImage = _.find(['jpg', 'jpeg', 'png', 'svg'], (type)=> _.endsWith(attachmentFilename, type))
        if (isAnImage) {
          return true
        }
      }
      return a && /image/g.test(a._contentType || _.get(a, 'file.type', false))
    },
    getPreviewUrl (attachment = false) {
      const a = attachment || this.attachment()
      const contentType = _.get(a, '_contentType', false)
      if (_.isString(contentType) && contentType.indexOf('svg') !== -1) {
        return a.url
      }
      return `${a.url}?resize=autox100`
    },
    attachment () {
      return _.first(this.attachments)
    },
    getAttachments () {
      return this._value || this.attachments
    },
    imageSize (attachment = false) {
      const a = attachment || this.attachment()
      return this.bytesToSize(_.get(a, '_size', _.get(a, 'file.size', false)))
    },
    bytesToSize (bytes) {
      if (bytes === 0) {
        return '0 Byte'
      }
      const sizes = [ 'Bytes', 'KB', 'MB', 'GB', 'TB' ]
      const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
      const result = Math.round(bytes / Math.pow(1024, i), 2)
      return _.isNaN(result) ? 'Unknown' : `${result} ${sizes[i]}`
    },
    isForMultipleImages () {
      if (this.schema.width && this.schema.height) {
        return false
      }
      const maxCount = this.getMaxCount()
      return maxCount === -1 ? true : maxCount > 1
    },
    isFieldDisabled () {
      const maxCount = this.getMaxCount()
      if (maxCount === -1) {
        return false
      } else if (this.getAttachments().length >= maxCount) {
        return true
      }
      return this.disabled || _.get(this.schema, 'disabled', false)
    },
    getFieldType () {
      return _.toUpper(_.get(this.schema, 'type', 'ImageView') === 'ImageView' ? 'image' : 'file')
    },
    getRules () {
      const rules = []
      if (this.schema.required) {
        rules.push(v => {
          if (_.isUndefined(v)) {
            return true
          }
          const attachmentsLength = _.get(this.getAttachments(), 'length', 0)
          const valueLength = _.get(v, 'length', 0)
          if ((v instanceof Object || v instanceof File) && _.get(v, 'name', false)) {
            return true
          } else if (attachmentsLength === 0 && valueLength === 0) {
            return TranslateService.get(`TL_${this.getFieldType()}_IS_MANDATORY`)
          }
          if ((valueLength !== 0 || v instanceof FileList) || attachmentsLength !== 0) {
            return true
          }
          return TranslateService.get(`TL_${this.getFieldType()}_IS_MANDATORY`)
        })
      }
      if (this.isForMultipleImages()) {
        rules.push(files => {
          const maxCount = this.getMaxCount()
          if (maxCount === -1 || _.get(this.getAttachments(), 'length', 0) + _.get(files, 'length', 0) <= maxCount + 1) {
            return true
          }
          return TranslateService.get(`TL_TOO_MANY_${this.getFieldType()}S`)
        })
      }
      if (_.get(this.schema, 'options.limit', false)) {
        rules.push(files => !files || !files.some(file => file.size > this.schema.limit) || TranslateService.get(`TL_${this.getFieldType()}_IS_TOO_BIG`))
      }
      if (_.get(this.schema, 'options.accept', false)) {
        const acceptedTypes = this.schema.options.accept.split(',')
        rules.push(files => {
          if (!files) {
            return true
          }
          let isValid = true
          if (!_.isArray(files)) {
            files = [files]
          }
          _.each(files, (file) => {
            const fileType = `.${_.toLower(_.last(_.split(file.name, '.')))}`
            const mimeType = file.type || ''
            let matched = false
            for (const accept of acceptedTypes) {
              const trimmed = accept.trim()
              if (trimmed.startsWith('.')) {
                // Extension match
                if (fileType === trimmed) {
                  matched = true
                  break
                }
              } else if (trimmed.endsWith('/*')) {
                // MIME group match (e.g., image/*)
                const group = trimmed.split('/')[0]
                if (mimeType.startsWith(group + '/')) {
                  matched = true
                  break
                }
              } else if (trimmed.includes('/')) {
                // Exact MIME type match
                if (mimeType === trimmed) {
                  matched = true
                  break
                }
              }
            }
            if (!matched) {
              isValid = false
              return false
            }
          })
          return isValid || TranslateService.get(`TL_INVALID_${this.getFieldType()}_TYPE`)
        })
      }
      return rules
    },
    getPlaceholder () {
      return TranslateService.get(`TL_CLICK_OR_DRAG_AND_DROP_TO_ADD_${this.getFieldType()}${this.isForMultipleImages() ? 'S' : ''}`)
    },
    getMaxCount () {
      return _.get(this.schema, 'options.maxCount', -1)
    },
    getAttachmentFilename(attachment) {
      return attachment._filename || (attachment._fields && attachment._fields._filename)
    },
    removeImage (attachment, index) {
      _.remove(this.attachments, (val, i)=> i === index)
      this._value = this.attachments
      this.$forceUpdate()
      // work around to force label update
      const dummy = this.schema.label
      this.schema.label = null
      this.schema.label = dummy
    },
    onDrop (event) {
      this.dragover = false
      const maxCount = this.getMaxCount()
      let files = _.get(event, 'dataTransfer.files', [])
      if (maxCount !== -1 && maxCount <= 1 && files.length > 1) {
        files = _.last(files)
        console.info(`Only one file can be uploaded at a time for field '${this.schema.originalModel}', will take the last one:`, files)
      } else if (_.isObject(files)) {
        files = _.toArray(files)
      }
      this.onUploadChanged(files)
    },
    async onUploadChanged (files) {
      let maxCount = this.getMaxCount()
      if (_.get(event, 'target.files.length', 0) !== 0) {
        files = event.target.files
        // dragAndDrop = true
        if (maxCount !== -1 && maxCount <= 1 && files.length > 1) {
          files = _.last(files)
          console.info(`Only one file can be uploaded at a time for field '${this.schema.originalModel}', will take the last one:`, files)
        } else if (_.isObject(files)) {
          files = _.toArray(files)
        }
      }
      files = _.isNull(files) ? [] : files
      if (_.get(files, 'target.files', false)) {
        files = _.values(files.target.files)
      }
      if (!_.isArray(files)) {
        files = [files]
      }
      if (!files.length) {
        return
      }
      if (_.get(this.schema, 'width', false) && _.get(this.schema, 'height', false)) {
        maxCount = 1
      }
      const totalNbFiles = this.getAttachments().length + files.length
      if (maxCount >= 1 && totalNbFiles > maxCount) {
        console.info(`Reached max number of files for ${this.schema.paragraphKey || this.schema.model}`, totalNbFiles, maxCount)
        files = _.take(files, files.length - (totalNbFiles - maxCount))
      }
      if (_.get(this.$refs, 'input', false)) {
        // console.warn('WILL VALIDATE', files)
        const errorMessage = await this.$refs.input.validate()
        if (_.get(errorMessage, 'length', 0) !== 0) {
          console.error('validation error, will not upload files:', errorMessage)
          return
        }
      }
      this.attachments = await this.readAllFiles(files)
      this._value = this.attachments
    },
    getFieldKey() {
      if (this.schema.paragraphKey && this.schema.localised) {
        return `${this.schema.paragraphKey}.${this.schema.locale}`
      }
      return this.schema.paragraphKey || this.schema.model
    },
    addAttachment (file, element) {
      const { locale } = this.getKeyLocale()
      const newAttachment = {
        _isAttachment: true,
        _filename: _.get(file, '[0].name', file.name),
        field: this.getFieldKey(),
        localised: this.schema.localised,
        file: _.get(file, '[0]', file),
        data: element.target.result
      }
      if (!_.isUndefined(locale)) {
        newAttachment._fields = {locale}
      }
      this.attachments.push(newAttachment)
    },
    async readAllFiles (files) {
      let nbFilesToRead = _.get(files, 'length', 1)
      return new Promise((resolve) => {
        _.each(files, (file) => {
          const reader = new FileReader()
          if (_.get(file, 'type', false).indexOf('video/') !== -1) {
            this.addAttachment(file, {target: {result: URL.createObjectURL(file)}})
            this.$forceUpdate()
            nbFilesToRead--
            if (nbFilesToRead === 0) {
              if (this.isForMultipleImages()) {
                _.each(this._value, (a, i) => {
                  a.order = i + 1
                  a.orderUpdated = true
                })
              }
              resolve(this.attachments)
            }
          } else {
            const vm = this
            reader.onload = (element) => {
              vm.addAttachment(file, element)
              vm.$forceUpdate()
              nbFilesToRead--
              if (nbFilesToRead === 0) {
                if (this.isForMultipleImages()) {
                  _.each(vm._value, (a, i) => {
                    a.order = i + 1
                    a.orderUpdated = true
                  })
                }
                resolve(vm.attachments)
              }
            }
            try {
              const blob = _.get(file, '[0]', file)
              if (blob instanceof Blob) {
                reader.readAsDataURL(blob)
              }
            } catch (error) {
              console.error('Error while reading file:', error)
            }
          }
        })
      })
    }
  }
}
