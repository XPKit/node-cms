<template>
  <div class="record-table">
    <!-- table -->
    <template v-if="!record">
      <div class="search">
        <input v-model="search" :placeholder="'TL_SEARCH' | translate" type="text" name="search">
      </div>
      <div v-if="maxCount <= 0 || listCount < maxCount" class="new" @click="createRecord">+</div>

      <ul v-show="resource.locales" class="locales">
        <li
          v-for="item in resource.locales" :key="item"
          :class="{ selected: item == locale }"
          @click="selectLocale(item)"
        >
          {{ 'TL_'+item.toUpperCase() | translate }}
        </li>
      </ul>

      <vue-table-generator
        v-if="isReady" :options="options"
        :resource="resource" :schema="schema" :items="filteredList" :locale.sync="localLocale"
        @remove="removeRecord" @edit="editRecord"
      />

      <paginate
        v-if="!search"
        v-model="page"
        :page-count="pageCount"
        :click-handler="onPaginationClick"
        :prev-text="'Prev'"
        :next-text="'Next'"
        :container-class="'pager'"
      />

      <!-- <button class="update" @click="updateRecords">{{ "TL_UPDATE" | translate }}</button> -->
    </template>

    <!-- editing -->
    <record-editor
      v-if="record"
      :key="record._id"
      class="has-back-button"
      :resource-list="resourceList"
      :record.sync="localRecord"
      :resource="resource"
      :locale.sync="localLocale"
      :user-locale="TranslateService.locale"
      @updateRecordList="updateRecordList"
      @back="back"
    />
  </div>
</template>

<script>

import _ from 'lodash'
import axios from 'axios/dist/axios.min'
import pAll from 'p-all'

import TranslateService from '@s/TranslateService'
import VueTableGenerator from '@c/vue-table/VueTableGenerator.vue'
import Paginate from 'vuejs-paginate'

import RecordEditor from '@c/RecordEditor.vue'
import AbstractEditorView from '@c/AbstractEditorView'
import Notification from '@m/Notification'

export default {
  components: {
    VueTableGenerator,
    RecordEditor,
    Paginate
  },
  mixins: [AbstractEditorView, Notification],
  props: [
    'resourceList',
    'recordList',
    'resource',
    'locale',
    'record'
  ],
  data () {
    return {
      page: 1,
      isReady: false,
      search: null,
      cachedMap: {},
      schema: { fields: [] },
      TranslateService,
      localLocale: false,
      localRecord: {},
      clonedRecordList: null
    }
  },
  computed: {
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
      await await this.updateSchema()
      this.isReady = true
      this.$forceUpdate()
    },
    async userLocale () {
      this.isReady = false
      await this.updateSchema()
      this.isReady = true
    }
  },
  methods: {
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
    async removeRecord (record) {
      if (!window.confirm(
        TranslateService.get('TL_ARE_YOU_SURE_TO_DELETE'),
        TranslateService.get('TL_YES'),
        TranslateService.get('TL_NO')
      )) {
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
            }
            if (_.includes(['code', 'json'], field.input)) {
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
          }
          if (_.includes(['code', 'json'], field.input)) {
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
