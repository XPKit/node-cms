import _ from 'lodash'
import {v4 as uuid} from 'uuid'
import TranslateService from '@s/TranslateService'

export default {
  data () {
    return {
      dragover: false,
      attachments: [],
      localModel: false
    }
  },
  mounted () {
    this.localModel = _.cloneDeep(this.model)
    this.attachments = this.getAttachments()
  },
  methods: {
    onEndDrag ({newIndex, oldIndex}) {
      this.dragging = false
      const items = _.map(this.getAttachments(), (item, i) => {
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
      if (this.isForParagraph) {
        this.value = this.items
      } else {
        this.$emit('input', orderedAttachments, this.schema.model)
      }
    },
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
      if (a._contentType.indexOf('svg') !== -1) {
        return a.url
      }
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
        rules.push(v => !!v || _.get(this.getAttachments(), 'length', 0) !== 0 || TranslateService.get(`TL_${this.getFieldType()}_IS_MANDATORY`))
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
    getFileSizeLimit (limit) {
      const kbLimit = limit / 1024
      return kbLimit > 1000 ? `${kbLimit / 1000} MB` : `${kbLimit} KB`
    },
    removeImage (attachment) {
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
      if (_.get(await this.$refs.input.validate(), 'length', 0) !== 0) {
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
      if (maxCount > 1 && totalNbFiles > maxCount) {
        console.info(`Reached max number of files for ${this.schema.model}`, totalNbFiles, maxCount)
        files = _.take(files, files.length - (totalNbFiles - maxCount))
      } else if (maxCount === 1 && totalNbFiles > 1 && !this.isForParagraph) {
        this.localModel._attachments = _.filter(this.localModel._attachments, (attachment) => !this.isSameAttachment(attachment))
      }
      const results = await this.readAllFiles(files)
      if (this.isForParagraph) {
        this.value = this.items
      } else {
        this.attachments = _.filter(results, attachment => this.isSameAttachment(attachment))
        this.$forceUpdate()
        this.$emit('input', this.localModel._attachments, this.schema.model)
      }
    },
    addAttachment (file, element) {
      const { key, locale } = this.getKeyLocale()
      const newAttachment = {
        _filename: _.get(file, '[0].name', file.name),
        _name: key,
        _fields: {locale},
        field: this.schema.model,
        localised: this.schema.localised,
        file: _.get(file, '[0]', file),
        data: element.target.result
      }
      if (this.isForParagraph) {
        const fileItemId = uuid()
        this.items.push({id: fileItemId})
        this.items = _.clone(this.items)
        newAttachment._fields.fileItemId = fileItemId
        this.schema.rootView.model._attachments.push(newAttachment)
      } else {
        this.localModel._attachments.push(newAttachment)
      }
    },
    async readAllFiles (files) {
      let nbFilesToRead = _.get(files, 'length', 1)
      return new Promise((resolve, reject) => {
        _.each(files, (file, i) => {
          const reader = new FileReader()
          const vm = this
          reader.onload = (element) => {
            vm.addAttachment(file, element)
            vm.$forceUpdate()
            nbFilesToRead--
            if (nbFilesToRead === 0) {
              if (this.isForMultipleImages()) {
                _.each(vm.localModel._attachments, (a, i) => {
                  a.order = i + 1
                  a.orderUpdated = true
                })
              }
              resolve(this.isForParagraph ? vm.items : vm.localModel._attachments)
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
        })
      })
    }
  }
}
