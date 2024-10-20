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
    // console.warn('file input mounted', this.schema.model, this.schema.paragraphKey, this.attachments)
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
      // console.warn('ON END DRAG', _.map(attachments, '_filename'))
      this._value = attachments
    },
    getImageSrc (attachment = false) {
      const a = attachment || this.attachment()
      return a.data ? a.data : this.getPreviewUrl(a)
    },
    isImage (attachment = false) {
      const a = attachment || this.attachment()
      // console.warn('isImage', a)
      let isAnImage = false
      const attachmentFilename = this.getAttachmentFilename(a)
      if (attachmentFilename) {
        _.each(['jpg', 'jpeg', 'png', 'svg'], (type)=> {
          if (_.endsWith(attachmentFilename, type)) {
            isAnImage = true
            return false
          }
        })
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
      }
      if (this.getAttachments().length >= maxCount) {
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
        // rules.push(v => !!v || _.get(this.getAttachments(), 'length', 0) !== 0 || TranslateService.get(`TL_${this.getFieldType()}_IS_MANDATORY`))
        rules.push(v => {
          if (_.get(this.getAttachments(), 'length', 0) === 0 && _.get(v, 'length', 0) === 0) {
            return TranslateService.get(`TL_${this.getFieldType()}_IS_MANDATORY`)
          }
          return (_.get(v, 'length', 0) !== 0 ? true : _.get(this.getAttachments(), 'length', 0) !== 0) || TranslateService.get(`TL_${this.getFieldType()}_IS_MANDATORY`)
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
      // console.warn(`remove image -BEFORE ${index}`, _.cloneDeep(this.attachments))
      _.remove(this.attachments, (val, i)=> i === index)
      this._value = this.attachments
      // console.warn(`remove image - ${index}`,this.attachments)
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
      this.onUploadChanged(files, true)
    },
    async onUploadChanged (files, dragAndDrop = false) {
      if (!dragAndDrop && _.get(await this.$refs.input.validate(), 'length', 0) !== 0) {
        return
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
      let maxCount = this.getMaxCount()
      if (_.get(this.schema, 'width', false) && _.get(this.schema, 'height', false)) {
        maxCount = 1
      }
      const totalNbFiles = this.getAttachments().length + files.length
      if (maxCount >= 1 && totalNbFiles > maxCount) {
        console.info(`Reached max number of files for ${this.schema.paragraphKey || this.schema.model}`, totalNbFiles, maxCount)
        files = _.take(files, files.length - (totalNbFiles - maxCount))
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
