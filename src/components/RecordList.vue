<template>
  <div v-if="maxCount != 1" class="record-list">
    <div class="record-list-top-bar">
      <v-menu v-if="selectedResourceGroup && groupedList" v-model="menuOpened" content-class="resources-menu sidebar" location="bottom" :close-on-content-click="true">
        <template #activator="{ props }">
          <div class="resource-selector" :class="{opened: menuOpened}" v-bind="props">
            <div class="resource-title">{{ getResourceTitle(resource) }}</div>
            <v-icon size="large">mdi-chevron-down</v-icon>
          </div>
        </template>
        <v-list rounded>
          <v-list-item
            v-for="r in selectedResourceGroup.list" :key="r.name" density="compact" :class="{selected: r === resource}"
            @click="r !== resource ? selectResourceCallback(r) : ''"
          >
            <v-list-item-title>{{ getResourceTitle(r) }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <div
        v-shortkey="getShortcuts()" class="search"
        :class="{'is-query': sift.isQuery, 'is-valid': sift.isQuery && sift.isValid == true, 'is-invalid': sift.isQuery && sift.isValid == false}" @shortkey="interactiveSearch"
      >
        <v-text-field
          ref="search" v-model="search" prepend-inner-icon="mdi-magnify" class="search-bar" flat variant="solo-filled" rounded hide-details density="compact"
          :placeholder="$filters.translate('TL_SEARCH')" type="text" name="search"
        />
        <v-btn v-if="maxCount <= 0 || listCount < maxCount" elevation="0" icon class="new-record" :class="{active: isCreatingNewRecord()}" @click="onClickNew">
          <!-- <v-icon v-if="selectedItem && !multiselect">mdi-note-edit-outline</v-icon> -->
          <v-icon>mdi-note-plus-outline</v-icon>
        </v-btn>
      </div>
    </div>
    <div v-if="hasEditableRecords()" class="records-top-bar">
      <div class="toggle-view-mode" @click="toggleViewMode()">
        <v-icon :class="{selected: !multiselect}">mdi-note-edit-outline</v-icon>
        <v-icon :class="{selected: multiselect}">mdi-format-list-checks</v-icon>
      </div>
      <div v-if="multiselect" class="multiselect-buttons">
        <span :class="{disabled: allRecordsSelected()}" @click="onClickSelectAll">{{ $filters.translate('TL_SELECT_ALL') }}</span>
        <span :class="{disabled: multiselectItems.length === 0}" @click="onClickDeselectAll">{{ $filters.translate('TL_DESELECT_ALL') }}</span>
      </div>
      <div v-else class="sort-records">
        <v-select
          :model-value="sortMode" :items="sortOptions"
          :ripple="false"
          menu-icon="mdi-chevron-down" flat
          rounded density="compact" hide-details variant="solo-filled" @update:model-value="onChangeSort"
        />
      </div>
    </div>
    <div v-shortkey="multiselect ? ['ctrl', 'a'] : false" class="records" @shortkey="selectAll()">
      <RecycleScroller v-slot="{ item }" class="list" :items="filteredList || []" :item-size="60" key-field="_id">
        <div
          class="item" :class="{selected: isItemSelected(item), frozen:!item._local}"
          @click.exact="select($event, item)" @click.shift="selectTo(item)" @click.ctrl="selectTo(item, true)"
        >
          <div class="item-info">
            <div v-if="multiselect" class="checkbox" @click.exact="select($event, item, true)">
              <v-icon v-if="item._local" :class="{displayed: isItemSelected(item)}" size="small">mdi-check-bold</v-icon>
            </div>
            <div class="infos-wrapper">
              <div v-if="item" class="main">
                <v-tooltip v-if="getName(item) && getName(item).length > 40" location="right" eager>
                  <template #activator="{ props }">
                    <span v-bind="props" v-html="renderBaseOnSearch(getName(item))" />
                  </template>
                  <span v-html="getName(item)" />
                </v-tooltip>
                <span v-else v-html="renderBaseOnSearch(getName(item))" />
              </div>
              <div class="meta">
                <div class="ts">
                  <span class="update">
                    {{ $filters.translate('TL_UPDATED_BY', {user: get(item, '_updatedBy', 'API')}) }}
                  </span>
                  <span v-if="item._id" class="separator"> | </span>
                  <span v-if="item._id" class="time-ago">{{ getTimeAgo(item) }}</span>
                </div>
                <div class="id">
                  <span v-if="item._id" @contextmenu.stop.prevent="copyIdToClipboard(item._id)" v-html="renderBaseOnSearch(item._id)" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </RecycleScroller>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import TranslateService from '@s/TranslateService'
import Notification from '@m/Notification.vue'
import NotificationsService from '@s/NotificationsService'

import RecordNameHelper from './RecordNameHelper'
import qs from 'qs'
import sift from 'sift'
import JSON5 from 'json5'
import Dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
Dayjs.extend(relativeTime)

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
      type: [Object, Boolean],
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
      get: _.get,
      sortOptions: [
        {
          title: TranslateService.get('TL_UPDATED_AT'),
          value: '_updatedAt'
        },
        // {
        //   title: TranslateService.get('TL_CREATED_AT'),
        //   value: '_createdAt'
        // },
        {
          title: TranslateService.get('TL_ALPHABETICAL'),
          value: 'alphabetical'
        }
      ],
      sortMode: false,
      lastSelectedItem: false,
      menuOpened: false,
      search: null,
      TranslateService,
      omnibarDisplayed: false,
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
      let filteredRecords = _.filter(this.list, (item) => {
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
      if (this.sortMode === '_updatedAt' || this.sortMode === '_createdAt') {
        filteredRecords = _.orderBy(filteredRecords, [this.sortMode], ['desc'])
      } else {
        filteredRecords = this.orderedList(filteredRecords)
        // filteredRecords = _.orderBy(filteredRecords, [_.first(_.keys(_.get(filteredRecords, '[0]', false)))], ['asc'])
      }
      // console.log(`order by ${this.sortMode}`, test)
      return filteredRecords
    }
  },
  watch: {
    resource() {
      this.sortMode = _.get(_.first(this.sortOptions), 'value', '_updatedAt')
    },
    selectedResourceGroup () {
      this.search = ''
    },
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
  mounted () {
    this.sortMode = _.get(_.first(this.sortOptions), 'value', '_updatedAt')
    NotificationsService.events.on('omnibar-display-status', this.onGetOmnibarDisplayStatus)
  },
  methods: {
    renderBaseOnSearch(value) {
      let result = _.clone(value)
      if(!_.isEmpty(this.search)) {
        result = result.split(this.search).join(`<strong>${this.search}</strong>`)
        console.warn(1, result, result.split(this.search))
      }
      return result
    },
    getFirstKey(record) {
      return _.get([_.first(_.keys(_.get(record, '[0]', false)))])
    },
    orderedList(list) {
      const collator = new Intl.Collator('en', {
        sensitivity: 'base',
        ignorePunctuation: true
      })
      return list.sort((a, b) => {
        return collator.compare(this.getName(a), this.getName(b))
      })
    },
    onChangeSort(value) {
      this.sortMode = value
    },
    getTimeAgo (item) {
      return Dayjs().to(Dayjs(_.get(item, '_updatedAt', 0)))
    },
    onGetOmnibarDisplayStatus (status) {
      this.omnibarDisplayed = status
    },
    getShortcuts () {
      return this.omnibarDisplayed ? {} : {esc: ['esc'], open: ['ctrl', '/']}
    },
    getSelectedRecordIds () {
      return _.map(this.localMultiselectItems, '_id')
    },
    allRecordsSelected () {
      const ids = this.getSelectedRecordIds()
      return _.get(_.filter(this.filteredList, (record) => !_.includes(ids, record._id)), 'length', 0) === 0
    },
    onClickSelectAll () {
      const ids = this.getSelectedRecordIds()
      _.each(this.filteredList, (record) => {
        if (!_.includes(ids, record._id)) {
          this.localMultiselectItems.push(record)
        }
      })
      this.$emit('changeMultiselectItems', this.localMultiselectItems)
    },
    onClickDeselectAll () {
      this.$emit('changeMultiselectItems', [])
    },
    toggleViewMode () {
      this.localMultiselectItems = []
      this.$emit('changeMultiselectItems', this.localMultiselectItems)
      this.$emit('selectMultiselect', !this.multiselect)
    },
    isCreatingNewRecord () {
      return this.selectedItem && !_.get(this.selectedItem, '_id', false)
    },
    copyIdToClipboard (id) {
      navigator.clipboard.writeText(id)
    },
    hasEditableRecords () {
      return _.get(_.filter(this.filteredList, (item) => _.get(item, '_local', false)), 'length', 0) !== 0
    },
    isItemSelected (item) {
      if (this.multiselect) {
        return _.includes(_.map(this.localMultiselectItems, '_id'), item._id)
      }
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
    select (event, item, clickedCheckbox = false) {
      if (clickedCheckbox) {
        event.stopPropagation()
      }
      if (!item._local) {
        return this.$emit('selectItem', item)
      }
      this.lastSelectedItem = item._id
      if (!clickedCheckbox) {
        this.localMultiselectItems = [item]
        this.$emit('selectItem', item)
      } else {
        if (this.selectedItem && this.selectedItem._id === item._id) {
          return
        }
        if (this.isItemSelected(item)) {
          this.localMultiselectItems = _.filter(this.localMultiselectItems, (i) => i._id !== item._id)
        } else {
          this.localMultiselectItems.push(item)
        }
      }
      this.$emit('changeMultiselectItems', this.localMultiselectItems)
    },
    checkIndex (index) {
      if (index + 1 <= this.filteredList.length) {
        return index + 1
      }
      return -1
    },
    selectTo (item, ctrlPressed = false) {
      if (!this.multiselect) {
        return
      }
      if (ctrlPressed || item._id === this.lastSelectedItem) {
        if (_.isUndefined(_.find(this.localMultiselectItems, {_id: item._id}))) {
          this.localMultiselectItems.push(item)
        } else {
          this.localMultiselectItems = _.filter(this.localMultiselectItems, (i) => i._id !== item._id)
        }
        return this.$emit('changeMultiselectItems', this.localMultiselectItems)
      }
      if (!this.lastSelectedItem) {
        this.lastSelectedItem = item._id
      }
      const state = _.isUndefined(_.find(this.localMultiselectItems, {_id: item._id})) ? 'check' : 'uncheck'
      const start = _.findIndex(this.filteredList, (i) => i._id === item._id)
      const end = _.findIndex(this.filteredList, (i) => i._id === this.lastSelectedItem)
      const firstIndex = start <= end ? start : end
      const lastIndex = this.checkIndex(start <= end ? end : start)
      const selectedItems = _.slice(this.filteredList, firstIndex, lastIndex)
      if (state === 'check') {
        _.each(selectedItems, (i) => {
          if (_.isUndefined(_.find(this.localMultiselectItems, {_id: i._id}))) {
            this.localMultiselectItems.push(i)
          }
        })
      } else {
        const ids = _.map(selectedItems, '_id')
        this.localMultiselectItems = _.filter(this.localMultiselectItems, (i) => !_.includes(ids, i._id))
      }
      this.lastSelectedItem = item._id
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
