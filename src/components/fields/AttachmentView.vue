<template>
  <div class="attachment-view">
    <div v-for="(attachment, i) in getAttachments()" :key="`${attachment._id}-${i}`">
      <label>{{ attachment && attachment._filename }}</label>
      <v-btn v-if="attachment.url" @click="viewFile(attachment)">{{ 'TL_VIEW' | translate }}</v-btn>
      <v-btn v-if="!disabled" @click="removeFile(attachment)">{{ 'TL_DELETE' | translate }}</v-btn>
      <div class="help-block">
        <span>{{ 'TL_CURRENT_FILESIZE' | translate }}: {{ bytesToSize(attachment._size) }}</span>
      </div>
    </div>
    <form v-if="!disabled && getAttachments().length < schema.maxCount" enctype="multipart/form-data">
      <v-card
        :class="{ 'drag-and-drop': dragover }"
        @drop.prevent="onDrop($event)"
        @dragover.prevent="dragover = true"
        @dragenter.prevent="dragover = true"
        @dragleave.prevent="dragover = false"
      >
        <v-file-input :key="schema.model" ref="fileInput" hide-details :label="schema.label" dense outlined :multiple="schema.maxCount > 1" :accept="schema.accept" show-size @change="onUploadChanged" />
        <!-- <input :key="schema.model" type="file" :accept="schema.accept" @change="onUploadChanged"> -->
      </v-card>
    </form>
  </div>
</template>

<script>
import _ from 'lodash'
import AbstractField from '@m/AbstractField'
export default {
  mixins: [AbstractField],
  data () {
    return {
      localModel: false,
      dragover: false
    }
  },
  created () {
    this.localModel = _.cloneDeep(this.model)
  },
  methods: {
    viewFile (attachment) {
      const filenameComponents = _.get(attachment, '_filename', '').split('.')
      let suffix = ''
      if (filenameComponents.length > 1) {
        suffix = `.${_.last(filenameComponents)}`
      }
      const win = window.open(window.origin + attachment.url + suffix, '_blank')
      win.focus()
      console.log(attachment)
    },
    removeFile (attachment) {
      this.$refs.fileInput.internalValue = null
      this.$refs.fileInput.$refs.input.value = null
      this.localModel._attachments = _.filter(this.localModel._attachments, item => item !== attachment)
      this.$forceUpdate()
      this.$emit('input', this.localModel._attachments, this.schema.model)
    },
    onDrop (event) {
      this.dragover = false
      if (this.schema.maxCount <= 1 && event.dataTransfer.files.length > 1) {
        return console.error('Only one file can be uploaded at a time..')
      }
      event.dataTransfer.files.forEach(element =>
        this.onUploadChanged(element)
      )
    },
    bytesToSize (bytes) {
      if (bytes === 0) {
        return '0 Byte'
      }
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
      const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
      const result = Math.round(bytes / Math.pow(1024, i), 2)
      if (_.isNaN(result)) {
        return 'Unknown'
      }
      return `${result} ${sizes[i]}`
    },
    onUploadChanged (files) {
      files = _.isNull(files) ? [] : files
      if (!_.isArray(files)) {
        files = [files]
      }
      if (!files.length) {
        return
      }
      _.each(files, (file) => {
        const reader = new FileReader()
        const vm = this
        reader.onload = (e) => {
          const { key, locale } = vm.getKeyLocale()
          console.warn('onload = ', vm.localModel)
          vm.localModel._attachments.push({
            _filename: file.name,
            _name: key,
            _fields: {
              locale
            },
            field: this.schema.model,
            localised: this.schema.localised,
            file: file,
            data: e.target.result
          })
          vm.$forceUpdate()
          this.$emit('input', this.localModel._attachments, this.schema.model)
        }
        reader.readAsDataURL(file)
      })
    },
    imageUrl (attachment) {
      return attachment && (attachment.data || attachment.url)
    },
    getAttachments () {
      const { key, locale } = this.getKeyLocale()
      return _.filter(this.localModel._attachments, attachment => attachment._name === key && (attachment._fields && attachment._fields.locale) === locale)
    }
  }
}
</script>
