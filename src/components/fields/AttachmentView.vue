<template>
  <div class="attachment-view">
    <form v-if="!disabled" enctype="multipart/form-data">
      <field-label :schema="schema" />
      <v-card
        :theme="theme"
        class="file-input-card" elevation="0" :class="{ 'drag-and-drop': dragover }"
        @drop.prevent="onDrop($event)" @dragover.prevent="dragover = true" @dragenter.prevent="dragover = true" @dragleave.prevent="dragover = false"
      >
        <v-file-input
          ref="input"
          :theme="theme" flat :rules="getRules()" prepend-icon="" :label="getPlaceholder()" :placeholder="getPlaceholder()" :clearable="false" hide-details="auto"
          density="compact" :variant="getVariant()" rounded persistent-placeholder single-line :multiple="isForMultipleImages()" :accept="schema.accept" :disabled="isForMultipleImages() && isFieldDisabled()"
          @change="onUploadChanged"
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
          <v-tooltip location="right" eager>
            <template #activator="{ props }">
              <v-chip variant="outlined" class="filename" closable close-icon="mdi-close-circle-outline" v-bind="props" @click:close="removeImage(a, i)">#{{ i + 1 }} - {{ $filters.truncate(a._filename,10) }} ({{ imageSize(a) }})</v-chip>
            </template>
            <span>{{ a._filename }}</span>
          </v-tooltip>
          <div class="row-handle">
            <div v-if="isImage(a)" class="image-wrapper">
              <v-img cover :src="getImageSrc(a)" />
            </div>
            <v-btn v-else-if="a._id" size="small" rounded elevation="0" @click="viewFile(a)">{{ $filters.translate('TL_VIEW') }}</v-btn>
          </div>
        </v-card>
      </draggable>
    </div>
    <div v-else-if="attachment()" class="preview-single-attachment">
      <v-tooltip location="right" eager>
        <template #activator="{ props }">
          <v-chip class="filename" closable v-bind="props" @click:close="removeImage(attachment(), 0)">{{ $filters.truncate(attachment()._filename,10) }} ({{ imageSize(attachment()) }})</v-chip>
        </template>
        <span>{{ attachment()._filename }}</span>
      </v-tooltip>

      <div v-if="isImage()" class="image-wrapper">
        <v-img cover :src="getImageSrc(a)" />
      </div>
      <v-btn v-else size="small" rounded elevation="0" @click="viewFile()">{{ $filters.translate('TL_VIEW') }}</v-btn>
    </div>
    <template v-if="model._local && !disabled">
      <template v-if="isForMultipleImages()">
        <div class="help-block">
          <v-icon size="small">mdi-information</v-icon>
          <span v-if="getMaxCount() !== -1 ">{{ $filters.translate('TL_MAX_NUMBER_OF_FILES', { num: getMaxCount() }) }}</span>
          <span v-else>{{ $filters.translate('TL_UNLIMITED_NUMBER_OF_FILES') }}</span>
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
