<template>
  <div class="image-view">
    <div v-if="!(schema.width && schema.height)">
      <div v-if="attachment()">
        <img v-if="isImage()" class="preview" :src="imageUrl()">
        <div>
          <label>{{ attachment()._filename }}</label>
          <button v-if="!disabled" @click="removeImage(attachment(), true)">{{ 'TL_DELETE'|translate }}</button>
        </div>
      </div>
      <form v-if="!disabled" enctype="multipart/form-data">
        <v-file-input :key="schema.model" ref="fileInput" :label="schema.label" dense outlined :multiple="schema.maxCount > 1" :accept="schema.accept" show-size @change="onUploadChanged" />
      </form>
    </div>
    <croppa
      v-if="schema.width && schema.height"
      :key="schema.model"
      v-model="myCroppa"
      :zoom-speed="6"
      :accept="schema.accept || 'image/*'"
      :initial-image="imageUrl()"
      :width="schema.width"
      :height="schema.height"
      :canvas-color="schema.background"
      :placeholder="placeholder"
      :file-size-limit="schema.limit"
      :disable-drag-to-move="!croppaAttachment"
      :disable-scroll-to-zoom="!croppaAttachment"
      :disable-pinch-to-zoom="!croppaAttachment"
      @image-remove="removeImage(attachment())"
      @file-choose="onCroppaChooseFile"
      @new-image-drawn="onCroppaImageDraw"
      @zoom="onCroppaZoom"
      @mouseup="onCroppaMouseUp"
      @file-size-exceed="onCroppaFileSizeExceed"
      @file-type-mismatch="onCroppaFileTypeMismatch"
    >
      <div v-if="!isImage()" class="placeholder-overlay">{{ 'TL_CLICK_HERE_TO_CHOOSE_AN_IMAGE' | translate }}</div>
    </croppa>
    <div v-if="(schema.width && schema.height)" class="help-block">
      <span>{{ 'TL_THIS_FIELD_REQUIRES_THE_FOLLOWING_SIZE'|translate }}:{{ schema.width }}x{{ schema.height }}</span>
    </div>
    <div v-if="(schema.limit)" class="help-block">
      <span>{{ 'TL_THIS_FIELD_REQUIRES_A_FILE_SIZE'|translate }}: {{ getFileSizeLimit(schema.limit) }}</span>
    </div>
    <div v-if="(schema.accept)" class="help-block">
      <span>{{ 'TL_THIS_FIELD_REQUIRES'|translate }}: {{ schema.accept }}</span>
    </div>
    <div v-if="attachment() && isImage()" class="help-block">
      <span>{{ 'TL_CURRENT_FILESIZE'|translate }}: {{ imageSize() }}</span>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
// import { abstractField } from 'vue-form-generator'
import TranslateService from '@s/TranslateService'
import Notification from '@m/Notification'

