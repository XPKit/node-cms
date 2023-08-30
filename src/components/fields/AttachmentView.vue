<template>
  <div class="attachment-view">
    <form v-if="!disabled" enctype="multipart/form-data">
      <v-card
        class="file-input-card" elevation="0" :class="{ 'drag-and-drop': dragover }"
        @drop.prevent="onDrop($event)" @dragover.prevent="dragover = true" @dragenter.prevent="dragover = true" @dragleave.prevent="dragover = false"
      >
        <v-file-input
          ref="input" :rules="getRules()"
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
    <div v-if="isForMultipleImages()" class="preview-multiple">
      <draggable
        v-if="schema" :key="`${schema.model}`" :list="getAttachments()"
        draggable=".preview-attachment" handle=".row-handle" ghost-class="ghost"
        v-bind="dragOptions" :class="{disabled}" @end="onEndDrag" @start="onStartDrag"
      >
        <v-card v-for="(a, i) in getAttachments()" :key="`${a._filename}-${i}`" class="preview-attachment" :class="{odd: i % 2 !== 0}">
          <v-chip class="filename" close @click:close="removeImage(a)">#{{ i + 1 }} - {{ a._filename | truncate(10) }} ({{ imageSize(a) }})</v-chip>
          <div class="row-handle">
            <img v-if="isImage()" :src="getImageSrc(a)">
            <v-btn v-else small @click="viewFile(a)">{{ 'TL_VIEW' | translate }}</v-btn>
            <v-icon>mdi-drag</v-icon>
          </div>
        </v-card>
      </draggable>
    </div>
    <div v-else-if="attachment()" class="preview-single-attachment">
      <v-chip class="filename" close @click:close="removeImage(attachment())">{{ attachment()._filename | truncate(10) }} ({{ imageSize(attachment()) }})</v-chip>
      <img v-if="isImage()" :src="getImageSrc()">
      <v-btn v-else small @click="viewFile()">{{ 'TL_VIEW' | translate }}</v-btn>
    </div>
    <template v-if="isForMultipleImages()">
      <div class="help-block">
        <v-icon small>mdi-information</v-icon>
        <span v-if="getMaxCount() !== -1 ">{{ 'TL_MAX_NUMBER_OF_FILES' | translate(null, { num: getMaxCount() }) }}</span>
        <span v-else>{{ 'TL_UNLIMITED_NUMBER_OF_FILES' | translate }}</span>
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
import AbstractField from '@m/AbstractField'
import FileInputField from '@m/FileInputField'
import DragList from '@m/DragList'
export default {
  mixins: [AbstractField, FileInputField, DragList]
}
</script>

<style lang="scss" scoped>
.v-card {
  background-color: transparent;
}
</style>
