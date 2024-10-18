<template>
  <div class="attachment-view">
    <form v-if="!disabled" enctype="multipart/form-data">
      <field-label :schema="schema" />
      <v-card
        v-if="!isFieldDisabled()"
        :theme="theme"
        class="file-input-card" elevation="0" :class="{ 'drag-and-drop': dragover }"
        @drop.prevent="onDrop($event)" @dragover.prevent="dragover = true" @dragenter.prevent="dragover = true" @dragleave.prevent="dragover = false"
      >
        <v-file-input
          ref="input"
          :theme="theme" flat :rules="getRules()" prepend-icon="" :label="getPlaceholder()" :placeholder="getPlaceholder()" :clearable="false" hide-details="auto"
          density="compact" :variant="getVariant()" rounded persistent-placeholder single-line :multiple="isForMultipleImages()" :accept="schema.accept" :disabled="isForMultipleImages() && isFieldDisabled()"
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
    <div v-else-if="attachment()" class="preview-single-attachment">
      <preview-attachment
        :theme="theme" :attachment="attachment()" :image-size="imageSize" :get-image-src="getImageSrc"
        :remove-image="removeImage" :is-image="isImage"
      />
    </div>
    <file-input-errors v-if="!disabled" field-type="file" :schema="schema" :is-for-multiple-images="isForMultipleImages" :get-max-count="getMaxCount" />
  </div>
</template>

<script>
import AbstractField from '@m/AbstractField'
import FileInputField from '@m/FileInputField'
import PreviewMultiple from '@c/PreviewMultiple'
import PreviewAttachment from '@c/PreviewAttachment'
import FileInputErrors from '@c/FileInputErrors'

export default {
  components: {PreviewMultiple, PreviewAttachment, FileInputErrors},
  mixins: [AbstractField, FileInputField]
}
</script>
