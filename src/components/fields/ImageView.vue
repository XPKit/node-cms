<template>
  <div class="image-view" :class="{'full-width': !(schema.width && schema.height)}">
    <form v-if="!disabled" enctype="multipart/form-data">
      <v-card
        class="file-input-card" elevation="0" :class="{ 'drag-and-drop': dragover }"
        @drop.prevent="onDrop($event)" @dragover.prevent="dragover = true" @dragenter.prevent="dragover = true" @dragleave.prevent="dragover = false"
      >
        <v-file-input
          ref="fileInput" :rules="getRules()" :hide-details="isFieldValid()"
          :label="schema.label" :placeholder="getPlaceholder() | translate" :clearable="false"
          dense outlined persistent-placeholder persistent-hint :multiple="isForMultipleImages()" :accept="schema.accept" :disabled="isForMultipleImages() && isFieldDisabled()"
          @change="onUploadChanged"
        >
          <template #selection="{index}">
            <div v-if="index === 0" class="v-file-input__text v-file-input__text--placeholder">
              {{ getPlaceholder() | translate }}
            </div>
          </template>
        </v-file-input>
      </v-card>
    </form>
    <div v-if="isForMultipleImages()" ref="preview-multiple" class="preview-multiple">
      <draggable
        v-if="schema" :key="`${schema.model}`" :list="getAttachments()"
        draggable=".preview-attachment" handle=".row-handle" ghost-class="ghost"
        v-bind="dragOptions" :class="{disabled}" @end="onEndDrag" @start="onStartDrag"
      >
        <v-card v-for="(a, i) in getAttachments()" :key="`${a._filename}-${i}`" class="preview-attachment" :class="{odd: i % 2 !== 0}">
          <v-chip class="filename" close @click:close="removeImage(a)">#{{ i + 1 }} - {{ a._filename | truncate(10) }} ({{ imageSize(a) }})</v-chip>
          <div class="row-handle">
            <img :src="getImageSrc(a)">
            <v-icon>mdi-drag</v-icon>
          </div>
        </v-card>
      </draggable>
    </div>
    <template v-else-if="attachment() && isImage()">
      <div v-if="!(schema.width && schema.height)" class="preview-single-attachment">
        <v-chip class="filename" close @click:close="removeImage(attachment())">{{ attachment()._filename | truncate(10) }} ({{ imageSize(attachment()) }})</v-chip>
        <img class="preview" :src="getImageSrc()">
      </div>
      <template v-else>
        <cropper
          ref="cropper"
          :src="imageUrl()"
          :transitions="true"
          image-restriction="fill-area" image-class="cropper__image" default-boundaries="fill" class="cropper"
          :default-size="schema.options.width && schema.options.height ? getDefaultCropSize() : false" :default-position="getDefaultCropPosition"
          :min-width="schema.options.width" :max-width="schema.options.width" :min-height="schema.options.height " :max-height="schema.options.height"
          :move-image="schema.options.moveImage ? true : false" :resize-image="schema.options.resizeImage ? true : false"
          :stencil-props="stencilProps"
          @change="onCropperChange"
        />
      </template>
    </template>
    <template v-if="isForMultipleImages()">
      <div class="help-block">
        <v-icon small>mdi-information</v-icon>
        <span v-if="getMaxCount() !== -1 ">{{ 'TL_MAX_NUMBER_OF_IMAGES' | translate(null, { num: getMaxCount() }) }}</span>
        <span v-else>{{ 'TL_UNLIMITED_NUMBER_OF_IMAGES' | translate }}</span>
      </div>
    </template>
    <div v-if="(schema.width && schema.height)" class="help-block">
      <v-icon small>mdi-information</v-icon>
      <span>{{ 'TL_THIS_FIELD_REQUIRES_THE_FOLLOWING_SIZE'|translate }}:{{ schema.width }}x{{ schema.height }}</span>
    </div>
    <div v-if="(schema.limit)" class="help-block">
      <v-icon small>mdi-information</v-icon>
      <span>{{ 'TL_THIS_FIELD_REQUIRES_A_FILE_SIZE'|translate }}: {{ getFileSizeLimit(schema.limit) }}</span>
    </div>
    <div v-if="(schema.accept)" class="help-block">
      <v-icon small>mdi-information</v-icon>
      <span>{{ 'TL_THIS_FIELD_REQUIRES'|translate }}: {{ schema.accept }}</span>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import 'vue-advanced-cropper/dist/style.css'
import { Cropper } from 'vue-advanced-cropper'
import Notification from '@m/Notification'
import AbstractField from '@m/AbstractField'
import FileInputField from '@m/FileInputField'
import DragList from '@m/DragList'

export default {
  components: {
    Cropper
  },
  mixins: [Notification, AbstractField, FileInputField, DragList],
  data () {
    return {
      firstCropUpdate: true,
      stencilProps: {
        class: 'cropper-stencil',
        previewClass: 'cropper-stencil__preview',
        draggingClass: 'cropper-stencil--dragging',
        handlersClasses: {
          default: 'cropper-handler',
          eastNorth: 'cropper-handler--east-north',
          westNorth: 'cropper-handler--west-north',
          eastSouth: 'cropper-handler--east-south',
          westSouth: 'cropper-handler--west-south'
        }
      }
    }
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
          }
        }
      })
      this.$emit('input', this.localModel._attachments, this.schema.model)
    },
    imageUrl () {
      const attachment = this.attachment()
      return attachment && (attachment.url || attachment.data)
    }
  }
}
</script>
