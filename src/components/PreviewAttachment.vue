<template>
  <v-card :key="getKey(attachment)" :theme="theme" elevation="0" class="preview-attachment" :class="{odd: index % 2 !== 0, 'can-crop': schema.crop}">
    <v-tooltip :theme="theme" location="right" eager>
      <template #activator="{ props }">
        <v-chip variant="outlined" class="filename" :class="{'is-dirty': attachment.dirty}" closable close-icon="$closeCircleOutline" v-bind="props" @click:close="removeImage(attachment, index)" @contextmenu.stop.prevent="copyFilenameToClipboard()">#{{ index + 1 }} - {{ $filters.truncate(getAttachmentFilename(attachment),10) }} ({{ imageSize(attachment) }})</v-chip>
      </template>
      <span>{{ attachment._filename }} <template v-if="attachment.dirty">({{ $filters.translate(getDirtyReason()) }})</template></span>
    </v-tooltip>
    <show-attachment
      class-name="row-handle"
      :theme="theme" :attachment="attachment" :image-size="imageSize" :get-image-src="getImageSrc"
      :remove-image="removeImage" :is-image="isImage" :schema="schema" :on-cropper-change="onCropperChangeForAttachment"
    />
  </v-card>
</template>

<script>
import _ from 'lodash'
import ShowAttachment from '@c/ShowAttachment.vue'
import Notification from '@m/Notification'

export default {
  components: { ShowAttachment },
  mixins: [Notification],
  props: {
    index: { type: Number, default: 0 },
    theme: { type: String, default: 'light' },
    attachment: { type: Object, default: () => ({}) },
    schema: { type: Object, default: () => ({}) },
    getImageSrc: { type: Function, default: () => {} },
    imageSize: { type: Function, default: () => {} },
    removeImage: { type: Function, default: () => {} },
    isImage: { type: Function, default: () => {} },
    onCropperChange: { type: Function, default: () => {} },
  },
  methods: {
    getDirtyReason() {
      const key = _.get(this.attachment, 'dirty', false)
        ? `${_.replace(_.toUpper(this.attachment.dirty), /-/g, '_')}`
        : 'DIRTY'
      return `TL_${key}`
    },
    copyFilenameToClipboard() {
      navigator.clipboard.writeText(this.getAttachmentFilename(this.attachment))
      this.notify('Filename has been copied.')
    },
    getAttachmentFilename(attachment) {
      return _.get(attachment, '_filename', _.get(attachment, '_fields._filename', ''))
    },
    getKey(elem) {
      return `${_.get(elem, '_filename', '')}-${_.get(elem, '_id', _.get(elem, '_createdAt', this.index))}`
    },
    onCropperChangeForAttachment(data) {
      this.onCropperChange(this.index, _.pick(data, ['coordinates']))
    },
  },
}
</script>

<style lang="scss">
.field-wrapper{
  .v-card .v-chip {
    &:hover {
      background: rgba(0,0,0,.05);
      cursor: copy;
    }
  }
}
</style>
