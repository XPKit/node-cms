<template>
  <div class="attachment-view">
    <div v-for="attachment in getAttachments()" :key="attachment._id">
      <label>{{ attachment && attachment._filename }}</label>
      <v-btn v-if="attachment.url" small @click="viewFile(attachment)">{{ 'TL_VIEW' | translate }}</v-btn>
      <v-btn v-if="!disabled" class="ml-4" color="error" small @click="removeFile(attachment)">{{ 'TL_DELETE' | translate }}</v-btn>
      <div class="help-block">
        <span>{{ 'TL_CURRENT_FILESIZE' | translate }}: {{ bytesToSize(attachment._size) }}</span>
      </div>
    </div>
    <form v-if="!disabled && getAttachments().length < schema.maxCount" enctype="multipart/form-data">
      <v-file-input :key="schema.model" :label="schema.label" dense outlined :multiple="schema.maxCount > 1" :accept="schema.accept" show-size @change="onUploadChanged" />
    </form>
  </div>
</template>

<script>
import _ from 'lodash'

export default {
  props: ['obj', 'vfg', 'model', 'disabled'],
  data () {
    return {
      schema: _.get(this.obj, 'schema', {}),
      localModel: {}
    }
  },
  watch: {
    obj () {
      this.updateLocalData()
    }
  },
  mounted () {
    this.updateLocalData()
  },
  methods: {
    updateLocalData () {
      this.schema = _.cloneDeep(this.obj.schema)
      this.localModel = _.cloneDeep(this.model)
    },
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
      // this.model._attachments = _.filter(this.model._attachments, item => item !== attachment)
      this.localModel._attachments = _.filter(this.model._attachments, item => item !== attachment)
      this.$forceUpdate()
      // this.$emit('update:model', this.localModel)
      this.$emit('input', this.localModel._attachments)

      // work around to force label update
      const dummy = this.schema.label
      this.schema.label = null
      this.schema.label = dummy
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
      if (_.isNull(files)) {
        return
      }
      if (!_.isArray(files)) {
        files = [files]
      }
      if (!files.length) {
        return
      }
      const reader = new FileReader()
      const vm = this
      reader.onload = (e) => {
        const { key, locale } = vm.getKeyLocale()
        vm.localModel._attachments.push({
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
        // console.warn('attachments - ', vm.localModel._attachments)
        // this.$emit('update:model', vm.localModel)
        this.$emit('input', this.localModel._attachments)
        // work around to force label update
        const dummy = this.schema.label
        this.schema.label = null
        this.schema.label = dummy
      }
      console.warn('attachments 2- ', this.localModel._attachments)

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
    getAttachments () {
      const { key, locale } = this.getKeyLocale()
      return _.filter(this.model._attachments, attachment => attachment._name === key && (attachment._fields && attachment._fields.locale) === locale)
    }
  }

}
</script>
