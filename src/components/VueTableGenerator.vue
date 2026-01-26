<template>
  <div class="vue-table-generator vue-form-generator table">
    <v-data-table-virtual
      v-model="localSelectedRecords"
      :theme="theme" :sort-by="sortBy"
      height="73vh" density="compact" multi-sort show-select sticky :no-data-text="$filters.translate('TL_NO_DATA_FOUND')" :item-value="item => item._id" fixed-header :items="tableData" :headers="columns"
      @update:sort-by="onChangeSortBy"
    >
      <template v-for="field in getFields('switch')" :key="field.model" #[`item.${field.model}`]="{item}">
        <div class="checkbox">
          <v-icon size="small" :class="{displayed: getVal(item, field.model)}" icon="$checkBold" />
        </div>
      </template>
      <template v-for="field in getFields('ImageView')" :key="field.model" #[`item.${field.model}`]="{item}">
        <img v-if="getSrc(item, field)" class="vue-table-generator-field image" :src="getSrc(item, field)">
        <span v-else>{{ $filters.translate('TL_NO_IMAGE') }}</span>
      </template>
      <template #[`item.__ACTIONS__`]="{item}">
        <div class="vue-table-generator-field table-column-actions">
          <v-btn size="small" variant="flat" icon @click="edit(item)"><v-icon icon="$noteEditOutline" /></v-btn>
          <v-btn size="small" variant="flat" class="delete-btn" icon @click="remove(item)"><v-icon icon="$trashCanOutline" /></v-btn>
        </div>
      </template>
    </v-data-table-virtual>
  </div>
</template>

<script>
import _ from 'lodash'
import TranslateService from '@s/TranslateService'

export default {
  props: {
    resource: { type: Object, default: () => ({}) },
    schema: { type: Object, default: () => ({}) },
    items: { type: Array, default: () => [] },
    locale: { type: [String, Boolean], default: false },
    options: { type: Object, default: () => ({}) },
    selectedRecords: { type: Array, default: () => [] },
    theme: { type: String, default: 'default' },
  },
  data() {
    return {
      localSelectedRecords: [],
      columns: [],
      sourceData: [],
      tableData: [],
      filteredColumns: [],
      itemsSelected: [],
      sortBy: [],
    }
  },
  computed: {
    orderedItem() {
      return this.items
    },
    schemaFields() {
      let fields = this.schema.fields
      const newFields = []
      _.each(fields, (field) => {
        if (_.get(field, 'options.breakdown', false)) {
          _.each(this.resource.locales, (locale, localeIndex) => {
            if (field.model === `${field.originalModel}.${locale}`) {
              field.localised = false
              field.options.localeIndex = localeIndex + 1
            } else {
              const newField = _.cloneDeep(field)
              newField.localised = false
              const name = field.originalModel && TranslateService.get(field.originalModel)
              newField.label = `${name} (${TranslateService.get(`TL_${locale.toUpperCase()}`)})`
              newField.model = `${field.originalModel}.${locale}`
              _.set(newField, 'options.localeIndex', localeIndex + 1)
              newFields.push(newField)
            }
          })
        }
        field.disabled = true
      })
      fields = fields.concat(newFields)
      const list = _.filter(fields, (item) => _.isNumber(_.get(item, 'options.index', false)))
      if (_.isEmpty(list)) {
        return this.schema.fields
      }
      return _.sortBy(list, (i) => `${i.options.index}${_.get(i, 'options.localeIndex', 0)}`)
    },
  },
  watch: {
    items() {
      this.resetRecordsFiltering()
    },
    localSelectedRecords() {
      this.$emit('update:selectedRecords', this.localSelectedRecords)
    },
  },
  mounted() {
    this.resetRecordsFiltering()
    this.createTableColumns()
  },
  methods: {
    getSrc(item, field) {
      const url = _.get(this.findAttachmentForField(item, field), 'url', false)
      return url ? `${url}?resize=autox50` : false
    },
    findAttachmentForField(item, field) {
      return _.find(_.get(item, '_attachments', []), (attachment) => {
        if (field.localised) {
          return _.get(attachment, '_fields.locale', false) === field.locale && attachment._name === field.originalModel
        }
        return attachment._name === field.originalModel
      })
    },
    getFields(type) {
      return _.filter(this.schemaFields, { type: type })
    },
    getVal(item, key, defaultVal = false) {
      return _.get(item, key, defaultVal)
    },
    onChangeSortBy(sortBy) {
      this.sortBy = sortBy
    },
    resetRecordsFiltering() {
      this.sourceData = this.orderedItem
      this.tableData = this.sourceData.slice(0)
    },
    createTableColumns() {
      const columns = _.map(this.schemaFields, (field) => {
        const column = {
          value: field.model,
          key: field.model,
          title: field.label,
          sortable: true,
          ellipsis: {
            showTitle: true,
            lineClamp: _.get(field, 'options.lineClamp', 1),
          },
        }
        _.each(['sortBy', 'align'], (key) => {
          const val = _.get(field, `options.${key}`, false)
          if (val !== false) {
            _.set(column, key, val)
          }
        })
        return column
      })
      columns.push({
        value: '__ACTIONS__',
        key: '__ACTIONS__',
        sortable: false,
        title: TranslateService.get('TL_ACTIONS'),
        width: 75,
      })
      this.columns = columns
    },
    edit(item) {
      this.$emit('edit', item)
    },
    remove(item) {
      this.$emit('remove', item)
    },
    isRecordSelected(record) {
      return _.includes(this.localSelectedRecords, _.get(record, '_id', false))
    },
    onSelectRecord(rowId, val) {
      if (val) {
        this.localSelectedRecords.push(rowId)
      } else {
        this.localSelectedRecords = _.filter(this.localSelectedRecords, (id) => id !== rowId)
      }
      this.$emit('update:selectedRecords', this.localSelectedRecords)
    },
    searchBy(items, fieldKey) {
      this.tableData = this.sourceData.filter((x) => items.length === 0 || items.includes(_.get(x, fieldKey)))
    },
    editRow(row) {
      console.info('editRow', row)
    },
    getFieldType(field) {
      return _.get(field, 'overrideType', _.get(field, 'type', false))
    },
  },
}
</script>

<style lang="scss" scoped>
@use '@a/scss/variables.scss' as *;
@use '@a/scss/mixins.scss' as *;
.vue-table-generator {
  display: block;
  overflow: hidden;
}
#table-top{
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px
}
.empty-data {
  text-align: center;
  padding-top: 36px;
  @include h4;
}
.table-column-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  button {
    background-color: $table-row-icon-background;
  }
  .v-icon {
    color: $table-row-icon-color;
  }
}
</style>