export default {
  components: {
  },
  mixins: [Notification],
  props: ['obj', 'vfg', 'model', 'disabled'],
  data () {
    return {
      placeholder: '',
      myCroppa: null,
      croppaAttachment: null,
      croppaFileType: null,
      schema: _.get(this.obj, 'schema', {}),
      localModel: false
    }
  },
  computed: {
  },
  watch: {
    'schema.model': function () {
      this.croppaAttachment = null
    }
  },
  created () {
    this.schema = _.cloneDeep(this.obj.schema)
  },
  methods: {
    updateLocalData () {
      this.schema = _.cloneDeep(this.obj.schema)
      this.localModel = _.cloneDeep(this.model)
      console.warn('updateLocalData', this.obj.schema)
    },
    getFileSizeLimit (limit) {
      const kbLimit = limit / 1024
      if (kbLimit > 1000) {
        return `${kbLimit / 1000} MB`
      }
      return `${kbLimit} KB`
    },
    removeImage (attachment, isClearInput = false) {
      if (isClearInput) {
        this.$refs.fileInput.value = null
      }
      this.localModel._attachments = _.filter(this.localModel._attachments, item => item !== attachment)
      this.$forceUpdate()

      this.$emit('input', this.localModel._attachments)

      // work around to force label update
      const dummy = this.schema.label
      this.schema.label = null
      this.schema.label = dummy
    },
    updateCroppaBlobData () {
      if (!this.croppaAttachment) {
        return
      }
      let type = this.croppaFileType
      if (this.schema.background !== 'transparent') {
        type = 'image/jpeg'
      }
      this.myCroppa.generateBlob((blob) => {
        if (!blob) {
          return
        }

        blob.lastModifiedDate = new Date()
        blob.name = _.get(this, 'croppaAttachment._filename', 'blob')
        this.croppaAttachment.file = blob

        if (!_.includes(this.localModel._attachments, this.croppaAttachment)) {
          this.localModel._attachments = _.filter(this.localModel._attachments, item => item._name !== this.croppaAttachment._name)
          this.localModel._attachments.push(this.croppaAttachment)
        }
        this.$emit('input', this.localModel._attachments)
      }, type, this.schema.quality || 0.9)
    },
    onCroppaMouseUp () {
      clearTimeout(this.actionTimer)
      this.actionTimer = setTimeout(this.updateCroppaBlobData, 100)
    },
    onCroppaZoom () {
      clearTimeout(this.actionTimer)
      this.actionTimer = setTimeout(this.updateCroppaBlobData, 100)
    },

    onCroppaChooseFile (file) {
      const { key, locale } = this.getKeyLocale()
      this.croppaFileType = file.type
      this.localModel._attachments.push(this.croppaAttachment = {
        _filename: file.name,
        _name: key,
        _fields: {
          locale
        },
        field: this.schema.model,
        localised: this.schema.localised,
        file
      })
      this.$emit('input', this.localModel._attachments)
    },

    onCroppaImageDraw () {
      this.updateCroppaBlobData()
    },
    onUploadChanged (e) {
      const files = e.target.files || e.dataTransfer.files
      if (!files.length) {
        return
      }
      const reader = new FileReader()
      const vm = this
      reader.onload = (element) => {
        const { key, locale } = vm.getKeyLocale()
        vm.removeImage(vm.attachment())
        vm.localModel._attachments.push({
          _filename: files[0].name,
          _name: key,
          _fields: {
            locale
          },
          field: this.schema.model,
          localised: this.schema.localised,
          file: files[0],
          data: element.target.result
        })
        vm.$forceUpdate()
        this.$emit('input', this.localModel._attachments)

        // work around to force label update
        const dummy = this.schema.label
        this.schema.label = null
        this.schema.label = dummy
      }
      reader.readAsDataURL(files[0])
    },
    getKeyLocale () {
      const options = {}
      const list = this.schema.model.split('.')
      if (this.schema.localised) {
        options.locale = list.shift()
      }
      options.key = list.join('.')
      return options
    },
    imageUrl () {
      const attachment = this.attachment()
      return attachment && (attachment.url || attachment.data)
    },
    attachment () {
      const { key, locale } = this.getKeyLocale()
      return _.find(this.localModel._attachments, attachment => attachment._name === key && (attachment._fields && attachment._fields.locale) === locale)
    },
    imageSize () {
      const attachment = this.attachment()
      // console.log(attachment)
      return this.bytesToSize(_.get(attachment, '_size', false))
    },
    isImage () {
      const attachment = this.attachment()
      // console.log(attachment)
      return attachment && /image/g.test(attachment._contentType || (attachment.file && attachment.file.type))
    },
    bytesToSize (bytes) {
      if (bytes === 0) {
        return '0 Byte'
      }
      const sizes = [ 'Bytes', 'KB', 'MB', 'GB', 'TB' ]
      const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
      const result = Math.round(bytes / Math.pow(1024, i), 2)
      if (_.isNaN(result)) {
        return 'Unknown'
      }
      return `${result} ${sizes[i]}`
    },
    onCroppaFileSizeExceed () {
      this.notify(TranslateService.get('TL_FILE_SIZE_EXCEED', null, { size: this.schema.limit / 1024 }), 'error')
    },
    onCroppaFileTypeMismatch () {
      this.notify(TranslateService.get('TL_FILE_TYPE_MISMATCH'), 'error')
    }
  }
}
</script>
