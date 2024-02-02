<template>
  <div class="paragraph-attachment-view">
    <v-card
      elevation="0" :class="{ 'drag-and-drop': dragover }"
      @drop.prevent="onDrop($event)" @dragover.prevent="dragover = true" @dragenter.prevent="dragover = true" @dragleave.prevent="dragover = false"
    >
      <v-file-input
        ref="input" :rules="getRules()" prepend-icon="" flat single-line
        :accept="model.input === 'image'? 'image/*': '*'" :clearable="false" :placeholder="getPlaceholder()" :label="getPlaceholder()"
        density="compact" variant="solo-filled" rounded persistent-placeholder :multiple="isForMultipleImages()" :disabled="isForMultipleImages() && isFieldDisabled()"
        @change="onUploadChanged"
      >
        <template #selection />
      </v-file-input>
    </v-card>
    <draggable
      v-if="schema" :key="`${schema.model}-${key}`" :list="items" :group="`${schema.model}-${key}`" :item-key="getKey"
      draggable=".preview-attachment" handle=".row-handle" ghost-class="ghost"
      v-bind="dragOptions" :class="{disabled}" class="preview-multiple" @end="onEndDrag" @start="onStartDrag"
    >
      <v-card v-for="(a, i) in getAttachments()" :key="getKey(a)" elevation="0" class="preview-attachment" :class="{odd: i % 2 !== 0}">
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-chip variant="outlined" class="filename" closable close-icon="mdi-close-circle-outline" v-bind="props" @click:close="removeImage(a)">#{{ i + 1 }} - {{ $filters.truncate(a._filename,10) }} ({{ imageSize(a) }})</v-chip>
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
    <draggable
      v-if="schema" :key="`${schema.model}-${key}`" :list="items" :group="`${schema.model}-${key}`" :item-key="getKey"
      draggable=".preview-attachment" handle=".row-handle" ghost-class="ghost"
      v-bind="dragOptions" :class="{disabled}" class="preview-multiple" @end="onEndDrag" @start="onStartDrag"
    >
      <v-card v-for="i in items" :key="getKey(i)" elevation="0" class="preview-attachment" :class="{odd: index % 2 !== 0}">
        <div class="row-handle">
          <v-tooltip location="right">
            <template #activator="{ props }">
              <v-chip class="filename" closable v-bind="props" @click:close="onClickRemoveFileItem(i)">#{{ index + 1 }} - {{ $filters.translate(getAttachment(i, '_filename')) }} ({{ imageSize(getAttachment(i)) }})</v-chip>
            </template>
            <span>{{ getAttachment(i, '_filename') }}</span>
          </v-tooltip>
          <div v-if="isImage(getAttachment(i))" class="image-wrapper">
            <v-img cover :src="getImageSrc(getAttachment(i))" />
          </div>
          <v-btn v-else-if="getAttachment(i, 'url')" size="small" rounded elevation="0" @click="viewFile(getAttachment(i))">{{ $filters.translate('TL_VIEW') }}</v-btn>
        </div>
      </v-card>
    </draggable>
  </div>
</template>

<script>
import {v4 as uuid} from 'uuid'
import _ from 'lodash'
import AbstractField from '@m/AbstractField'
import FileInputField from '@m/FileInputField'
import DragList from '@m/DragList'

export default {
  mixins: [AbstractField, FileInputField, DragList],
  data () {
    return {
      dragover: false,
      isForParagraph: true,
      items: _.get(this.model, this.schema.model, []),
      key: uuid(),
      attachments: []
    }
  },
  watch: {
    'schema.model': function () {
      this.items = _.get(this.model, this.schema.model, [])
      this.attachments = this.formatItems()
      // console.warn('changed !', this.attachments)
    }
  },
  mounted () {
    this.attachments = this.formatItems()
    // console.warn('attachments = ', this.attachments)
  },
  methods: {
    formatItems () {
      return _.map(this.items, (i) => this.getAttachment(i))
    },
    getAttachment (fileItemId, field) {
      const attach = _.find(this.schema.rootView.model._attachments, {_fields: {fileItemId: fileItemId.id}})
      return field ? _.get(attach, field) : attach
    },
    onClickRemoveFileItem (fileItem) {
      // console.warn('onClickRemoveFileItem -', fileItem)
      let attachments = this.schema.rootView.model._attachments = this.schema.rootView.model._attachments || []
      attachments = _.reject(attachments, {_fields: {fileItemId: fileItem.id}})
      this.items = _.difference(this.items, [fileItem])
      _.set(this.schema.rootView.model, '_attachments', attachments)
      _.set(this.model, this.schema.model, this.items)
      this.$emit('input', this.model, this.schema.model)
    },
    getKey (elem) {
      return `${elem._filename}-${Math.random()}`
    }
  }

}
</script>

<style lang="scss" scoped>
.item {
  display: flex;
  margin-bottom: 5px;
  align-items: stretch;
  border: 1px grey solid;

  .handle, .file-item-handle {
    display: inline-block;
    width: 20px;
    background-color: grey;
    cursor: pointer;
  }

  textarea, input {
    width: 100%;
  }
  textarea {
    height: 100px;
  }
  .row {
    display: flex;
    span {
      display: block;
      width: calc(100% - 50px);
      &:first-child {
        width: 50px;
      }
    }
  }
  .item-main {
    width: 100%;
    padding: 10px;
  }
  .file-item {
    display: flex;
    margin-bottom: 10px;
    textarea {
      height: 50px;
    }
  }

  .file-item-main {
    width: 100%;

    img {
      max-width: 200px;
      max-height: 113px;
    }
  }
}
.disabled {
  pointer-events: none;
}
.preview-multiple {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
}
</style>
