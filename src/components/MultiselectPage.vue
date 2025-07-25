<template>
  <v-card elevation="0" class="multiselect-page">
    <div class="top-bar">
      <h3>{{ $filters.translate('TL_NUMBER_OF_SELECTED_RECORDS', { num: size(multiselectItems) }) }}</h3>
      <div class="buttons">
        <v-btn elevation="0" class="delete" rounded :disabled="isEmpty(multiselectItems)" @click="onClickDelete">{{ $filters.translate('TL_DELETE') }}</v-btn>
      </div>
    </div>
    <div class="scroll-wrapper" :class="{'scrolled-to-bottom': scrolledToBottom}" @scroll="onScroll">
      <div class="selected-records-list">
        <div v-for="item in multiselectItems" :key="item._id" class="selected-record">
          <v-chip variant="outlined" :ripple="false">
            <v-avatar start>
              <v-icon size="small" @click="deselectItem(item)">mdi-close-circle-outline</v-icon>
            </v-avatar>
            {{ $filters.translate(getName(item)) }} ({{ item._id }})
          </v-chip>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script>
import pAll from 'p-all'
import _ from 'lodash'
import RecordNameHelper from '@c/RecordNameHelper'
import AbstractEditorView from '@c/AbstractEditorView'
import TranslateService from '@s/TranslateService'
import Notification from '@m/Notification'
import RequestService from '@s/RequestService'

export default {
  mixins: [RecordNameHelper, AbstractEditorView, Notification],
  props: {
    resource: { type: Object, default: () => {} },
    locale: { type: String, default: 'enUS' },
    multiselectItems: { type: Array, default: () => [] },
    recordList: { type: Array, default: () => [] }
  },
  data () {
    return {
      scrolledToBottom: false,
      size: _.size,
      isEmpty: _.isEmpty
    }
  },
  methods: {
    onScroll ({ target: { scrollTop, clientHeight, scrollHeight } }) {
      this.scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 50
    },
    deselectItem (item) {
      this.$emit('changeMultiselectItems', _.filter(this.multiselectItems, i => i._id !== item._id))
    },
    onClickCancel () { this.$emit('cancel') },
    async onClickDelete () {
      if (!window.confirm(
        TranslateService.get('TL_ARE_YOU_SURE_TO_DELETE_RECORDS', { num: _.size(this.multiselectItems) }),
        TranslateService.get('TL_YES'),
        TranslateService.get('TL_NO')
      )) { return }
      this.$loading.start('onDeleteMultiselectedItems')
      try {
        await pAll(_.map(this.multiselectItems, item => async () => {
          try {
            await RequestService.delete(`../api/${this.resource.title}/${item._id}`)
            this.notify(TranslateService.get('TL_RECORD_DELETED', { id: item._id }))
          } catch (error) {
            // Always log errors per instructions
            console.error('Failed to delete record:', error)
            this.manageError(error, 'delete', item)
          }
        }), { concurrency: 1 })
      } catch (error) {
        // Always log errors per instructions
        console.error('Failed to delete multiselected items:', error)
      }
      this.multiselect = false
      this.$loading.stop('onDeleteMultiselectedItems')
      this.$emit('updateRecordList', null)
      this.$emit('cancel')
    }
  }
}
</script>
<style scoped lang="scss">
@use '@a/scss/variables.scss' as *;
@use '@a/scss/mixins.scss' as *;
h3 {
  margin-top: 0;
}
.selected-records-list {
  display: flex;
  width: 100%;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  padding: 16px 8px;
  .selected-record {
    flex-basis: calc(50% - 4px);
  }
  .v-chip {
    @include subtext;
    .v-avatar {
      font-size: 20px;
    }
  }
}
.buttons {
  .delete {
    color: $multiselect-delete-button-color !important;
    background-color: $multiselect-delete-button-background !important;
    @include cta-text;
  }
}
</style>
