import _ from 'lodash'
import Sortable from 'sortablejs'
import TranslateService from '@s/TranslateService'

export default {
  data () {
    return {
      dragover: false,
      sortable: false,
      localModel: false

    }
  },
  mounted () {
    this.localModel = _.cloneDeep(this.model)
    if (this.isForMultipleImages()) {
      this.$nextTick(() => {
        const previewMultiple = this.$refs['preview-multiple']
        this.sortable = Sortable.create(previewMultiple, {
          animation: 150,
          handle: '.row-handle',
          onEnd: ({ newIndex, oldIndex }) => {
            let items = this.getAttachments().slice()
            items.splice(newIndex, 0, items.splice(oldIndex, 1)[0])
            items = _.map(items, (item, i) => {
              if (item.order !== i + 1) {
                item.order = i + 1
                item.orderUpdated = true
              }
              return item
            })
            let orderedAttachments = _.map(this.localModel._attachments, attachment => {
              if (!this.isSameAttachment(attachment)) {
                return attachment
              }
              const foundOrder = _.get(_.find(items, {orderUpdated: true, _filename: attachment._filename, _size: attachment._size, url: attachment.url}), 'order', 0)
              if (foundOrder !== 0 && foundOrder !== _.get(attachment, 'order', -1)) {
                attachment.order = foundOrder
                attachment.orderUpdated = true
              }
              return attachment
            })
            orderedAttachments = _.orderBy(orderedAttachments, ['order'], ['asc'])
            this.attachments = _.filter(orderedAttachments, attachment => this.isSameAttachment(attachment))
            this.$emit('input', orderedAttachments, this.schema.model)
          }
        })
      })
    }
  },
  methods: {
    getImageSrc (attachment = false) {
      const a = attachment || this.attachment()
      return a.data ? a.data : this.getPreviewUrl(a)
    },
    isImage (attachment = false) {
      const a = attachment || this.attachment()
      return a && /image/g.test(a._contentType || (a.file && a.file.type))
    },
    getPreviewUrl (attachment = false) {
      const a = attachment || this.attachment()
      return `${a.url}?resize=autox100`
    },
    isSameAttachment (attachment) {
      const { key, locale } = this.getKeyLocale()
      return attachment._name === key && (attachment._fields && attachment._fields.locale) === locale
    },
    attachment () {
      return _.find(this.localModel._attachments, attachment => this.isSameAttachment(attachment))
    },
    getAttachments () {
      if (_.get(this.attachments, 'length', 0) !== 0) {
        return this.attachments
      }
      return _.filter(this.localModel._attachments, attachment => this.isSameAttachment(attachment))
    },
    imageSize (attachment = false) {
      let fileSize = 0
      if (attachment) {
        fileSize = _.get(attachment, '_size', _.get(attachment, 'file.size', false))
      } else {
        fileSize = _.get(this.attachment(), '_size', false)
      }
      return this.bytesToSize(fileSize)
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
      return this.getAttachments().length >= maxCount
    },
    getFieldType () {
      return _.toUpper(_.get(this.schema, 'type', 'ImageView') === 'ImageView' ? 'image' : 'file')
    },
    isFieldValid () {
      return _.get(_.compact(this.getRules()), 'length', 0) === 0
    },
    getRules () {
      const rules = []
      if (this.schema.required) {
        rules.push(v => !!v || _.get(this.getAttachments(), 'length', 0) !== 0 || TranslateService.get(`TL_${this.getFieldType()}_IS_MANDATORY`))
      }
      if (this.isForMultipleImages()) {
        rules.push(files => {
          const maxCount = this.getMaxCount()
          if (maxCount === -1 || _.get(this.getAttachments(), 'length', 0) + _.get(files, 'length', 0) <= maxCount) {
            return true
          }
          return TranslateService.get(`TL_TOO_MANY_${this.getFieldType()}S`)
        })
        if (_.get(this.schema, 'options.limit', false)) {
          rules.push(files => !files || !files.some(file => file.size > this.schema.limit) || TranslateService.get(`TL_${this.getFieldType()}_IS_TOO_BIG`))
        }
      } else {
        if (_.get(this.schema, 'options.limit', false)) {
          rules.push(file => !file || file.size <= this.schema.limit || TranslateService.get(`TL_${this.getFieldType()}_IS_TOO_BIG`))
        }
      }
      return rules
    },
    getPlaceholder () {
      return `TL_CLICK_OR_DRAG_AND_DROP_TO_ADD_${this.getFieldType()}${this.isForMultipleImages() ? 'S' : ''}`
    },
    getMaxCount () {
      return _.get(this.schema, 'options.maxCount', -1)
    },
    getFileSizeLimit (limit) {
      const kbLimit = limit / 1024
      return kbLimit > 1000 ? `${kbLimit / 1000} MB` : `${kbLimit} KB`
    },
    removeImage (attachment) {
      this.$refs.fileInput.internalValue = null
      this.$refs.fileInput.$refs.input.value = null
      this.localModel._attachments = _.filter(this.localModel._attachments, item => item !== attachment)
      this.attachments = _.filter(this.localModel._attachments, attachment => this.isSameAttachment(attachment))
      this.$forceUpdate()
      this.$emit('input', this.localModel._attachments, this.schema.model)
      // work around to force label update
      const dummy = this.schema.label
      this.schema.label = null
      this.schema.label = dummy
    },
    onDrop (event) {
      this.dragover = false
      const maxCount = this.getMaxCount()
      if (maxCount !== -1 && maxCount <= 1 && event.dataTransfer.files.length > 1) {
        return console.error('Only one file can be uploaded at a time..')
      }
      this.onUploadChanged(event.dataTransfer.files)
    },
    async onUploadChanged (files) {
      this.$refs.fileInput.validate()
      if (!this.$refs.fileInput.valid) {
        return
      }
      files = _.isNull(files) ? [] : files
      if (!_.isArray(files)) {
        files = [files]
      }
      if (!files.length) {
        return
      }
      const maxCount = this.getMaxCount()
      const totalNbFiles = this.getAttachments().length + files.length
      if (maxCount > 1 && totalNbFiles > maxCount) {
        console.warn('reached max', totalNbFiles, maxCount)
        files = _.take(files, files.length - (totalNbFiles - maxCount))
      } else if (maxCount === 1 && totalNbFiles > 1) {
        this.localModel._attachments = _.filter(this.localModel._attachments, (attachment) => !this.isSameAttachment(attachment))
      }
      this.attachments = _.filter(await this.readAllFiles(files), attachment => this.isSameAttachment(attachment))
      this.$forceUpdate()
      this.$emit('input', this.localModel._attachments, this.schema.model)
    },
    async readAllFiles (files) {
      let nbFilesToRead = _.get(files, 'length', 1)
      return new Promise((resolve, reject) => {
        _.each(files, (file, i) => {
          const reader = new FileReader()
          const vm = this
          reader.onload = (element) => {
            const { key, locale } = vm.getKeyLocale()
            const newAttachment = {
              _filename: file.name,
              _name: key,
              _fields: {
                locale
              },
              field: this.schema.model,
              localised: this.schema.localised,
              file,
              data: element.target.result
            }
            vm.localModel._attachments.push(newAttachment)
            vm.$forceUpdate()
            nbFilesToRead--
            if (nbFilesToRead === 0) {
              if (this.isForMultipleImages()) {
                _.each(vm.localModel._attachments, (a, i) => {
                  a.order = i + 1
                  a.orderUpdated = true
                })
              }
              resolve(vm.localModel._attachments)
            }
          }
          try {
            reader.readAsDataURL(file)
          } catch (error) {
          }
        })
      })
    }
    // onFileSizeExceed () {
    //   this.notify(TranslateService.get('TL_FILE_SIZE_EXCEED', null, { size: this.schema.limit / 1024 }), 'error')
    // },
    // onFileTypeMismatch () {
    //   this.notify(TranslateService.get('TL_FILE_TYPE_MISMATCH'), 'error')
    // }
  }
}
