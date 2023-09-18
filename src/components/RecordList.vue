<template>
  <div v-if="maxCount != 1" class="record-list">
    <div class="top-bar">
      <v-menu v-if="selectedResourceGroup && groupedList" v-model="menuOpened" auto content-class="resources-menu sidebar" offset-y :close-on-content-click="true">
        <template #activator="{ on, attrs }">
          <div class="resource-selector" v-bind="attrs" :class="{opened: menuOpened}" v-on="on">
            <div class="resource-title">{{ getResourceTitle(resource) }}</div>
            <v-icon large>mdi-chevron-down</v-icon>
          </div>
        </template>
        <v-list rounded>
          <v-list-item
            v-for="r in selectedResourceGroup.list"
            :key="r.name"
            dense
            :class="{selected: r === resource}"
            @click="selectResourceCallback(r)"
          >
            <v-list-item-title>{{ getResourceTitle(r) }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <div
        v-shortkey="{esc: ['esc'], open: ['/']}" class="search"
        :class="{'is-query': sift.isQuery, 'is-valid': sift.isQuery && sift.isValid == true, 'is-invalid': sift.isQuery && sift.isValid == false}" @shortkey="interactiveSearch"
      >
        <v-text-field
          ref="search" v-model="search"
          prepend-inner-icon="mdi-magnify" class="search-bar" flat filled rounded hide-details dense :placeholder="'TL_SEARCH' | translate" type="text"
          name="search"
        />
        <!-- <div class="multiselect" :class="{active: multiselect}" @click="onClickMultiselect"><v-icon color="black">mdi-list-box</v-icon></div> -->
      </div>
    </div>
    <div v-if="hasEditableRecords()" class="records-top-bar">
      <v-btn rounded dense text class="select-all" @click="selectAll">{{ (allRecordsSelected() ? 'TL_DESELECT_ALL' : 'TL_SELECT_ALL') | translate }}</v-btn>
      <v-btn v-if="localMultiselectItems.length > 0" class="delete-records" dense rounded text @click="deleteSelectedRecords()">
        <v-icon>mdi-trash-can</v-icon>
        <span>{{ 'TL_DELETE' | translate }}</span>
      </v-btn>
    </div>
    <div v-shortkey="multiselect ? ['ctrl', 'a'] : false" class="records" @shortkey="selectAll()">
      <RecycleScroller v-slot="{ item }" class="list" :items="filteredList" :item-size="72" key-field="_id">
        <div
          class="item"
          :class="{selected: item === selectedItem, frozen:!item._local}"
        >
          <div class="checkbox" @click.exact="select(item, true)" @click.shift="selectTo(item)">
            <template v-if="item._local">
              <v-icon :class="{displayed: isItemSelected(item)}">mdi-check-bold</v-icon>
            </template>
          </div>
          <div class="item-info" @click.exact="select(item)">
            <div v-if="item" class="main">{{ getName(item) }}</div>
            <div class="meta">
              <div class="id">{{ item._id }}</div>
              <div class="ts">
                <template v-if="item._updatedBy"> {{ 'TL_UPDATED_BY' | translate }} {{ item._updatedBy }}</template><template v-else> {{ 'TL_UPDATED' | translate }}</template> <timeago :since="item._updatedAt" :locale="TranslateService.locale" />
              </div>
            </div>
          </div>
        </div>
      </RecycleScroller>
    </div>
    <v-btn v-if="maxCount <= 0 || listCount < maxCount" rounded class="new-record" @click="onClickNew">{{ 'TL_ADD_NEW_RECORD' | translate }}</v-btn>
  </div>
</template>

<script>
import pAll from 'p-all'
import axios from 'axios'
import _ from 'lodash'
import TranslateService from '@s/TranslateService'
import Notification from '@m/Notification'
import RecordNameHelper from './RecordNameHelper'
import qs from 'qs'
import sift from 'sift'
import JSON5 from 'json5'

export default {
  mixins: [Notification, RecordNameHelper],
  props: {
    list: {
      type: [Array, Boolean],
      default: () => []
    },
    resource: {
      type: [Object, Boolean],
      default: () => {}
    },
    groupedList: {
      type: [Array, Boolean],
      default: () => []
    },
    resourceGroup: {
      type: [Object, Boolean],
      default: () => {}
    },
    selectedItem: {
      type: Object,
      default: () => {}
    },
    selectResourceCallback: {
      type: Function,
      default: () => {}
    },
    updateRecordList: {
      type: Function,
      default: () => {}
    },
    locale: {
      type: String,
      default: 'enUS'
    },
    multiselect: {
      type: Boolean,
      default: false
    },
    multiselectItems: {
      type: [Array, Boolean],
      default: () => []
    }
  },
  data () {
    return {
      menuOpened: false,
      search: null,
      TranslateService,
      sift: {
        isQuery: false,
        isValid: false
      },
      query: {},
      localMultiselectItems: []
    }
  },
  computed: {
    selectedResourceGroup () {
      return _.find(this.groupedList, (resourceGroup) => this.groupSelected(resourceGroup))
    },
    maxCount () {
      return _.get(this.resource, 'maxCount', 0)
    },
    listCount () {
      return _.get(this.list, 'length', 0)
    },
    filteredList () {
      let fields = this.getSearchableFields()
      if (fields.length === 0) {
        fields = [_.first(this.resource.schema)]
      }
      _.forEach(this.list, item => item._searchable = { id: false, keyFields: false, query: false })
      if (this.sift.isQuery) {
        return _.forEach(this.list.filter(sift(this.query)), item => item._searchable.query = true)
      }
      return _.filter(this.list, (item) => {
        if (_.isEmpty(this.search)) {
          return true
        }
        const values = []
        _.forEach(fields, (field) => {
          values.push(this.getValue(item, field, this.resource.displayItem))
        })
        let qItems = 0
        let qValues = 0
        for (const queryKey in this.query) {
          const queryValue = this.query[queryKey]
          qItems = qItems + 1
          let value = _.get(item, queryKey)
          if (_.isUndefined(value) === false) {
            if (_.isArray(value)) {
              if (_.includes(value, queryValue)) {
                qValues = qValues + 1
              }
            } else {
              if (value === queryValue) {
                qValues = qValues + 1
              }
            }
          }
        }
        let found = false
        if (qItems > 0 && qItems === qValues) {
          found = true
          item._searchable.query = true
        } else if (this.doesMatch(this.search, values)) {
          found = true
          item._searchable.keyFields = true
        } else if (new RegExp(this.search, 'i').test(item._id)) {
          found = true
          item._searchable.id = true
        }
        return found
      })
    }
  },
  watch: {
    search () {
      this.query = this.flatten(qs.parse(this.search))
      this.sift.isQuery = false
      try {
        if (this.search.search('sift:') === 0) {
          this.sift.isQuery = true
          this.query = JSON5.parse(this.search.substr(5))
          this.sift.isValid = true
        }
      } catch (error) {
        this.sift.isValid = false
        this.query = {}
      }
    },
    multiselectItems () {
      this.localMultiselectItems = _.cloneDeep(this.multiselectItems)
    }
  },
  methods: {
    hasEditableRecords () {
      return _.get(_.filter(this.filteredList, (item) => _.get(item, '_local', false)), 'length', 0) !== 0
    },
    allRecordsSelected () {
      return _.get(this.localMultiselectItems, 'length', 0) === _.get(this.list, 'length', 0)
    },
    isItemSelected (item) {
      return item === this.selectedItem || _.includes(_.map(this.localMultiselectItems, '_id'), item._id)
    },
    getTypePrefix (type) {
      let typePrefix = 'TL_ERROR_ON_RECORD_'
      if (type === 'create') {
        typePrefix += 'CREATION'
      } else if (type === 'update') {
        typePrefix += 'UPDATE'
      } else if (type === 'delete') {
        typePrefix += 'DELETE'
      }
      return typePrefix ? TranslateService.get(typePrefix) : 'Error'
    },
    manageError (error, type, record) {
      let typePrefix = this.getTypePrefix(type)
      let errorMessage = typePrefix
      if (_.get(error, 'response.data.code', 500) === 400) {
        const serverError = _.get(error, 'response.data')
        if (_.get(serverError, 'message', false)) {
          errorMessage = `${typePrefix}: ${serverError.message}`
        } else {
          errorMessage = `${typePrefix}: ${TranslateService.get('TL_UNKNOWN_ERROR')}`
        }
      }
      console.error(errorMessage, record)
      this.notify(errorMessage, 'error')
    },
    async deleteSelectedRecords () {
      if (!window.confirm(
        TranslateService.get('TL_ARE_YOU_SURE_TO_DELETE_RECORDS', null, {num: _.size(this.localMultiselectItems)}),
        TranslateService.get('TL_YES'),
        TranslateService.get('TL_NO')
      )) {
        return
      }
      this.$loading.start('onDeleteMultiselectedItems')
      try {
        await pAll(_.map(this.localMultiselectItems, item => {
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
      this.$loading.stop('onDeleteMultiselectedItems')
      this.$emit('updateRecordList', null)
      this.$emit('cancel')
    },
    groupSelected (resourceGroup) {
      if (!this.resource) {
        return false
      }
      const selectedItemGroup = _.get(this.resource, 'group.enUS', _.get(this.resource, 'group', false))
      const groupName = _.get(resourceGroup, 'name.enUS', resourceGroup.name)
      if (groupName === 'TL_OTHERS' && !selectedItemGroup) {
        return true
      }
      return groupName === selectedItemGroup
    },
    getResourceTitle (resource) {
      if (!resource) {
        return ''
      }
      return resource.displayname ? TranslateService.get(resource.displayname) : resource.title
    },
    selectAll () {
      if (this.localMultiselectItems.length === this.filteredList.length) {
        this.localMultiselectItems = []
      } else {
        this.localMultiselectItems = this.filteredList
      }
      this.$emit('changeMultiselectItems', this.localMultiselectItems)
    },
    dive (currentKey, into, target) {
      for (let i in into) {
        if (i in into) {
          let newKey = i
          let newVal = into[i]
          if (currentKey.length > 0) {
            newKey = currentKey + '.' + i
          }
          if (typeof newVal === 'object') {
            this.dive(newKey, newVal, target)
          } else {
            target[newKey] = newVal
          }
        }
      }
    },
    flatten (arr) {
      let newObj = {}
      this.dive('', arr, newObj)
      return newObj
    },
    async interactiveSearch (event) {
      const action = _.get(event, 'srcKey', false)
      const elem = _.get(this.$refs, '[\'search\']', false)
      if (!action || !elem) {
        return
      }
      return action === 'esc' ? elem.blur() : elem.focus()
    },
    select (item, clickedCheckbox = false) {
      if (!item._local) {
        return this.$emit('selectItem', item)
      }
      if (!clickedCheckbox) {
        this.localMultiselectItems = [item]
        this.$emit('selectItem', item)
      } else {
        if (this.isItemSelected(item)) {
          this.localMultiselectItems = _.filter(this.localMultiselectItems, (i) => i._id !== item._id)
        } else {
          this.localMultiselectItems.push(item)
        }
      }
      this.$emit('changeMultiselectItems', this.localMultiselectItems)
    },
    selectTo (item) {
      const start = _.first(this.localMultiselectItems)
      let found = false
      for (const iterator of this.filteredList) {
        if (iterator === start) {
          this.localMultiselectItems = [iterator]
        }
        if (found === true) {
          this.localMultiselectItems.push(iterator)
        }
        if (iterator === start) {
          found = true
        }
        if (iterator === item) {
          found = false
        }
      }
      this.$emit('changeMultiselectItems', this.localMultiselectItems)
    },
    onClickNew () {
      this.localMultiselectItems = []
      this.$emit('changeMultiselectItems', this.localMultiselectItems)
      this.$emit('selectMultiselect', false)
      this.$emit('selectItem', { _local: true })
    },
    getSearchableFields () {
      return _.filter(this.resource.schema, item => item.searchable === true)
    },
    doesMatch (search, values) {
      return _.find(values, (value) => !!new RegExp(this.search, 'i').test(value))
    }
  }
}
</script>
<style lang="scss" scoped>

</style>

<style lang="scss">
@import '@a/scss/variables.scss';
.record-list {
  .search-bar {
    margin: 16px;
    .v-input__slot {
      padding: 8px;
      @include cta-text;
      display: flex;
      align-items: center;
      align-content: center;
      justify-content: flex-start;
      min-height: auto !important;
    }
    .v-input__prepend-inner, .v-input__icon, .v-icon{
      width: 18px !important;
      height: 18px !important;
      min-width: 18px !important;
      margin-top: 0 !important;
      font-size: 18px;
    }
    .v-icon {
      color: $sidebar-search-icon-color;
    }
    input {
      height: 18px !important;
      padding: 0 !important;
      margin-left: 8px;
    }
  }
  .vue-recycle-scroller__item-wrapper {
    top: 8px;
  }
  .delete-records, .select-all {
    padding: 0 !important;
    @include cta-text;
    text-transform: none;
    letter-spacing: normal;
    .v-icon, .btn__content {
      color: $sidebar-records-list-delete-icon-color;
    }
  }
}
</style>
