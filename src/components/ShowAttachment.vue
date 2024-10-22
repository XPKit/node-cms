<template>
  <div class="row-handle">
    <div v-if="isImage(attachment)" class="image-wrapper">
      <v-img v-if="attachment._id" cover :src="getImageSrc(attachment)" class="clickable" @click="viewFile()" />
      <v-img v-else cover :src="getImageSrc(attachment)" />
      <!-- Cropped image -->
      <v-dialog v-if="attachment && schema.crop" class="crop-dialog">
        <template #activator="{ props: activatorProps }">
          <v-btn class="edit-crop" v-bind="activatorProps" variant="outlined" rounded size="small">
            <v-icon>mdi-crop</v-icon>{{ $filters.translate('TL_EDIT_CROP') }}
          </v-btn>
        </template>
        <template #default="{ isActive }">
          <v-card :title="$filters.translate(schema.label)">
            <div class="parent-parent">
              <div class="cropper-parent">
                <cropper
                  ref="cropper"
                  :src="imageUrl()" :transitions="true"
                  image-restriction="fit-area" default-boundaries="fill" class="cropper"
                  :default-size="getDefaultCropSize()" :default-position="getDefaultCropPosition"
                  :min-width="schema.crop.width" :max-width="schema.crop.width" :min-height="schema.crop.height " :max-height="schema.crop.height"
                  :move-image="hasOpt('moveImage')" :resize-image="hasOpt('resizeImage')"
                  :stencil-props="stencilProps"
                  @change="onCropperChangeForAttachment"
                />
              </div>
            </div>
            <v-card-actions>
              <v-btn variant="outlined" rounded @click="isActive.value = false">
                {{ $filters.translate('TL_CLOSE') }}
              </v-btn>
              <v-btn variant="outlined" rounded class="apply" @click="apply(isActive)">
                {{ $filters.translate('TL_APPLY_CROP') }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </template>
      </v-dialog>
    </div>
    <v-btn v-else-if="attachment._id" :theme="theme" size="small" rounded elevation="0" @click="viewFile()">{{ $filters.translate('TL_VIEW') }}</v-btn>
  </div>
</template>

<script>
import _ from 'lodash'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

export default {
  components: {Cropper},
  props: {
    attachment: {
      type: Object,
      default: () => {}
    },
    getImageSrc: {
      type: Function,
      default: ()=> {}
    },
    imageSize: {
      type: Function,
      default: ()=> {}
    },
    schema: {
      type: Object,
      default: ()=> {}
    },
    removeImage: {
      type: Function,
      default: ()=> {}
    },
    isImage: {
      type: Function,
      default: ()=> {}
    },
    onCropperChange: {
      type: Function,
      default: ()=> {}
    }
  },
  data() {
    return {
      cropData: false,
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
    viewFile () {
      if (!this.attachment) {
        return
      }
      const filenameComponents = _.get(this.attachment, '_filename', '').split('.')
      const suffix = filenameComponents.length > 1 ? `.${_.last(filenameComponents)}` : ''
      const win = window.open(window.origin + this.attachment.url + suffix, '_blank')
      win.focus()
    },
    hasOpt(key) {
      return _.get(this.schema, `crop.${key}`, false)
    },
    imageUrl () {
      return _.get(this.attachment, 'url', _.get(this.attachment, 'data', ''))
    },
    getDefaultCropPosition ({ imageSize, visibleArea, coordinates }) {
      if (_.get(this.attachment, 'cropOptions', false)) {
        return {
          left: this.attachment.cropOptions.left,
          top: this.attachment.cropOptions.top
        }
      }
      const area = visibleArea || imageSize
      return {
        left: (visibleArea ? visibleArea.left : 0) + area.width / 2 - coordinates.width / 2,
        top: (visibleArea ? visibleArea.top : 0) + area.height / 2 - coordinates.height / 2
      }
    },
    getDefaultCropSize () {
      return {
        width: _.get(this.schema, 'crop.width', 500),
        height: _.get(this.schema, 'crop.height', 500)
      }
    },
    onCropperChangeForAttachment(data) {
      this.cropData = data
      if (this.firstCropUpdate) {
        return this.firstCropUpdate = false
      }
    },
    apply(isActive) {
      isActive.value = false
      this.onCropperChange(this.cropData)
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@a/scss/variables.scss';

.edit-crop {
  margin-top: 8px;
}
.crop-dialog {
  .v-card {
    max-width: 100%;
    max-height: 90vh;
    overflow: hidden;
  }
  .parent-parent {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    overflow: hidden;
    height: 70vh;
  }
  .cropper {
    max-width: 100%;
    max-height: 70vh;
  }
  .v-card-actions {
    .v-btn {
      @include cta-text;
      &.apply {
        color: $btn-action-color;
        background-color: $btn-action-background;
      }
    }
  }
}
</style>
