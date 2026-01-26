<template>
  <div class="preview-multiple">
    <draggable
      :key="`${schema.model}-${key}`"
      :list="attachments" :group="`${schema.model}-${key}`" :item-key="getKey"
      draggable=".preview-attachment" handle=".row-handle" ghost-class="ghost"
      v-bind="dragOptions" :class="{disabled}" class="preview-multiple" @end="onEndDrag"
    >
      <preview-attachment
        v-for="(a, i) in attachments"
        :key="i" :schema="schema"
        :theme="theme" :attachment="a" :image-size="imageSize" :get-image-src="getImageSrc"
        :remove-image="removeImage" :is-image="isImage" :index="i" :on-cropper-change="onCropperChange"
      />
    </draggable>
  </div>
</template>

<script>
import PreviewAttachment from '@c/PreviewAttachment'
import DragList from '@m/DragList'

export default {
  components: { PreviewAttachment },
  mixins: [DragList],
  props: {
    attachments: { type: Array, default: () => [] },
    schema: { type: Object, default: () => {} },
    theme: { type: String, default: 'light' },
    isImage: { type: Function, default: () => {} },
    getImageSrc: { type: Function, default: () => {} },
    disabled: { type: Boolean, default: false },
    onEndDrag: { type: Function, default: () => {} },
    imageSize: { type: Function, default: () => {} },
    removeImage: { type: Function, default: () => {} },
    onCropperChange: { type: Function, default: () => {} },
  },
}
</script>
