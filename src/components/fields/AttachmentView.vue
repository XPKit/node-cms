<template>
  <div class="attachment-view">
    <form v-if="!disabled" enctype="multipart/form-data">
      <div class="field-label"><span v-if="schema.required" class="red--text"><strong>* </strong></span>{{ schema.label }}</div>
      <v-card
        class="file-input-card" elevation="0" :class="{ 'drag-and-drop': dragover }"
        @drop.prevent="onDrop($event)" @dragover.prevent="dragover = true" @dragenter.prevent="dragover = true" @dragleave.prevent="dragover = false"
      >
        <v-file-input
          ref="input" :rules="getRules()" prepend-icon=""
          :placeholder="getPlaceholder() | translate" :clearable="false" :hide-details="isFieldValid()"
          dense filled rounded persistent-placeholder persistent-hint :multiple="isForMultipleImages()" :accept="schema.accept" :disabled="isForMultipleImages() && isFieldDisabled()"
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
        <v-card v-for="(a, i) in getAttachments()" :key="`${a._filename}-${i}`" elevation="0" class="preview-attachment" :class="{odd: i % 2 !== 0}">
          <div class="row-handle">
            <img v-if="isImage()" :src="getImageSrc(a)">
            <v-btn v-else small @click="viewFile(a)">{{ 'TL_VIEW' | translate }}</v-btn>
            <v-icon>mdi-drag</v-icon>
          </div>
          <v-tooltip right lazy>
            <template #activator="{ on }">
              <v-chip outlined class="filename" close close-icon="mdi-close-circle-outline" v-on="on" @click:close="removeImage(a)">#{{ i + 1 }} - {{ a._filename | truncate(10) }} ({{ imageSize(a) }})</v-chip>
            </template>
            <span>{{ a._filename }}</span>
          </v-tooltip>
        </v-card>
      </draggable>
    </div>
    <div v-else-if="attachment()" class="preview-single-attachment">
      <img v-if="isImage()" :src="getImageSrc()">
      <v-btn v-else small @click="viewFile()">{{ 'TL_VIEW' | translate }}</v-btn>
      <v-tooltip right lazy>
        <template #activator="{ on }">
          <v-chip class="filename" close v-on="on" @click:close="removeImage(attachment())">{{ attachment()._filename | truncate(10) }} ({{ imageSize(attachment()) }})</v-chip>
        </template>
        <span>{{ attachment()._filename }}</span>
      </v-tooltip>
    </div>
    <template v-if="model._local && !disabled">
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
    </template>
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
