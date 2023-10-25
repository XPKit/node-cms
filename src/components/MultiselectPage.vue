<template>
  <v-card elevation="0" class="multiselect-page">
    <div class="top-bar">
      <h3>{{ 'TL_NUMBER_OF_SELECTED_RECORDS' | translate(null, { num: size(multiselectItems) }) }}</h3>
      <div class="buttons">
        <v-btn elevation="0" class="delete" rounded :disabled="isEmpty(multiselectItems)" @click="onClickDelete">{{ 'TL_DELETE'|translate }}</v-btn>
      </div>
    </div>
    <div class="scroll-wrapper" :class="{'scrolled-to-bottom': scrolledToBottom}" @scroll="onScroll">
      <div class="selected-records-list">
        <div v-for="item in multiselectItems" :key="item._id" class="selected-record">
          <v-chip outlined c small :ripple="false">
            <v-avatar left>
              <v-icon small @click="deselectItem(item)">mdi-close-circle-outline</v-icon>
            </v-avatar>
            {{ getName(item) | truncate(15) }} ({{ item._id }})
          </v-chip>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script>
import pAll from 'p-all'
import axios from 'axios'
import _ from 'lodash'
import RecordNameHelper from './RecordNameHelper'
import AbstractEditorView from './AbstractEditorView'
import TranslateService from '@s/TranslateService'
import Notification from '@m/Notification'

export default {
  mixins: [RecordNameHelper, AbstractEditorView, Notification],
  props: {
    resource: {
      type: Object,
      default: () => {}
    },
    locale: {
      type: String,
      default: 'enUS'
    },
    multiselectItems: {
      type: Array,
      default: () => []
    },
    recordList: {
      type: Array,
      default: () => []
    }
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
      this.$emit('changeMultiselectItems', _.filter(this.multiselectItems, (i) => i._id !== item._id))
    },
    onClickCancel () {
      this.$emit('cancel')
    },
    async onClickDelete () {
      if (!window.confirm(
        TranslateService.get('TL_ARE_YOU_SURE_TO_DELETE_RECORDS', null, {num: _.size(this.multiselectItems)}),
        TranslateService.get('TL_YES'),
        TranslateService.get('TL_NO')
      )) {
        return
      }
      this.$loading.start('onDeleteMultiselectedItems')
      try {
        await pAll(_.map(this.multiselectItems, item => {
          return async () => {
            try {
              await axios.delete(`../api/${this.resource.title}/${item._id}`)
              this.notify(TranslateService.get('TL_RECORD_DELETED', null, { id: item._id }))
            } catch (error) {
              console.error(error)
              this.manageError(error, 'delete', item)
            }
          }
        }), {concurrency: 1})
      } catch (error) {
        console.error(error)
      }
      this.multiselect = false
      this.$loading.stop('onDeleteMultiselectedItems')
      this.$emit('updateRecordList', null)
      this.$emit('cancel')
    }
    // async onClickClone () {
    //   if (!window.confirm(
    //     TranslateService.get('TL_ARE_YOU_SURE_TO_CLONE_RECORDS', null, {num: _.size(this.multiselectItems)}),
    //     TranslateService.get('TL_YES'),
    //     TranslateService.get('TL_NO')
    //   )) {
    //     return
    //   }

    //   this.$loading.start('onCloneMultiselectedItems')
    //   try {
    //     await pAll(_.map(this.multiselectItems, item => {
    //       return async () => {
    //         try {
    //           const {data} = await axios.post(`../api/${this.resource.title}`, item)
    //           this.notify(TranslateService.get('TL_RECORD_CREATED', null, { id: data._id })
    //         } catch (error) {
    //           console.error(error)
    //           this.manageError(error, 'create')
    //         }
    //       }
    //     }), {concurrency: 1})
    //   } catch (error) {
    //     console.error(error)
    //   }
    //   this.multiselect = false
    //   this.$loading.stop('onCloneMultiselectedItems')

    //   this.$emit('updateRecordList', null)
    //   this.$emit('cancel')
    // }
  }
}
</script>
<style scoped lang="scss">
@import '@a/scss/variables.scss';
h3 {
  margin-top: 0;
}
.selected-records-list {
  display: flex;
  width: 100%;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-top: 16px;
  .selected-record {
    flex-basis: 50%;
    margin-bottom: 8px;
  }
  .v-chip {
    padding-left: 0;
    @include subtext;
    .v-avatar {
      button {
        font-size: 20px !important;
        margin-left: 8px;
      }
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
