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
    <div class="actions">
      <v-btn @click="onClickSelectAll">{{ 'TL_SELECT_ALL_ITEMS'|translate }}</v-btn>
      <v-btn :disabled="multiselectItems.length === 0" @click="onClickDeselectAll">{{ 'TL_DESELECT_ALL_ITEMS'|translate }}</v-btn>
    </div>
    <div class="buttons">
      <v-btn class="back" @click="onClickCancel">{{ 'TL_CANCEL'|translate }}</v-btn>
      <v-btn class="delete right" :disabled="isEmpty(multiselectItems)" @click="onClickDelete">{{ 'TL_DELETE'|translate }}</v-btn>
    </div>
    <!-- <button :disabled="isEmpty(multiselectItems)" @click="onClickClone">Clone</button> -->
  </div>
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
.multiselect-page {
    margin: 0px;
    display: block;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    flex: 1 1 0;
}
h3 {
  margin-top: 0;
}
button {
  cursor: pointer;
  padding: 5px 12px;
  margin: 5px;
  line-height: 28px;
  box-sizing: border-box;
  background: #f0f0f0;
  text-decoration: none;
  color: #999;
  border-width: 0px;
  display: inline;
  &:disabled {
    opacity: 0.5;
  }
  i:before {
    color: grey;
  }
}
.buttons {
  padding: 18px 15px 19px 15px;
  position: absolute;
  left: 0;
  right: 0;
  box-sizing: border-box;
  width: 100%;
  border-top: 1px solid #f0f0f0;
  bottom: 0px;
  background-color: white;
  transition-duration: 0s;
  z-index: 1000;
  .right {
    float: right;
  }
}
ul {
  list-style-type: circle;
  li {
    margin-left: 20px;
    padding-left: 10px;
    list-style: circle;
  }
}
</style>
