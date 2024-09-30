<template>
  <div class="image-view" :class="{'full-width': !(schema.width && schema.height)}">
    <form enctype="multipart/form-data">
      <field-label :schema="schema" />
      <div class="test-info" />
      <v-card
        v-if="schema.disabled" :theme="theme"
        class="file-input-card" elevation="0" :class="{ 'drag-and-drop': dragover }"
        @drop.prevent="onDrop($event)" @dragover.prevent="dragover = true" @dragenter.prevent="dragover = true" @dragleave.prevent="dragover = false"
      >
        <v-file-input
          ref="input" :rules="getRules()" hide-details="auto" prepend-icon="" flat single-line
          :placeholder="getPlaceholder()" :clearable="false" :label="getPlaceholder()"
          density="compact" :variant="getVariant()" rounded persistent-placeholder :multiple="isForMultipleImages()" :accept="schema.accept" :disabled="true"
          @change="onUploadChanged" @update:focused="onFieldFocus"
        >
          <template #selection />
        </v-file-input>
      </v-card>
      <v-card
        v-else :theme="theme"
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
    <div v-if="isForMultipleImages()" class="preview-multiple">
      <draggable
        :key="`${schema.model}-${key}`"
        :list="getAttachments()" :group="`${schema.model}-${key}`" :item-key="getKey"
        draggable=".preview-attachment" handle=".row-handle" ghost-class="ghost"
        v-bind="dragOptions" :class="{disabled}" class="preview-multiple" @end="onEndDrag" @start="onStartDrag"
      >
        <v-card v-for="(a, i) in getAttachments()" :key="getKey(a)" :theme="theme" elevation="0" class="preview-attachment" :class="{odd: i % 2 !== 0}">
          <v-tooltip :theme="theme" location="right" eager>
            <template #activator="{ props }">
              <v-chip variant="outlined" class="filename" closable close-icon="mdi-close-circle-outline" v-bind="props" @click:close="removeImage(a, i)">#{{ i + 1 }} - {{ $filters.truncate(getAttachmentFilename(a),10) }} ({{ imageSize(a) }})</v-chip>
            </template>
            <span>{{ a._filename }}</span>
          </v-tooltip>
          <div class="row-handle">
            <div v-if="isImage(a)" class="image-wrapper">
              <v-img cover :src="getImageSrc(a)" />
            </div>
            <v-btn v-else-if="a._id" :theme="theme" size="small" rounded elevation="0" @click="viewFile(a)">{{ $filters.translate('TL_VIEW') }}</v-btn>
          </div>
        </v-card>
      </draggable>
    </div>
    <template v-else-if="attachment() && isImage()">
      <div v-if="!(schema.width && schema.height)" class="preview-single-attachment">
        <v-card v-for="(a, i) in getAttachments()" :key="getKey(a)" :theme="theme" elevation="0" class="preview-attachment" :class="{odd: i % 2 !== 0}">
          <v-tooltip :theme="theme" location="right" eager>
            <template #activator="{ props }">
              <v-chip variant="outlined" class="filename" closable close-icon="mdi-close-circle-outline" v-bind="props" @click:close="removeImage(attachment(), 0)">{{ $filters.truncate(getAttachmentFilename(attachment()),10) }} ({{ imageSize(attachment()) }})</v-chip>
            </template>
            <span>{{ attachment()._filename }}</span>
          </v-tooltip>
          <div class="image-wrapper">
            <v-img class="preview" cover :src="getImageSrc()" />
          </div>
        </v-card>
      </div>
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
    <template v-if="model._local && !disabled">
      <template v-if="isForMultipleImages()">
        <div class="help-block">
          <v-icon size="small">mdi-information</v-icon>
          <span v-if="getMaxCount() !== -1 ">{{ $filters.translate('TL_MAX_NUMBER_OF_IMAGES', { num: getMaxCount() }) }}</span>
          <span v-else>{{ $filters.translate('TL_UNLIMITED_NUMBER_OF_IMAGES') }}</span>
        </div>
      </template>
      <div v-if="(schema.width && schema.height)" class="help-block">
        <v-icon size="small">mdi-information</v-icon>
        <span>{{ $filters.translate('TL_THIS_FIELD_REQUIRES_THE_FOLLOWING_SIZE') }}:{{ schema.width }}x{{ schema.height }}</span>
      </div>
      <div v-if="(schema.limit)" class="help-block">
        <v-icon size="small">mdi-information</v-icon>
        <span>{{ $filters.translate('TL_THIS_FIELD_REQUIRES_A_FILE_SIZE') }}: {{ getFileSizeLimit(schema.limit) }}</span>
      </div>
      <div v-if="(schema.accept)" class="help-block">
        <v-icon size="small">mdi-information</v-icon>
        <span>{{ $filters.translate('TL_THIS_FIELD_REQUIRES') }}: {{ schema.accept }}</span>
      </div>
    </template>
  </div>
</template>

<script>
import _ from 'lodash'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import AbstractField from '@m/AbstractField'
import FileInputField from '@m/FileInputField'
import DragList from '@m/DragList'

export default {
  components: {
    Cropper
  },
  mixins: [AbstractField, FileInputField, DragList],
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
      const updatedAttachments = _.filter(this._value, (attachment) => {
        // NOTE: Localized fields
        if (_.get(attachment, '_fields.locale', false) && _.get(attachment, '_name', false) && `${attachment._fields.locale}.${attachment._name}` === this.schema.model) {
          return true
        }
        return _.get(attachment, '_name', false) === this.schema.model
      })
      this.$emit('input', updatedAttachments, this.schema.model)
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
  border: 2px $paragraph-top-bar-background solid;
  border-radius: 8px;
  padding: 8px;
  .v-card {
    background-color: transparent;
  }
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
.test-info {
  max-width: 100%;
}
</style>
