<template>
  <div class="image-view">
    <div v-if="attachment()">
      <img v-if="isImage() && !(schema.width && schema.height)" class="preview" :src="imageUrl()">
      <template v-else-if="isImage() && schema.width && schema.height">
        <cropper
          ref="cropper"
          :src="imageUrl()"
          :transitions="true"
          image-restriction="fill-area"
          default-boundaries="fill"
          class="cropper"
          :default-size="schema.options.width && schema.options.height ? getDefaultCropSize() : false"
          :default-position="getDefaultCropPosition"
          :min-width="schema.options.width"
          :max-width="schema.options.width"
          :min-height="schema.options.height "
          :max-height="schema.options.height"
          :move-image="schema.options.moveImage ? true : false"
          :resize-image="schema.options.resizeImage ? true : false"
          image-class="cropper__image"
          :stencil-props="{
            class: 'cropper-stencil',
            previewClass: 'cropper-stencil__preview',
            draggingClass: 'cropper-stencil--dragging',
            handlersClasses: {
              default: 'cropper-handler',
              eastNorth: 'cropper-handler--east-north',
              westNorth: 'cropper-handler--west-north',
              eastSouth: 'cropper-handler--east-south',
              westSouth: 'cropper-handler--west-south',
            },
          }"
          @change="onCropperChange"
        />
      </template>
      <div>
        <label>{{ attachment()._filename }}</label>
        <v-btn v-if="!disabled" @click="removeImage(attachment(), true)">{{ 'TL_DELETE'|translate }}</v-btn>
      </div>
    </div>
    <form v-if="!disabled" enctype="multipart/form-data">
      <v-card
        :class="{ 'drag-and-drop': dragover }"
        @drop.prevent="onDrop($event)"
        @dragover.prevent="dragover = true"
        @dragenter.prevent="dragover = true"
        @dragleave.prevent="dragover = false"
      >
        <v-file-input
          :key="schema.model"
          ref="fileInput"
          :label="schema.label"
          hide-details
          dense
          outlined :multiple="schema.maxCount > 1" :accept="schema.accept" show-size @click:clear="removeImage(attachment(), true)" @change="onUploadChanged"
        />
      </v-card>
    </form>
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
import 'vue-advanced-cropper/dist/style.css'
import { Cropper } from 'vue-advanced-cropper'
import AbstractField from '@m/AbstractField'
import TranslateService from '@s/TranslateService'
import Notification from '@m/Notification'

