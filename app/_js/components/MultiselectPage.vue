<template>
  <div class="multiselect-page">
    <button class="close-button" @click="onClickCancel">X</button>
    <div>
      <button @click="onClickSelectAll">Select all items</button>
      <button @click="onClickDeselectAll">Deselect all items</button>
    </div>
    You have selected {{ size(multiselectItems) }} items:
    <br>
    <ul>
      <li v-for="item in multiselectItems" :key="item._id">
        {{ getName(item) }}
        ({{ item._id }})
      </li>
    </ul>
    <hr>
    <button :disabled="isEmpty(multiselectItems)" @click="onClickDelete">Delete</button>
  </div>
</template>

<script>
import pAll from 'p-all'
import axios from 'axios'
import _ from 'lodash'
import RecordNameHelper from './RecordNameHelper'
import AbstractEditorView from './AbstractEditorView'
import TranslateService from '../services/TranslateService'

export default {
  mixins: [RecordNameHelper, AbstractEditorView],
  props: [
    'resource',
    'locale',
    'multiselectItems',
    'recordList'
  ],
  data () {
    return {
      size: _.size,
      isEmpty: _.isEmpty
    }
  },
  methods: {
    onClickCancel () {
      this.$emit('cancel')
    },
    onClickSelectAll () {
      this.$emit('changeMultiselectItems', this.recordList)
    },
    onClickDeselectAll () {
      this.$emit('changeMultiselectItems', [])
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
              this.$notify({
                group: 'notification',
                text: TranslateService.get('TL_RECORD_DELETED', null, { id: item._id })
              })
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
  }
}
</script>
