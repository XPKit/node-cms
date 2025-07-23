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
          density="compact" rounded persistent-placeholder :multiple="isForMultipleImages()" :accept="schema.accept"
          @change="onUploadChanged" @update:focused="onFieldFocus"
        >
          <template #selection />
        </v-file-input>
      </v-card>
    </form>
    <preview-multiple
      :attachments="getAttachments()" :schema="schema" :theme="theme" :is-image="isImage" :disabled="disabled" :on-end-drag="onEndDrag" :image-size="imageSize" :get-image-src="getImageSrc"
      :remove-image="removeImage" :on-cropper-change="onCropperChange"
    />
    <file-input-errors v-if="!disabled" field-type="image" :schema="schema" :is-for-multiple-images="isForMultipleImages" :get-max-count="getMaxCount" />
  </div>
</template>

<script>
import _ from 'lodash'
import AbstractField from '@m/AbstractField'
import FileInputField from '@m/FileInputField'
import PreviewMultiple from '@c/PreviewMultiple'
import FileInputErrors from '@c/FileInputErrors'

export default {
  components: {PreviewMultiple, FileInputErrors},
  mixins: [AbstractField, FileInputField],
  methods: {
    onCropperChange (index, data) {
      const attachments = this.getAttachments()
      _.set(attachments, `[${index}].cropOptions`, {data: {coordinates: data.coordinates}, updated: true})
      this.attachments = attachments
      this._value = attachments
    }
  }
}
</script>

<style lang="scss">
@use '@a/scss/variables.scss' as *;

.image-view {

  .field-label {
    padding-left: 8px;
  }
}
</style>
