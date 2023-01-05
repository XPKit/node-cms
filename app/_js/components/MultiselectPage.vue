<template>
  <div class="multiselect-page">
    <h3>{{ 'TL_YOU_HAVE_SELECTED_NUM_ITEMS' | translate(null, { num: size(multiselectItems) }) }}</h3>
    <ul>
      <li v-for="item in multiselectItems" :key="item._id">
        {{ getName(item) }}
        ({{ item._id }})
      </li>
    </ul>
    <br>
    <div>
      <button @click="onClickSelectAll">{{ 'TL_SELECT_ALL_ITEMS'|translate }}</button>
      <button @click="onClickDeselectAll">{{ 'TL_DESELECT_ALL_ITEMS'|translate }}</button>
    </div>
    <hr>
    <button @click="onClickCancel">{{ 'TL_CANCEL'|translate }}</button>
    <button :disabled="isEmpty(multiselectItems)" @click="onClickDelete">{{ 'TL_DELETE'|translate }}</button>
    <!-- <button :disabled="isEmpty(multiselectItems)" @click="onClickClone">Clone</button> -->
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
    //           this.$notify({
    //             group: 'notification',
    //             text: TranslateService.get('TL_RECORD_CREATED', null, { id: data._id })
    //           })
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
ul {
  list-style-type: circle;
  li {
    margin-left: 20px;
    padding-left: 10px;
    list-style: circle;
  }
}
</style>
