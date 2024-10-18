<template>
  <div class="image-view" :class="{'full-width': !(schema.width && schema.height)}">
    <form enctype="multipart/form-data">
      <field-label :schema="schema" />
      <v-card
        v-if="!isFieldDisabled()"
        :theme="theme"
        class="file-input-card" elevation="0" :class="{ 'drag-and-drop': dragover }"
        @drop.prevent="onDrop($event)" @dragover.prevent="dragover = true" @dragenter.prevent="dragover = true" @dragleave.prevent="dragover = false"
      >
        <v-file-input
          ref="input"
          :theme="theme"
          variant="solo-filled" :rules="getRules()" hide-details="auto" prepend-icon="" flat single-line
          :placeholder="getPlaceholder()" :clearable="false" :label="getPlaceholder()"
          density="compact" rounded persistent-placeholder :multiple="isForMultipleImages()" :accept="schema.accept" :disabled="isForMultipleImages() && isFieldDisabled()"
          @change="onUploadChanged" @update:focused="onFieldFocus"
        >
          <template #selection />
        </v-file-input>
      </v-card>
    </form>
    <preview-multiple
      v-if="isForMultipleImages()" :attachments="getAttachments()" :schema="schema" :theme="theme" :is-image="isImage" :disabled="disabled" :on-end-drag="onEndDrag" :image-size="imageSize" :get-image-src="getImageSrc"
      :remove-image="removeImage"
    />
    <template v-else-if="attachment() && isImage()">
      <div v-if="!(schema.width && schema.height)" class="preview-single-attachment">
        <preview-attachment
          :theme="theme" :attachment="attachment()" :image-size="imageSize" :get-image-src="getImageSrc"
          :remove-image="removeImage" :is-image="isImage"
        />
      </div>
      <!-- Cropped image field -->
      <div v-else class="parent-parent">
        <div class="cropper-parent">
          <cropper
            ref="cropper"
            :src="imageUrl()"
            :transitions="true"
            image-restriction="fit-area" image-class="cropper__image" default-boundaries="fill" class="cropper"
            :default-size="schema.options.width && schema.options.height ? getDefaultCropSize() : false" :default-position="getDefaultCropPosition"
            :min-width="schema.options.width" :max-width="schema.options.width" :min-height="schema.options.height " :max-height="schema.options.height"
            :move-image="schema.options.moveImage ? true : false" :resize-image="schema.options.resizeImage ? true : false"
            :stencil-props="stencilProps"
            @change="onCropperChange"
          />
        </div>
        <v-btn elevation="2" class="delete" icon :disabled="imageUrl().length === 0" @click="removeImage(attachment(), 0)"><v-icon>mdi-trash-can-outline</v-icon></v-btn>
      </div>
    </template>
    <file-input-errors v-if="!disabled" field-type="image" :schema="schema" :is-for-multiple-images="isForMultipleImages" :get-max-count="getMaxCount" />
  </div>
</template>

<script>
import _ from 'lodash'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import AbstractField from '@m/AbstractField'
import FileInputField from '@m/FileInputField'
import PreviewMultiple from '@c/PreviewMultiple'
import PreviewAttachment from '@c/PreviewAttachment'
import FileInputErrors from '@c/FileInputErrors'

export default {
  components: {
    Cropper, PreviewMultiple, PreviewAttachment, FileInputErrors
  },
  mixins: [AbstractField, FileInputField],
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
      _.each(this._value, (localAttachment) => {
        if (localAttachment._id === attachment._id) {
          localAttachment.cropOptions = data.coordinates
          if (this.firstCropUpdate) {
            this.firstCropUpdate = false
          } else {
            localAttachment.cropOptions.updated = true
          }
        }
      })
      // const updatedAttachments = _.filter(this._value, (attachment) => {
      //   // NOTE: Localized fields
      //   if (_.get(attachment, '_fields.locale', false) && _.get(attachment, '_name', false) && `${attachment._fields.locale}.${attachment._name}` === this.schema.model) {
      //     return true
      //   }
      //   return _.get(attachment, '_name', false) === this.schema.model
      // })
      this.$emit('input', this._value, this.schema.model)
    },
    imageUrl () {
      const attachment = this.attachment()
      return attachment && (attachment.url || attachment.data)
    }
  }
}
</script>

<style lang="scss">
@import '@a/scss/variables.scss';

.image-view {

  .field-label {
    padding-left: 8px;
  }
  .parent-parent {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    height: 281.25px;
    max-width: 500px;
    .v-btn {
      position: absolute;
      top: 0;
      right: 0;
      z-index: 2;
      transform: translate(50%, -50%);
    }
  }
  .cropper-parent {
    flex: 1;
    height: 500px;
    min-height: 0;
  }
  .cropper {
    min-height: 281.25px;
    width: 100%;
    height: 100%;
  }
}
</style>
