<template>
  <div class="file-input-errors">
    <template v-if="isForMultipleImages()">
      <div class="help-block">
        <v-icon size="small" icon="$information" />
        <span v-if="getMaxCount() !== -1 ">{{ maxCountMsg }}</span>
        <span v-else>{{ unlimitedMsg }}</span>
      </div>
    </template>
    <div v-if="schema.options && schema.options.hint" class="help-block">
      <v-icon size="small" icon="$information" />
      <span>{{ $filters.translate(schema.options.hint) }}</span>
    </div>
    <div v-if="hasSizeOptions" class="help-block">
      <v-icon size="small" icon="$information" />
      <span>{{ $filters.translate('TL_THIS_FIELD_REQUIRES_THE_FOLLOWING_SIZE') }}:{{ schema.width }}x{{ schema.height }}</span>
    </div>
    <div v-if="(schema.limit)" class="help-block">
      <v-icon size="small" icon="$information" />
      <span>{{ $filters.translate('TL_THIS_FIELD_REQUIRES_A_FILE_SIZE') }}: {{ getFileSizeLimit(schema.limit) }}</span>
    </div>
    <div v-if="(schema.accept)" class="help-block">
      <v-icon size="small" icon="$information" />
      <span>{{ $filters.translate('TL_THIS_FIELD_REQUIRES') }}: {{ schema.accept }}</span>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import TranslateService from '@s/TranslateService'

export default {
  props: {
    fileType: { type: String, default: 'image' },
    schema: { type: Object, default: () => {} },
    isForMultipleImages: { type: Function, default: () => {} },
    getMaxCount: { type: Function, default: () => {} },
  },
  computed: {
    hasSizeOptions() {
      return _.get(this.schema, 'options.width', false) && _.get(this.schema, 'options.height', false)
    },
    maxCountMsg() {
      return TranslateService.get(`TL_MAX_NUMBER_OF_${_.toUpper(this.fileType)}S`, { num: this.getMaxCount() })
    },
    unlimitedMsg() {
      return TranslateService.get(`TL_UNLIMITED_NUMBER_OF_${_.toUpper(this.fileType)}S`)
    },
  },
  methods: {
    getFileSizeLimit(limit) {
      const kbLimit = limit / 1024
      return kbLimit > 1000 ? `${kbLimit / 1000} MB` : `${kbLimit} KB`
    },
  },
}
</script>
