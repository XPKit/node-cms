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
          density="compact" :variant="getVariant()" rounded persistent-placeholder single-line :multiple="isForMultipleImages()" :accept="schema.accept"
          @change="onUploadChanged" @update:focused="onFieldFocus"
        >
          <template #selection />
        </v-file-input>
      </v-card>
    </form>
    <preview-multiple
      :attachments="getAttachments()" :schema="schema" :theme="theme" :is-image="isImage" :disabled="disabled" :on-end-drag="onEndDrag" :image-size="imageSize" :get-image-src="getImageSrc"
      :remove-image="removeImage"
    />
    <file-input-errors v-if="!disabled" field-type="file" :schema="schema" :is-for-multiple-images="isForMultipleImages" :get-max-count="getMaxCount" />
  </div>
</template>

<script>
import FileInputErrors from '@c/FileInputErrors'
import PreviewMultiple from '@c/PreviewMultiple'
import AbstractField from '@m/AbstractField'
import FileInputField from '@m/FileInputField'

export default {
  components: { PreviewMultiple, FileInputErrors },
  mixins: [AbstractField, FileInputField],
}
</script>
