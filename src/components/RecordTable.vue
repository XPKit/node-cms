<template>
  <div class="record-table-wrapper">
    <v-menu v-if="selectedResourceGroup && groupedList" v-model="menuOpened" auto content-class="resources-menu full-width" offset-y :close-on-content-click="true">
      <template #activator="{ on, attrs }">
        <div class="resource-selector" v-bind="attrs" :class="{opened: menuOpened}" v-on="on">
          <div class="resource-title">{{ getResourceTitle(resource) }}</div>
          <v-icon large>mdi-chevron-down</v-icon>
        </div>
      </template>
      <v-list rounded>
        <v-list-item
          v-for="r in selectedResourceGroup.list" :key="r.name" dense
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
            ref="search" v-model="search" prepend-inner-icon="mdi-magnify" class="search-bar" flat filled rounded hide-details dense :placeholder="'TL_SEARCH' | translate"
            type="text"
            name="search"
          />
        </div>
        <div class="buttons">
          <v-btn v-if="selectedRecords.length > 0" elevation="0" rounded class="delete-selected-records" @click="removeRecords">{{ 'TL_DELETE_SELECTED_RECORDS' | translate }}</v-btn>
          <v-btn v-if="maxCount <= 0 || listCount < maxCount" elevation="0" rounded class="new" @click="createRecord">{{ 'TL_ADD_NEW_RECORD' | translate }}</v-btn>
        </div>
      </div>
      <template v-if="!record">
        <vue-table-generator
          v-if="isReady" :options="options"
          :selected-records.sync="selectedRecords"
          :resource="resource" :schema="schema" :items="filteredList" :locale.sync="localLocale"
          @remove="removeRecord" @edit="editRecord"
        />
      <!-- <paginate
        v-if="!search"
        v-model="page"
        :page-count="pageCount"
        :click-handler="onPaginationClick"
        :prev-text="'Prev'"
        :next-text="'Next'"
        :container-class="'pager'"
      /> -->
      <!-- <button class="update" @click="updateRecords">{{ "TL_UPDATE" | translate }}</button> -->
      </template>
      <!-- editing -->
      <record-editor
        v-if="record"
        :key="record._id"
        :record.sync="localRecord"
        :resource="resource"
        :locale.sync="localLocale"
        :user-locale="TranslateService.locale"
        @updateRecordList="updateRecordList"
        @back="back"
      />
    </v-card>
  </div>
</template>

<script>

import _ from 'lodash'
import axios from 'axios/dist/axios.min'
import pAll from 'p-all'

import TranslateService from '@s/TranslateService'
import NotificationsService from '@s/NotificationsService'
import VueTableGenerator from '@c/vue-table/VueTableGenerator.vue'
// import Paginate from 'vuejs-paginate'

import RecordEditor from '@c/RecordEditor.vue'
import AbstractEditorView from '@c/AbstractEditorView'
import Notification from '@m/Notification.vue'

