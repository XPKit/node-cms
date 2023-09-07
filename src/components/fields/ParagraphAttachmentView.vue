<template>
  <div class="paragraph-attachment-view">
    <v-card
      elevation="0" :class="{ 'drag-and-drop': dragover }"
      @drop.prevent="onDrop($event)" @dragover.prevent="dragover = true" @dragenter.prevent="dragover = true" @dragleave.prevent="dragover = false"
    >
      <v-file-input
        ref="input" :rules="getRules()"
        :accept="model.input === 'image'? 'image/*': '*'" :clearable="false" :placeholder="getPlaceholder() | translate"
        dense outlined persistent-placeholder persistent-hint :multiple="isForMultipleImages()" :disabled="isForMultipleImages() && isFieldDisabled()"
        @change="onChangeFile"
      >
        <template #selection="{index}">
          <div v-if="index === 0" class="v-file-input__text v-file-input__text--placeholder">
            {{ getPlaceholder() | translate }}
          </div>
        </template>
      </v-file-input>
    </v-card>
    <draggable
      v-if="schema" :key="`${schema.model}-${key}`" v-model="items" :group="`${schema.model}-${key}`"
      draggable=".preview-attachment" handle=".row-handle" ghost-class="ghost"
      v-bind="dragOptions" :class="{disabled}" class="preview-multiple" @end="onEndDrag" @start="onStartDrag"
    >
      <v-card v-for="(i, index) in items" :key="`${i._filename}-${index}`" class="preview-attachment" :class="{odd: index % 2 !== 0}">
        <v-chip class="filename" close @click:close="onClickRemoveFileItem(i)">#{{ index + 1 }} - {{ getAttachment(i, '_filename') | truncate(10) }} ({{ imageSize(getAttachment(i)) }})</v-chip>
        <div class="row-handle">
          <img v-if="isImage()" :src="getImageSrc(i)">
          <v-btn v-else-if="getAttachment(i, 'url')" small @click="viewFile(getAttachment(i))">{{ 'TL_VIEW' | translate }}</v-btn>
          <v-icon>mdi-drag</v-icon>
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
    onChange () {
      _.set(this.model, this.schema.model, this.items)
      this.$emit('input', this.model, this.schema.model)
    },
    onEndDrag () {
      _.set(this.model, this.schema.model, this.items)
      this.$emit('input', this.model, this.schema.model)
    },
    onDrop (event) {
      this.dragover = false
      if (this.schema.maxCount <= 1 && event.dataTransfer.files.length > 1) {
        return console.error('Only one file can be uploaded at a time..')
      }
      event.dataTransfer.files.forEach(element => {
        this.onChangeFile(element)
      })
    },
    onChangeFile (files) {
      this.$refs.input.validate()
      if (!this.$refs.input.valid) {
        return
      }
      if (!_.isArray(files)) {
        files = [files]
      }
      const { key, locale } = this.getKeyLocale()
      _.each(files, (file, i) => {
        const fileItemId = uuid()
        const newItem = {
          id: fileItemId
        }
        this.items.push(newItem)
        this.items = _.clone(this.items)
        _.set(this.model, this.schema.model, this.items)
        this.$emit('input', this.model, this.schema.model)
        const attachments = this.schema.rootView.model._attachments = this.schema.rootView.model._attachments || []
        const attachmentObj = {
          _filename: file.name,
          order: i + 1,
          orderUpdated: true,
          _name: key,
          _fields: {
            locale,
            fileItemId
          },
          file
        }
        if (this.schema.fileType === 'image') {
          try {
            attachmentObj.url = URL.createObjectURL(file)
          } catch (error) {
            console.error(error)
          }
        }
        attachments.push(attachmentObj)
        console.warn('added attachment = ', attachmentObj)
        event.target.value = null
      })
      _.set(this.model, this.schema.model, this.items)
      this.$emit('input', this.model, this.schema.model)
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
      max-width: 100px;
      max-height: 100px;
    }
  }
}
.disabled {
  pointer-events: none;
}
</style>
