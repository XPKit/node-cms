<template>
  <div class="record-table-wrapper">
    <v-menu v-if="selectedResourceGroup && groupedList" v-model="menuOpened" content-class="resources-menu full-width" location="bottom" :close-on-content-click="true">
      <template #activator="{ props }">
        <div class="resource-selector" v-bind="props" :class="{opened: menuOpened}">
          <div class="resource-title">{{ getResourceTitle(resource) }}</div>
          <v-icon size="large">mdi-chevron-down</v-icon>
        </div>
      </template>
      <v-list rounded>
        <v-list-item
          v-for="r in selectedResourceGroup.list" :key="r.name" density="compact"
          :class="{selected: r === resource}" @click="r !== resource ? selectResourceCallback(r) : ''"
        >
          <v-list-item-title>{{ getResourceTitle(r) }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-card class="record-table" :class="{'has-back-button': record}" elevation="0">
      <div v-if="!record" class="top-bar">
        <top-bar-locale-list :locales="resource.locales" :locale="locale" :select-locale="selectLocale" :back="back" />
        <div v-shortkey="getShortcuts()" class="search" @shortkey="interactiveSearch">
          <v-text-field
            ref="search" v-model="search" prepend-inner-icon="mdi-magnify" class="search-bar" flat variant="solo-filled" rounded hide-details density="compact" :placeholder="$filters.translate('TL_SEARCH')"
            type="text"
            name="search"
          />
        </div>
        <div class="buttons">
          <v-btn v-if="selectedRecords.length > 0" elevation="0" rounded class="delete-selected-records" @click="removeRecords">{{ $filters.translate('TL_DELETE_SELECTED_RECORDS') }}</v-btn>
          <v-btn v-if="maxCount <= 0 || listCount < maxCount" elevation="0" rounded class="new" @click="createRecord">{{ $filters.translate('TL_ADD_NEW_RECORD') }}</v-btn>
        </div>
      </div>
      <template v-if="!record">
        <vue-table-generator
          v-if="isReady"
          v-model:selected-records="selectedRecords" v-model:locale="localLocale"
          :theme="theme"
          :options="options" :resource="resource" :schema="schema" :items="filteredList"
          @remove="removeRecord" @edit="editRecord"
        />
      </template>
      <!-- editing -->
      <record-editor
        v-if="record"
        :key="record._id"
        v-model:record="localRecord"
        v-model:locale="localLocale"
        :resource="resource"
        :user-locale="TranslateService.locale"
        @update-record-list="updateRecordList"
        @back="back"
      />
    </v-card>
  </div>
</template>

<script>

import _ from 'lodash'
import pAll from 'p-all'

import TranslateService from '@s/TranslateService'
import NotificationsService from '@s/NotificationsService'
import RequestService from '@s/RequestService'
import VueTableGenerator from '@c/VueTableGenerator.vue'
import TopBarLocaleList from '@c/TopBarLocaleList.vue'

import RecordEditor from '@c/RecordEditor.vue'
import AbstractEditorView from '@c/AbstractEditorView'
import Notification from '@m/Notification'
import FieldTheme from '@m/FieldTheme'

export default {
  components: {
    VueTableGenerator,
    RecordEditor,
    TopBarLocaleList
  },
  mixins: [AbstractEditorView, Notification, FieldTheme],
  props: {
    groupedList: {
      type: Array,
      default: () => []
    },
    recordList: {
      type: Array,
      default: () => []
    },
    locale: {
      type: String,
      default: 'enUS'
    },
    selectedResourceCallback: {
      type: Function,
      default: () => {}
    },
    resource: {
      type: Object,
      default: () => {}
    },
    record: {
      type: Object,
      default: () => {}
    }
  },
  data () {
    return {
      menuOpened: false,
      isReady: false,
      omnibarDisplayed: false,
      search: null,
      cachedMap: {},
      selectedRecords: [],
      schema: { fields: [] },
      TranslateService,
      localLocale: false,
      localRecord: {},
      clonedRecordList: null
    }
  },
  computed: {
    selectedResourceGroup () {
      return _.find(this.groupedList, (resourceGroup) => this.groupSelected(resourceGroup))
    },
    options () {
      return {
        paging: _.get(this.resource, 'options.paging', 10),
        displayId: _.get(this.resource, 'options.displayId', true),
        displayUpdatedAt: _.get(this.resource, 'options.displayUpdatedAt', true)
      }
    },
    maxCount () {
      return _.get(this.resource, 'maxCount', 0)
    },
    listCount () {
      return _.get(this.clonedRecordList, 'length', 0)
    },
    filteredList () {
      let fields = this.getSearchableFields()
      if (fields.length === 0) {
        fields = [_.first(this.resource.schema)]
      }
      if (_.isEmpty(this.search)) {
        return this.clonedRecordList
      }
      return _.filter(this.clonedRecordList, (item) => {
        const values = []
        _.each(fields, (field) => {
          values.push(this.getValue(item, field))
        })
        return this.doesMatch(this.search, values) || new RegExp(this.search, 'i').test(item._id)
      })
    }
  },
  watch: {
    async locale () {
      this.isReady = false
      this.localLocale = this.locale
      this.$emit('update:locale', this.localLocale)
      await this.updateSchema()
      this.isReady = true
    },
    async record () {
      this.localRecord = _.cloneDeep(this.record)
    },
    async recordList () {
      this.clonedRecordList = _.cloneDeep(this.recordList)
      this.isReady = false
      await this.updateSchema()
      this.isReady = true
      this.$forceUpdate()
    },
    async userLocale () {
      this.isReady = false
      await this.updateSchema()
      this.isReady = true
    }
  },
  mounted () {
    NotificationsService.events.on('omnibar-display-status', this.onGetOmnibarDisplayStatus)
  },
  methods: {
    onGetOmnibarDisplayStatus (status) {
      this.omnibarDisplayed = status
    },
    getShortcuts () {
      return this.omnibarDisplayed ? {} : {esc: ['esc'], open: ['ctrl', '/']}
    },
    async interactiveSearch (event) {
      const action = _.get(event, 'srcKey', false)
      const elem = _.get(this.$refs, '[\'search\']', false)
      if (!action || !elem) {
        return
      }
      return action === 'esc' ? elem.blur() : elem.focus()
    },
    getResourceTitle (resource) {
      if (!resource) {
        return ''
      }
      return resource.displayname ? TranslateService.get(resource.displayname) : resource.title
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
    onPaginationClick () {
      console.warn('onPaginationClick ---', arguments)
    },
    updateRecordList (record) {
      this.$emit('updateRecordList', record)
    },
    selectRecord (record) {
      this.localLocale = this.locale
      this.$emit('update:record', record)
    },
    editRecord (record) {
      this.selectRecord(record)
    },
    askConfirmation (forMultipleRecords = false) {
      return window.confirm(
        TranslateService.get(`TL_ARE_YOU_SURE_TO_DELETE${forMultipleRecords ? '_SELECTED_RECORDS' : ''}`),
        TranslateService.get('TL_YES'),
        TranslateService.get('TL_NO')
      )
    },
    async removeRecords () {
      if (!this.askConfirmation(true)) {
        return
      }
      await Promise.all(_.map(this.selectedRecords, (record) => this.removeRecord({_id: record}, true)))
    },
    async removeRecord (record, skipConfirm = false) {
      if (!skipConfirm && !this.askConfirmation()) {
        return
      }
      if (_.isUndefined(record._id)) {
        record = {}
        this.$emit('update:record', null)
      } else {
        this.$loading.start('delete-record')
        try {
          await RequestService.delete(`../api/${this.resource.title}/${record._id}`)
          this.notify(TranslateService.get('TL_RECORD_DELETED', { id: record._id }))
          this.$emit('updateRecordList', null)
        } catch (error) {
          console.error('Error happen during deleteRecord:', error)
          this.manageError(error, 'delete', this.editingRecord)
        }
        this.$loading.stop('delete-record')
      }
      this.clonedRecordList = _.filter(this.clonedRecordList, (item) => record !== item)
    },
    doesMatch (search, values) {
      return _.find(values, (v)=> new RegExp(this.search, 'i').test(v))
    },
    getFieldValue (record, fieldName, field) {
      const value = _.get(record, fieldName)
      if (!_.includes(['pillbox', 'json'], field.input)) {
        return value
      }
      return value || (field.input === 'pillbox' ? [] : {})
    },
    async updateRecord (record) {
      const uploadObject = {}
      let oldRecord = _.find(this.recordList, {_id: record._id})
      const fields = _.filter(this.resource.schema, (field)=> !_.includes(['file', 'image'], field.input))
      _.each(fields, (field) => {
        const isLocalised = this.resource.locales && (field.localised || _.isUndefined(field.localised))
        if (isLocalised) {
          _.each(this.resource.locales, (locale) => {
            const fieldName = `${field.field}.${locale}`
            const value = this.getFieldValue(record, fieldName, field)
            if (!_.isEqual(value, _.get(oldRecord, fieldName))) {
              _.set(uploadObject, fieldName, value)
            }
          })
        } else {
          const fieldName = field.field
          const value = this.getFieldValue(record, fieldName, field)
          if (!_.isEqual(value, _.get(oldRecord, fieldName))) {
            _.set(uploadObject, fieldName, value)
          }
        }
      })
      const newAttachments = _.filter(record._attachments, item => !item._id)
      const removeAttachments = _.filter(oldRecord && oldRecord._attachments, item => !_.find(record._attachments, { _id: item._id }))

      if (_.isUndefined(record._id)) {
        this.$loading.start('create-record')
        try {
          const data = await RequestService.post(`../api/${this.resource.title}`, uploadObject)
          await this.uploadAttachments(data._id, newAttachments)
          this.notify(TranslateService.get('TL_RECORD_CREATED', { id: data._id }))
          this.$emit('updateRecordList', data)
        } catch (error) {
          console.error('Error happend during updateRecord/create:', error)
          this.manageError(error, 'create')
        }
        this.$loading.stop('create-record')
        return
      }
      this.$loading.start('update-record')
      try {
        let response
        if (!_.isEmpty(uploadObject)) {
          response.data = await RequestService.put(`../api/${this.resource.title}/${record._id}`, uploadObject)
        } else {
          response = { data: record }
        }
        await this.uploadAttachments(response.data._id, newAttachments)
        await this.removeAttachments(response.data._id, removeAttachments)
        if (!_.isEmpty(uploadObject) || !_.isEmpty(newAttachments) || !_.isEmpty(removeAttachments)) {
          this.notify(TranslateService.get('TL_RECORD_UPDATED', { id: record._id }))
        }
        this.$emit('updateRecordList', response.data)
      } catch (error) {
        console.error('Error happend during updateRecord/create:', error)
        this.manageError(error, 'update', record)
      }
      this.$loading.stop('update-record')
    },
    async updateRecords () {
      try {
        const promises = []
        this.$loading.start('update-records')
        let removedRecordList = _.filter(this.recordList, (item) => !_.find(this.clonedRecordList, {_id: item._id}))
        for (const record of removedRecordList) {
          promises.push(async () => {
            this.$loading.start('delete-record')
            await RequestService.delete(`../api/${this.resource.title}/${record._id}`)
            this.notify(TranslateService.get('TL_RECORD_DELETED', { id: record._id }))
            this.$emit('updateRecordList', null)
            this.$loading.stop('delete-record')
          })
        }
        for (const record of _.reverse(this.clonedRecordList)) {
          promises.push(async () => await this.updateRecord(record))
        }
        await pAll(promises, {concurrency: 10})
      } catch (error) {
        console.error('Error happens during updateRecords:', error)
      }
      this.$loading.stop('update-records')
    },
    createRecord () {
      let obj = { _local: true }
      _.each(this.schema.fields, (item) => {
        _.set(obj, item.model, undefined)
      })
      this.clonedRecordList.push(obj)
      this.selectRecord(obj)
    },
    getSearchableFields () {
      return _.filter(this.resource.schema, {searchable: true})
    },
    selectLocale (item) {
      this.$emit('update:locale', item)
    },
    getValue (item, field) {
      if (!field) {
        return ''
      }
      if (field.input === 'file') {
        const attachment = _(item).get('_attachments', []).find(file => file._name === field.field)
        return attachment && attachment._filename
      }
      if (this.resource.locales && (field.localised || _.isUndefined(field.localised))) {
        return _.get(item, `${field.field}.${this.locale}`)
      }
      return _.get(item, field.field)
    },
    back () {
      this.$emit('unsetRecord')
    }
  }
}
</script>