export default {
  components: {
    VueTableGenerator,
    RecordEditor
    // Paginate
  },
  mixins: [AbstractEditorView, Notification],
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
      page: 1,
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
    pageCount () {
      return Math.ceil(this.listCount / this.options.paging)
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
      return _.filter(this.clonedRecordList, (item, index) => {
        if (_.isEmpty(this.search)) {
          return (index >= (this.options.paging * (this.page - 1)) && index < this.options.paging * this.page)
        }
        const values = []
        _.forEach(fields, (field) => {
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
      if (this.omnibarDisplayed) {
        return {}
      }
      return {esc: ['esc'], open: ['ctrl', '/']}
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
          await axios.delete(`../api/${this.resource.title}/${record._id}`)
          this.notify(TranslateService.get('TL_RECORD_DELETED', null, { id: record._id }))
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
      let found = false
      _.forEach(values, (value) => {
        found = new RegExp(this.search, 'i').test(value)
        if (found) {
          return false // Exist loop
        }
      })
      return found
    },
    async updateRecord (record) {
      const uploadObject = {}
      let oldRecord = _.find(this.recordList, {_id: record._id})
      _.each(this.resource.schema, (field) => {
        if (field.input === 'file') {
          return
        }
        if (field.input === 'image') {
          return
        }
        const isLocalised = this.resource.locales && (field.localised || _.isUndefined(field.localised))

        if (isLocalised) {
          _.each(this.resource.locales, (locale) => {
            const fieldName = `${locale}.${field.field}`
            let value = _.get(record, fieldName)
            if (field.input === 'pillbox') {
              value = value || []
            } else if (field.input === 'json') {
              value = value || {}
            }
            if (_.isEqual(value, _.get(oldRecord, fieldName))) {
              return
            }
            // if (field.input == "multiselect" && _.isString(field.source)) value = _.map(value, "_id");
            _.set(uploadObject, fieldName, value)
          })
        } else {
          const fieldName = field.field
          let value = _.get(record, fieldName)
          if (field.input === 'pillbox') {
            value = value || []
          } else if (field.input === 'json') {
            value = value || {}
          }
          if (_.isEqual(value, _.get(oldRecord, fieldName))) {
            return
          }
          // if (field.input == "multiselect" && _.isString(field.source)) value = _.map(value, "_id");
          _.set(uploadObject, fieldName, value)
        }
      })
      const newAttachments = _.filter(record._attachments, item => !item._id)
      const removeAttachments = _.filter(oldRecord && oldRecord._attachments, item => !_.find(record._attachments, { _id: item._id }))

      if (_.isUndefined(record._id)) {
        this.$loading.start('create-record')
        try {
          const response = await axios.post(`../api/${this.resource.title}`, uploadObject)
          await this.uploadAttachments(response.data._id, newAttachments)
          this.notify(TranslateService.get('TL_RECORD_CREATED', null, { id: response.data._id }))
          this.$emit('updateRecordList', response.data)
        } catch (error) {
          console.error('Error happend during updateRecord/create:', error)
          this.manageError(error, 'create')
        }
        this.$loading.stop('create-record')
      } else {
        this.$loading.start('update-record')
        try {
          let response
          if (!_.isEmpty(uploadObject)) {
            response = await axios.put(`../api/${this.resource.title}/${record._id}`, uploadObject)
          } else {
            response = { data: record }
          }
          await this.uploadAttachments(response.data._id, newAttachments)
          await this.removeAttachments(response.data._id, removeAttachments)
          if (!_.isEmpty(uploadObject) || !_.isEmpty(newAttachments) || !_.isEmpty(removeAttachments)) {
            this.notify(TranslateService.get('TL_RECORD_UPDATED', null, { id: record._id }))
          }
          this.$emit('updateRecordList', response.data)
        } catch (error) {
          console.error('Error happend during updateRecord/create:', error)
          this.manageError(error, 'update', record)
        }
        this.$loading.stop('update-record')
      }
    },
    async updateRecords () {
      try {
        const promises = []
        this.$loading.start('update-records')
        let removedRecordList = _.filter(this.recordList, (item) => !_.find(this.clonedRecordList, {_id: item._id}))
        for (const record of removedRecordList) {
          promises.push(async () => {
            this.$loading.start('delete-record')
            await axios.delete(`../api/${this.resource.title}/${record._id}`)
            this.notify(TranslateService.get('TL_RECORD_DELETED', null, { id: record._id }))
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
      return _.filter(this.resource.schema, item => item.searchable === true)
    },
    selectLocale (item) {
      this.$emit('update:locale', item)
    },
    getValue (item, field) {
      let displayname = ''
      if (field) {
        if (field.input === 'file') {
          const attachment = _(item).get('_attachments', []).find(file => file._name === field.field)
          displayname = attachment && attachment._filename
        } else {
          const isLocalised = this.resource.locales && (field.localised || _.isUndefined(field.localised))
          if (isLocalised) {
            displayname = _.get(item, `${this.locale}.${field.field}`)
          } else {
            displayname = _.get(item, field.field)
          }
        }
      }
      return displayname
    },
    back () {
      this.$emit('unsetRecord')
    }
  }
}
</script>
