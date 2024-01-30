<template>
  <img v-if="getSrc()" class="vue-table-generator-field image" :src="getSrc()">
  <span v-else>{{ $filters.translate('TL_NO_IMAGE') }}</span>
</template>

<script>
import _ from 'lodash'
export default {
  props: [
    'row',
    'column',
    'rowIndex',
    'field'
  ],
  methods: {
    getSrc () {
      const url = _.get(this.findAttachmentForField(this.row, this.field), 'url', false)
      return url ? url + '?resize=autox50' : false
    },
    findAttachmentForField (item, field) {
      return _.find(_.get(item, '_attachments', []), (attachment) => {
        if (field.localised) {
          return _.get(attachment, '_fields.locale', false) === field.locale && attachment._name === field.originalModel
        }
        return attachment._name === field.originalModel
      })
    }
  }
}
</script>

<style lang="scss" scoped>
span {
  font-style: italic;
  font-size: 8px;
}
.image {
  border-radius: 4px;
  max-width: 100%;
}
</style>
