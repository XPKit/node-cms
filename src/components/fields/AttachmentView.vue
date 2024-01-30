<template>
  <div class="attachment-view">
    <form v-if="!disabled" enctype="multipart/form-data">
      <div class="field-label"><span v-if="schema.required" class="text-red"><strong>* </strong></span>{{ schema.label }}</div>
      <v-card
        class="file-input-card" elevation="0" :class="{ 'drag-and-drop': dragover }"
        @drop.prevent="onDrop($event)" @dragover.prevent="dragover = true" @dragenter.prevent="dragover = true" @dragleave.prevent="dragover = false"
      >
        <v-file-input
          ref="input" :rules="getRules()" prepend-icon=""
          :placeholder="translate(getPlaceholder())" :clearable="false" hide-details="auto"
          density="compact" variant="filled" rounded persistent-placeholder persistent-hint :multiple="isForMultipleImages()" :accept="schema.accept" :disabled="isForMultipleImages() && isFieldDisabled()"
          @change="onUploadChanged"
        >
          <template #selection="{index}">
            <div v-if="index === 0" class="v-file-input__text v-file-input__text--placeholder">
              {{ translate(getPlaceholder()) }}
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
          <v-tooltip location="right">
            <template #activator="{ props }">
              <v-chip variant="outlined" class="filename" closable close-icon="mdi-close-circle-outline" v-bind="props" @click:close="removeImage(a)">#{{ i + 1 }} - {{ truncate(a._filename,10) }} ({{ imageSize(a) }})</v-chip>
            </template>
            <span>{{ a._filename }}</span>
          </v-tooltip>
          <div class="row-handle">
            <div v-if="isImage(a)" class="image-wrapper">
              <!-- {{ getImageSrc(a) }} -->
              <v-img cover :src="getImageSrc(a)" />
            </div>
            <v-btn v-else size="small" rounded elevation="0" @click="viewFile(a)">{{ translate('TL_VIEW') }}</v-btn>
          </div>
        </v-card>
      </draggable>
    </div>
    <div v-else-if="attachment()" class="preview-single-attachment">
      <v-tooltip location="right">
        <template #activator="{ props }">
          <v-chip class="filename" closable v-bind="props" @click:close="removeImage(attachment())">{{ truncate(attachment()._filename,10) }} ({{ imageSize(attachment()) }})</v-chip>
        </template>
        <span>{{ attachment()._filename }}</span>
      </v-tooltip>
      <div v-if="isImage()" class="image-wrapper">
        <v-img cover :src="getImageSrc(a)" />
      </div>
      <v-btn v-else size="small" rounded elevation="0" @click="viewFile()">{{ translate('TL_VIEW') }}</v-btn>
    </div>
    <template v-if="model._local && !disabled">
      <template v-if="isForMultipleImages()">
        <div class="help-block">
          <v-icon size="small">mdi-information</v-icon>
          <span v-if="getMaxCount() !== -1 ">{{ translate('TL_MAX_NUMBER_OF_FILES', { num: getMaxCount() }) }}</span>
          <span v-else>{{ translate('TL_UNLIMITED_NUMBER_OF_FILES') }}</span>
        </div>
      </template>
      <div v-if="(schema.width && schema.height)" class="help-block">
        <v-icon size="small">mdi-information</v-icon>
        <span>{{ translate('TL_THIS_FIELD_REQUIRES_THE_FOLLOWING_SIZE') }}:{{ schema.width }}x{{ schema.height }}</span>
      </div>
      <div v-if="(schema.limit)" class="help-block">
        <v-icon size="small">mdi-information</v-icon>
        <span>{{ translate('TL_THIS_FIELD_REQUIRES_A_FILE_SIZE') }}: {{ getFileSizeLimit(schema.limit) }}</span>
      </div>
      <div v-if="(schema.accept)" class="help-block">
        <v-icon size="small">mdi-information</v-icon>
        <span>{{ translate('TL_THIS_FIELD_REQUIRES') }}: {{ schema.accept }}</span>
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