export default {
  components: {
    Cropper
  },
  mixins: [Notification, AbstractField],
  data () {
    return {
      placeholder: '',
      dragover: false,
      croppedImage: false,
      localModel: false,
      firstCropUpdate: true
    }
  },
  computed: {
  },
  watch: {
  },
  mounted () {
    this.updateLocalData()
  },
  methods: {
    getDefaultCropPosition ({ imageSize, visibleArea, coordinates }) {
      const attachment = this.attachment()
      if (_.get(attachment, 'cropOptions', false)) {
        return {
          left: attachment.cropOptions.left,
          top: attachment.cropOptions.top
        }
      } else {
        console.warn('no crop options')
      }
      const area = visibleArea || imageSize
      return {
        left: (visibleArea ? visibleArea.left : 0) + area.width / 2 - coordinates.width / 2,
        top: (visibleArea ? visibleArea.top : 0) + area.height / 2 - coordinates.height / 2
      }
    },
    getDefaultCropSize () {
      return {
        width: _.get(this.schema, 'options.width', 500),
        height: _.get(this.schema, 'options.height', 500)
      }
    },
    onCropperChange (data) {
      const attachment = this.attachment()
      _.each(this.localModel._attachments, (localAttachment) => {
        if (localAttachment._id === attachment._id) {
          localAttachment.cropOptions = data.coordinates
          if (this.firstCropUpdate) {
            this.firstCropUpdate = false
          } else {
            localAttachment.cropOptions.updated = true
            console.warn('updated cropOptions:', localAttachment.cropOptions)
          }
        }
      })
      this.$emit('input', this.localModel._attachments, this.schema.model)
    },
    getSize (key) {
      return _.toNumber(_.get(this.schema, key, 0))
    },
    updateLocalData () {
      this.localModel = _.cloneDeep(this.model)
    },
    getFileSizeLimit (limit) {
      const kbLimit = limit / 1024
      return kbLimit > 1000 ? `${kbLimit / 1000} MB` : `${kbLimit} KB`
    },
    removeImage (attachment, isClearInput = false) {
      if (isClearInput) {
        this.$refs.fileInput.internalValue = null
        this.$refs.fileInput.$refs.input.value = null
      }
      this.localModel._attachments = _.filter(this.localModel._attachments, item => item !== attachment)
      this.$forceUpdate()
      this.$emit('input', this.localModel._attachments, this.schema.model)
      // work around to force label update
      const dummy = this.schema.label
      this.schema.label = null
      this.schema.label = dummy
    },
    onDrop (event) {
      this.dragover = false
      if (this.schema.maxCount <= 1 && event.dataTransfer.files.length > 1) {
        return console.error('Only one file can be uploaded at a time..')
      }
      event.dataTransfer.files.forEach(element =>
        this.onUploadChanged(element)
      )
    },
    onChangeFile (file) {
      const { key, locale } = this.getKeyLocale()
      const newAttachment = {
        _filename: file.name,
        _name: key,
        _fields: {
          locale
        },
        field: this.schema.model,
        localised: this.schema.localised,
        file
      }
      if (_.get()) { this.localModel._attachments.push(newAttachment) }
      this.$emit('input', this.localModel._attachments, this.schema.model)
    },
    onUploadChanged (files) {
      files = _.isNull(files) ? [] : files
      if (!_.isArray(files)) {
        files = [files]
      }
      if (!files.length) {
        return
      }
      const reader = new FileReader()
      const vm = this
      reader.onload = (element) => {
        const { key, locale } = vm.getKeyLocale()
        vm.removeImage(vm.attachment())
        const newAttachment = {
          _filename: files[0].name,
          _name: key,
          _fields: {
            locale
          },
          field: this.schema.model,
          localised: this.schema.localised,
          file: files[0],
          data: element.target.result
        }
        vm.localModel._attachments.push(newAttachment)
        vm.$forceUpdate()
        this.$emit('input', vm.localModel._attachments, this.schema.model)
      }
      reader.readAsDataURL(files[0])
    },
    imageUrl () {
      const attachment = this.attachment()
      return attachment && (attachment.url || attachment.data)
    },
    attachment () {
      const { key, locale } = this.getKeyLocale()
      return _.find(this.localModel._attachments, attachment => attachment._name === key && (attachment._fields && attachment._fields.locale) === locale)
    },
    getAttachments () {
      const { key, locale } = this.getKeyLocale()
      return _.filter(this.localModel._attachments, attachment => attachment._name === key && (attachment._fields && attachment._fields.locale) === locale)
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
    onFileSizeExceed () {
      this.notify(TranslateService.get('TL_FILE_SIZE_EXCEED', null, { size: this.schema.limit / 1024 }), 'error')
    },
    onFileTypeMismatch () {
      this.notify(TranslateService.get('TL_FILE_TYPE_MISMATCH'), 'error')
    }
  }
}
</script>

<style scoped lang="scss">
.cropper {
  &.cropper__image {
    opacity: 1;
  }
}

 .cropper-stencil {
  &__preview {
    &:after,
    &:before {
      content: "";
      opacity: 0;
      transition: opacity 0.25s;
      position: absolute;
      pointer-events: none;
      z-index: 1;
    }
    &:after {
      border-left: solid 1px white;
      border-right: solid 1px white;
      width: 33%;
      height: 100%;
      transform: translateX(-50%);
      left: 50%;
      top: 0;
    }
    &:before {
      border-top: solid 1px white;
      border-bottom: solid 1px white;
      height: 33%;
      width: 100%;
      transform: translateY(-50%);
      top: 50%;
      left: 0;
    }
  }
  &--dragging {
    .cropper-stencil__preview {
      &:after,
      &:before {
        opacity: 0.4;
      }
    }
  }
}

.cropper-line {
  border-color: rgba(white, 0.8);
}

.cropper-handler {
  display: block;
  opacity: 0.7;
  position: relative;
  flex-shrink: 0;
  transition: opacity 0.5s;
  border: none;
  background: white;
  top: auto;
  left: auto;
  height: 4px;
  width: 4px;
  &--west-north,
  &--east-south,
  &--west-south,
  &--east-north {
    display: block;
    height: 16px;
    width: 16px;
    background: none;
  }
  &--west-north {
    border-left: solid 2px white;
    border-top: solid 2px white;
    top: 16px / 2 - 1px;
    left: 16px / 2 - 1px;
  }
  &--east-south {
    border-right: solid 2px white;
    border-bottom: solid 2px white;
    top: -16px / 2 + 1px;
    left: -16px / 2 + 1px;
  }

  &--west-south {
    border-left: solid 2px white;
    border-bottom: solid 2px white;
    top: -16px / 2 + 1px;
    left: 16px / 2 - 1px;
  }
  &--east-north {
    border-right: solid 2px white;
    border-top: solid 2px white;
    top: 16px / 2 - 1px;
    left: -16px / 2 + 1px;
  }
  &--hover {
    opacity: 1;
  }
}
</style>
