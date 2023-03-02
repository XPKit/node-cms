<template>
  <div class="attachment-view">
    <div v-for="attachment in getAtttachments()" :key="attachment._id">
      <label>{{ attachment && attachment._filename }}</label>
      <button v-if="attachment.url" @click="viewFile(attachment)">{{ 'TL_VIEW'|translate }}</button>
      <button v-if="!disabled" @click="removeFile(attachment)">{{ 'TL_DELETE'|translate }}</button>
      <div class="help-block">
        <span>{{ 'TL_CURRENT_FILESIZE'|translate }}: {{ bytesToSize(attachment._size) }}</span>
      </div>
    </div>
    <form v-if="!disabled && getAtttachments().length < schema.maxCount" enctype="multipart/form-data">
      <input :key="schema.model" type="file" :accept="schema.accept" @change="onUploadChanged">
    </form>
  </div>
</template>

<script>
import _ from 'lodash'
import { abstractField } from 'vue-form-generator'

export default {
  components: {
  },
  mixins: [abstractField],
  data () {
    return {
    }
  },
  mounted () {
  },
  methods: {
    viewFile (attachment) {
      const filnameComponents = _.get(attachment, '_filename', '').split('.')
      let suffix = ''
      if (filnameComponents.length > 1) {
        suffix = `.${_.last(filnameComponents)}`
      }
      const win = window.open(window.origin + attachment.url + suffix, '_blank')
      win.focus()
      console.log(attachment)
    },
    removeFile (attachment) {
      this.model._attachments = _.filter(this.model._attachments, item => item !== attachment)
      this.$forceUpdate()
      this.$emit('model-updated', this.model._attachments, this.schema.model)
      // work around to force label update
      const dummy = this.schema.label
      this.schema.label = null
      this.schema.label = dummy
    },
    bytesToSize (bytes) {
      const sizes = [
        'Bytes',
        'KB',
        'MB',
        'GB',
        'TB'
      ]
      if (bytes === 0) {
        return '0 Byte'
      }
      const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
      const result = Math.round(bytes / Math.pow(1024, i), 2)
      if (_.isNaN(result)) {
        return 'Unknown'
      }
      return `${result} ${sizes[i]}`
    },
    onUploadChanged (e) {
      const files = e.target.files || e.dataTransfer.files
      if (!files.length) {
        return
      }

      const reader = new FileReader()
      const vm = this

      reader.onload = (e) => {
        const { key, locale } = vm.getKeyLocale()

        vm.model._attachments.push({
          _filename: files[0].name,
          _name: key,
          _fields: {
            locale
          },
          field: this.schema.model,
          localised: this.schema.localised,
          file: files[0],
          data: e.target.result
        })
        vm.$forceUpdate()
        this.$emit('model-updated', this.model._attachments, this.schema.model)
        // work around to force label update
        const dummy = this.schema.label
        this.schema.label = null
        this.schema.label = dummy
      }
      reader.readAsDataURL(files[0])
    },
    getKeyLocale () {
      const options = {}
      const list = this.schema.model.split('.')
      if (this.schema.localised) {
        options.locale = list.shift()
      }
      options.key = list.join('.')
      return options
    },
    imageUrl (attachment) {
      return attachment && (attachment.data || attachment.url)
    },
    getAtttachments () {
      const { key, locale } = this.getKeyLocale()
      return _.filter(this.model._attachments, attachment => attachment._name === key && (attachment._fields && attachment._fields.locale) === locale)
    }
  }

}
</script>
