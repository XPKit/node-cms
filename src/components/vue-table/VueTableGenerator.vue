<template>
  <div ref="excel-container" class="vue-table-generator vue-form-generator table">
    <ve-table
      ref="tableRef" scroll-width="0" :sort-option="sortOption"
      :virtual-scroll-option="{enable: true}" :column-width-resize-option="columnWidthResizeOption"
      :columns="columns" :table-data="tableData" :fixed-header="true" :border-around="true" :border-x="true" :border-y="true"
      :clipboard-option="clipboardOption"
      max-height="100%"
      row-key-field-name="_id"
    />
    <div v-show="tableData.length === 0" class="empty-data">{{ 'TL_NO_DATA_FOUND' | translate }}</div>
  </div>
</template>

<script lang="jsx">
import _ from 'lodash'
import TranslateService from '@s/TranslateService'

export default {
  props: ['resource', 'schema', 'items', 'locale', 'options', 'selectedRecords'],
  data () {
    return {
      localSelectedRecords: [],
      columns: [],
      sourceData: [],
      tableData: [],
      filteredColumns: [],
      sortOption: {
        multipleSort: true,
        sortAlways: true,
        sortChange: (params) => {
          // console.log('sortChange::', _.keys(params), _.values(params))
          this.tableData = _.sortBy(this.tableData, _.keys(params), _.values(params))
        }
      },
      clipboardOption: {
        copy: true,
        paste: false,
        cut: false,
        delete: false,
        beforeCopy: ({ data, selectionRangeIndexes, selectionRangeKeys }) => {
          // console.log('beforeCopy', { data, selectionRangeIndexes, selectionRangeKeys })
          navigator.clipboard.writeText(this.getDataToCopy(selectionRangeIndexes))
          return false
        }
      },
      columnWidthResizeOption: {enable: true, minWidth: 50}
    }
  },
  computed: {
    orderedItem () {
      return this.items
    },
    schemaFields () {
      let fields = this.schema.fields
      let newFields = []
      _.forEach(fields, (field) => {
        if (_.get(field, 'options.breakdown', false)) {
          _.forEach(this.resource.locales, (locale, localeIndex) => {
            if (field.model === `${locale}.${field.originalModel}`) {
              field.localised = false
              field.options.localeIndex = localeIndex + 1
            } else {
              let newField = _.cloneDeep(field)
              newField.localised = false
              const name = field.originalModel && TranslateService.get(field.originalModel)
              newField.label = `${name} (${TranslateService.get(`TL_${locale.toUpperCase()}`)})`
              newField.model = `${locale}.${field.originalModel}`
              _.set(newField, 'options.localeIndex', localeIndex + 1)
              newFields.push(newField)
            }
          })
        }
        field.disabled = true
      })
      fields = fields.concat(newFields)
      let list = _.filter(fields, (item) => _.isNumber(_.get(item, 'options.index', false)))
      if (_.isEmpty(list)) {
        return this.schema.fields
      }
      return _.sortBy(list, (i) => `${i.options.index}${_.get(i, 'options.localeIndex', 0)}`)
    }
  },
  watch: {
    items () {
      this.resetRecordsFiltering()
    }
  },
  mounted () {
    this.resetRecordsFiltering()
    this.createTableColumns()
  },
  methods: {
    getDataToCopy (indexes) {
      let startCol = indexes.startColIndex
      let endCol = indexes.endColIndex
      const fieldNames = this.columns
        .slice(startCol, endCol + 1)
        .map((x) => x.field)
      // console.warn('fieldNames - ', fieldNames)
      const dataToCopy = this.tableData
        .slice(indexes.startRowIndex, indexes.endRowIndex + 1)
        .map((rowData) => {
          return _.map(fieldNames, (fieldName) => {
            return _.get(rowData, fieldName, '')
          })
        })
      // console.warn('dataToCopy - ', dataToCopy)
      let text = ''
      _.each(dataToCopy, (line, i) => {
        if (i !== 0) {
          text += '\n'
        }
        text += line.join('\t')
      })
      return text
    },
    deleteSelectedRecords () {
      this.$emit('remove-records', _.filter(this.sourceData, (row) => _.includes(this.selectedRecords, row._id)))
    },
    resetRecordsFiltering () {
      this.sourceData = this.orderedItem
      this.tableData = this.sourceData.slice(0)
      // console.warn('tableData = ', this.tableData)
    },
    createTableColumns () {
      const columns = [
        {
          field: '__RECORD_SELECTION__',
          key: '__RECORD_SELECTION__',
          // title: TranslateService.get('TL_RECORD_SELECTION'),
          fixed: 'left',
          align: 'center',
          disableResizing: true,
          width: 40,
          renderBodyCell: ({ row, column, rowIndex }, h) => {
            return h('TableRecordSelection', {props: {row, selected: this.isRecordSelected(row), onChange: this.onSelectRecord}})
          }
        }
      ]
      _.each(this.schemaFields, (field, key) => {
        // console.warn('test 2 - ', key, field.model, field.type, field)
        const fieldType = this.getFieldType(field)
        const tableFieldType = 'Table' + fieldType
        const column = {
          field: field.model,
          key: 'a' + key,
          title: field.label,
          ellipsis: {
            showTitle: true,
            lineClamp: _.get(field, 'options.lineClamp', 1)
          },
          // width: _.get(field, 'options.width', 50),
          renderBodyCell: ({ row, column, rowIndex }, h) => {
            // console.warn(`test-  ${column.field} - ${fieldType}`)
            if (_.includes(['CustomInput', 'CustomMultiSelect'], fieldType)) {
              return _.get(row, column.field, '')
            }
            if (!(tableFieldType in Vue.options.components)) {
              console.error(`${tableFieldType} isn't defined as a custom field type, will not render it`)
              return _.get(row, column.field, '')
            }
            return h(tableFieldType, {props: {row, column, rowIndex, field}})
          }
        }
        if (_.get(field, 'options.filter', false)) {
          column.filter = {
            filterList: _.uniqBy(_.map(this.sourceData, (item, i) => {
              return {
                value: i,
                label: field.type === 'switch' ? TranslateService.get('TL_' + _.toUpper(_.get(item, field.model, false))) : _.get(item, field.model),
                realValue: _.get(item, field.model),
                selected: false
              }
            }), 'label'),
            isMultiple: _.get(field, 'options.filter', false) === 'multiple',
            // filter confirm hook
            filterConfirm: (filterList) => {
              const items = filterList.filter((x) => x.selected).map((x) => x.realValue)
              this.searchBy(items, field.model)
              if (!_.includes(this.filteredColumns, column.field)) {
                this.filteredColumns.push(column.field)
              }
            },
            // filter reset hook
            filterReset: (filterList) => {
              this.searchBy([], field.model)
              this.filteredColumns = _.filter(this.filteredColumns, column.field)
            },
            filterIcon: () => {
              if (_.includes(this.filteredColumns, column.field)) {
                return <v-icon>mdi-filter</v-icon>
              }
              return <v-icon>mdi-filter-outline</v-icon>
            },
            // max height
            maxHeight: 200
          }
        }
        _.each(['sortBy', 'align'], (key) => {
          const val = _.get(field, `options.${key}`, false)
          if (val !== false) {
            _.set(column, key, val)
          }
        })
        columns.push(column)
      })
      // console.warn('columns = ', columns)
      columns.push({
        field: '__ACTIONS__',
        key: '__ACTIONS__',
        title: TranslateService.get('TL_ACTIONS'),
        fixed: 'right',
        disableResizing: true,
        width: 75,
        renderBodyCell: ({ row, column, rowIndex }, h) => {
          return h('TableRowActions', {props: {row,
            column,
            rowIndex,
            remove: (row) => this.$emit('remove', row),
            edit: (row) => this.$emit('edit', row)
          }})
        }
      })
      this.columns = columns
      // console.warn('cols = ', this.columns)
    },
    isRecordSelected (record) {
      return _.includes(this.localSelectedRecords, _.get(record, '_id', false))
    },
    onSelectRecord (val, rowId) {
      if (val) {
        this.localSelectedRecords.push(rowId)
      } else {
        this.localSelectedRecords = _.filter(this.localSelectedRecords, (id) => id !== rowId)
      }
      this.$emit('update:selectedRecords', this.localSelectedRecords)
    },
    searchBy (items, fieldKey) {
      this.tableData = this.sourceData.filter(
        (x) => items.length === 0 || items.includes(_.get(x, fieldKey))
      )
    },
    editRow (row) {
      console.warn('editRow', row)
    },
    getFieldType (field) {
      return _.get(field, 'overrideType', _.get(field, 'type', false))
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@a/scss/variables.scss';
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
</style>
