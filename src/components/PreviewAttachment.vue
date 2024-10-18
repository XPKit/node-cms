<template>
  <v-card :key="getKey(attachment)" :theme="theme" elevation="0" class="preview-attachment" :class="{odd: index % 2 !== 0}">
    <v-tooltip :theme="theme" location="right" eager>
      <template #activator="{ props }">
        <v-chip variant="outlined" class="filename" :class="{'is-dirty': attachment.dirty}" closable close-icon="mdi-close-circle-outline" v-bind="props" @click:close="removeImage(attachment, index)" @contextmenu.stop.prevent="copyFilenameToClipboard()">#{{ index + 1 }} - {{ $filters.truncate(getAttachmentFilename(attachment),10) }} ({{ imageSize(attachment) }})</v-chip>
      </template>
      <span>{{ attachment._filename }} <template v-if="attachment.dirty">({{ $filters.translate('TL_DIRTY') }})</template></span>
    </v-tooltip>
    <div v-if="canDrag" class="row-handle">
      <div v-if="isImage(attachment)" class="image-wrapper">
        <v-img v-if="attachment._id" cover :src="getImageSrc(attachment)" class="clickable" @click="viewFile(attachment)" />
        <v-img v-else cover :src="getImageSrc(attachment)" />
      </div>
      <v-btn v-else-if="attachment._id" :theme="theme" size="small" rounded elevation="0" @click="viewFile(attachment)">{{ $filters.translate('TL_VIEW') }}</v-btn>
    </div>
    <div v-else class="image-wrapper">
      <div v-if="isImage(attachment)" class="image-wrapper">
        <v-img v-if="attachment._id" cover :src="getImageSrc(attachment)" class="clickable" @click="viewFile(attachment)" />
        <v-img v-else cover :src="getImageSrc(attachment)" />
      </div>
      <v-btn v-else-if="attachment._id" :theme="theme" size="small" rounded elevation="0" @click="viewFile(attachment)">{{ $filters.translate('TL_VIEW') }}</v-btn>
    </div>
  </v-card>
</template>

<script>
import _ from 'lodash'

export default {
  props: {
    canDrag: {
      type: Boolean,
      default: false
    },
    index: {
      type: Number,
      default: 0
    },
    theme: {
      type: String,
      default: 'light'
    },
    attachment: {
      type: Object,
      default: () => {}
    },
    getImageSrc: {
      type: Function,
      default: ()=> {}
    },
    imageSize: {
      type: Function,
      default: ()=> {}
    },
    removeImage: {
      type: Function,
      default: ()=> {}
    },
    isImage: {
      type: Function,
      default: ()=> {}
    }
  },
  data () {
    return {
    }
  },
  methods: {
    copyFilenameToClipboard () {
      navigator.clipboard.writeText(this.getAttachmentFilename(this.attachment))
    },
    getAttachmentFilename(attachment) {
      return attachment._filename || (attachment._fields && attachment._fields._filename)
    },
    viewFile (attachment = false) {
      var a = attachment || this.attachment()
      if (!a) {
        return
      }
      const filenameComponents = _.get(a, '_filename', '').split('.')
      const suffix = filenameComponents.length > 1 ? `.${_.last(filenameComponents)}` : ''
      const win = window.open(window.origin + a.url + suffix, '_blank')
      win.focus()
    },
    getKey (elem) {
      return `${elem._filename}-${Math.random()}`
    }
  }
}
</script>
