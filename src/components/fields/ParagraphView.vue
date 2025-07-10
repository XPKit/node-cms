<template>
  <div class="paragraph-view" :style="{ '--paragraph-level': Math.max(0, (paragraphLevel || 1) - 1) }" :data-debug-level="paragraphLevel">
    <!-- Sticky header with add button -->
    <div v-if="!disabled && !schema.disabled && (maxCount === -1 || items.length < maxCount)" class="paragraph-header-bar" :data-paragraph-level="paragraphLevel" :data-css-level="Math.max(0, (paragraphLevel || 1) - 1)">
      <v-autocomplete
        ref="input"
        :ripple="false" :menu-props="menuProps"
        :theme="theme" transition="none"
        :model-value="selectedType" :items="types" item-title="label" item-value="label"
        hide-details rounded density="compact" persistent-placeholder variant="solo-filled" flat :rules="[validateField]"
        :disabled="disabled || schema.disabled" menu-icon="mdi-chevron-down" @update:model-value="onChangeType"
      >
        <template #prepend><field-label :schema="schema" /></template>
        <template #label />
      </v-autocomplete>
      <div class="add-btn-wrapper">
        <v-btn elevation="0" class="add-new-item" rounded :disabled="blockMoreItems()" @click="onClickAddNewItem"><span>{{ $filters.translate('TL_ADD') }}</span></v-btn>
        <v-btn v-if="hasFileOrImageTypes" elevation="0" class="add-multiple-items" rounded :disabled="blockMoreItems()" @click="toggleMultipleDropZone">
          <span>{{ $filters.translate('TL_ADD_MULTIPLE') }}</span>
        </v-btn>
      </div>
    </div>

    <!-- Multiple files drop zone -->
    <div
      v-if="showMultipleDropZone"
      class="multiple-drop-zone"
      :class="{ 'drag-over': isDragOver }"
      @click="$refs.fileInput.click()"
      @drop="onDropFiles"
      @dragover.prevent="onDragOver"
      @dragenter.prevent="onDragEnter"
      @dragleave.prevent="onDragLeave"
    >
      <div class="drop-zone-content">
        <v-icon size="48" color="primary">mdi-cloud-upload</v-icon>
        <div class="drop-zone-text">
          <div class="primary-text">{{ $filters.translate('TL_DRAG_AND_DROP_FILES_HERE') }}</div>
          <div class="secondary-text">{{ $filters.translate('TL_OR_CLICK_TO_SELECT_FILES') }}</div>
          <div class="supported-types">
            {{ $filters.translate('TL_SUPPORTED_TYPES') }}: {{ getSupportedExtensions() }}
          </div>
        </div>
        <input ref="fileInput" type="file" multiple style="display: none" :accept="getAllAcceptedTypes()" @change="onSelectFiles">
      </div>
    </div>
    <div class="paragraph-content">
      <draggable
        v-if="schema && subResourcesLoaded"
        :key="`${schema.model}-${key}`"
        :list="items"
        :class="{disabled, 'dynamic-layout-container': isDynamicLayoutContainer}"
        draggable=".item"
        v-bind="dragOptions"
        handle=".handle"
        :group="`${schema.model}-${key}`"
        ghost-class="ghost"
        @end="onEndDrag"
      >
        <v-card
          v-for="(item, idx) in items"
          :key="`paragraph-item-${idx}`"
          :theme="theme"
          elevation="0"
          :class="getItemClasses(idx, item)"
          :style="getItemStyles(item)"
          :data-slots="getItemSlots(item)"
        >
          <v-card-title class="handle paragraph-header">
            <div class="paragraph-title">{{ item.label }}</div>
            <div class="add-btn-wrapper">
              <v-btn
                class="remove-item"
                :disabled="disabled || schema.disabled"
                variant="text"
                icon
                rounded
                size="small"
                @click="onClickRemoveItem(item)"
              >
                <v-icon>mdi-trash-can-outline</v-icon>
              </v-btn>
            </div>
          </v-card-title>
          <div class="item-main-wrapper">
            <div class="item-main">
              <div v-if="item.showConvert || item.cannotConvert" class="convert-paragraph">
                <div v-if="item.cannotConvert" class="error-message">{{ $filters.translate('TL_INVALID_PARAGRAPH_CANNOT_BE_CONVERTED') }}</div>
                <div v-else class="error-message">{{ $filters.translate('TL_INVALID_PARAGRAPH_WOULD_YOU_LIKE_TO_CONVERT_IT') }}</div>
                <json-viewer :value="item" tabindex="-1" />
                <template v-if="item.showConvert">
                  <div class="convert-action">
                    <v-select
                      :model-value="item.showConvert"
                      :menu-props="menuProps"
                      :theme="theme"
                      transition="none"
                      :items="types"
                      hide-details
                      rounded
                      density="compact"
                      persistent-placeholder
                      variant="solo-filled"
                      flat
                    >
                      <template #prepend><field-label :schema="{label: $filters.translate('TL_CONVERT_TO')}" /></template>
                      <template #label />
                    </v-select>
                    <v-btn elevation="0" rounded @click="convertParagraph(item)">{{ $filters.translate('TL_CONVERT') }}</v-btn>
                  </div>
                </template>
              </div>
              <custom-form v-else :schema="getSchema(item, idx)" :model="item" :paragraph-index="idx" :paragraph-level="paragraphLevel + 1" @error="onError" @input="onModelUpdated" />
            </div>
          </div>
        </v-card>
      </draggable>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import SchemaService from '@s/SchemaService'
import FieldSelectorService from '@s/FieldSelectorService'
import ResourceService from '@s/ResourceService'
import DragList from '@m/DragList'
import {v4 as uuid} from 'uuid'
import pAll from 'p-all'

export default {
  mixins: [DragList],
  props: ['schema', 'vfg', 'model', 'disabled', 'paragraphLevel', 'theme'],
  data () {
    return {
      items: _.cloneDeep(_.get(this.model, this.schema.model, [])),
      types: [],
      fileInputTypes: ['file', 'img', 'image', 'imageView', 'attachmentView'],
      selectedType: false,
      subResourcesLoaded: false,
      key: uuid(),
      maxCount: _.get(this.schema, 'options.maxCount', -1),
      menuProps: {
        contentProps: {
          density: 'compact'
        }
      },
      highlight: {
        level: -1,
        index: -1
      },
      showMultipleDropZone: false,
      isDragOver: false
    }
  },
  computed: {
    isDynamicLayoutContainer() {
      return this.schema && (
        _.get(this.schema, 'options.dynamicLayout', false) ||
        _.some(this.items, item => _.has(item, '_value.slots') || _.has(item, 'slots'))
      )
    },
    parentSlots() {
      return this.isDynamicLayoutContainer ? _.get(this.model, 'slots', _.get(this.vfg, 'model.slots', 12)) : 12
    },
    hasFileOrImageTypes() {
      // Check if there's a mapping configuration for file types
      const mapping = _.get(this.schema, 'options.mapping', {})
      return _.has(mapping, 'default') || _.some(_.keys(mapping), key => key !== 'default')
    },
    fileImageTypesMap() {
      const map = {}
      const mapping = _.get(this.schema, 'options.mapping', {})
      // Process each mapping entry
      _.each(mapping, (config, key) => {
        if (key === 'default') {
          return
        }
        const extensions = key.split(',').map(ext => ext.trim().toLowerCase())
        _.each(extensions, ext => {
          const normalizedExt = ext.startsWith('.') ? ext : '.' + ext
          if (!map[normalizedExt]) {
            map[normalizedExt] = []
          }
          map[normalizedExt].push({
            type: config._type,
            field: config.field
          })
        })
      })
      return map
    }
  },
  watch: {
    'schema.model': function () {
      this.items = _.cloneDeep(_.get(this.model, this.schema.model, []))
    }
  },
  async mounted () {
    this.getTypes()
    this.getSchemaForItems()
    await this.getSubResources()
    this.selectedType = _.first(this.types)
    FieldSelectorService.events.on('highlight-paragraph', this.onHighlightParagraph)
  },
  unmounted() {
    FieldSelectorService.events.off('highlight-paragraph', this.onHighlightParagraph)
  },
  methods: {
    getItemClasses(idx, item) {
      const classes = ['item', `nested-level-${this.paragraphLevel}`]
      if (this.isHighlighted(idx)) {
        classes.push('highlighted')
      } else if (this.highlight.level !== -1 && this.highlight.index !== -1) {
        classes.push('not-highlighted')
      }
      if (this.isDynamicLayoutContainer) {
        let slots = _.get(item, '_value.slots') || _.get(item, 'slots')
        if (!slots) {
          try {
            const paragraphType = _.get(item, '_type') || _.get(item, 'title')
            if (paragraphType) {
              const paragraphSchema = ResourceService.getParagraphSchema(paragraphType)
              const layoutSlots = _.get(paragraphSchema, 'layout.slots')
              if (layoutSlots) {
                slots = layoutSlots
              }
            }
          } catch (error) {
            console.error(`Error: `, error)
          }
        }
        if (!slots) {
          slots = 2
        }
        classes.push('dynamic-layout-item')
        classes.push(`slots-${slots}`)
      }
      return classes
    },
    getItemStyles(item) {
      if (this.isDynamicLayoutContainer) {
        let slots = _.get(item, '_value.slots') || _.get(item, 'slots')
        if (!slots) {
          try {
            const paragraphType = _.get(item, '_type') || _.get(item, 'title')
            if (paragraphType) {
              const paragraphSchema = ResourceService.getParagraphSchema(paragraphType)
              const layoutSlots = _.get(paragraphSchema, 'layout.slots')
              if (layoutSlots) {
                slots = layoutSlots
              }
            }
          } catch (error) {
            console.warn('Could not get paragraph schema for slots:', _.get(item, '_type'), error)
          }
        }
        if (!slots) {
          slots = 2
        }
        const percentage = (slots / this.parentSlots) * 100
        const itemsPerRow = Math.floor(this.parentSlots / slots)
        const totalGapInRow = Math.max(0, (itemsPerRow - 1) * 16)
        const gapPerItem = itemsPerRow > 1 ? totalGapInRow / itemsPerRow : 0
        const adjustedWidth = `calc(${percentage}% - ${gapPerItem}px)`
        return {
          flexBasis: adjustedWidth,
          maxWidth: adjustedWidth,
          width: adjustedWidth
        }
      }
      return {}
    },
    getItemSlots(item) {
      if (!this.isDynamicLayoutContainer) {
        return ''
      }
      let slots = _.get(item, '_value.slots') || _.get(item, 'slots')
      if (!slots) {
        try {
          const paragraphType = _.get(item, '_type') || _.get(item, 'title')
          if (paragraphType) {
            const paragraphSchema = ResourceService.getParagraphSchema(paragraphType)
            const layoutSlots = _.get(paragraphSchema, 'layout.slots')
            if (layoutSlots) {
              slots = layoutSlots
            }
          }
        } catch {
          // Silent fallback
        }
      }
      if (!slots) {
        slots = 2
      }
      return `${slots}/${this.parentSlots}`
    },
    convertParagraph(item) {
      item._type = item.showConvert
      delete item.showConvert
      this.getSchemaForItems()
    },
    validateField () {
      return this.schema.required && _.get(this.items, 'length', 0) === 0 ? false : true
    },
    onHighlightParagraph(level, index) {
      this.highlight.level = level
      this.highlight.index = index
    },
    isHighlighted(idx) {
      return this.paragraphLevel === this.highlight.level && idx === this.highlight.index
    },
    async getSubResources() {
      await pAll(_.map(this.types, type => {
        return async () => {
          try {
            await this.requestResourcesForParagraph(type)
          } catch (error) {
            console.error(`Failed to get extra resource ${type.source}`, error)
          }
        }
      }), {concurrency: 1})
      this.subResourcesLoaded = true
    },
    getTypes() {
      this.types = _.compact(_.map(_.get(this, 'schema.types', []), (type)=> {
        let schema = false
        schema = ResourceService.getParagraphSchema(type)
        if (schema) {
          schema.input = 'group'
          schema.label = _.get(schema, 'displayname', schema.title)
          schema.field = schema.title
        } else {
          console.error(`Couldn't get schema for paragraph type ${type}`)
        }
        return schema
      }))
    },
    getSchemaForItems() {
      this.items = _.map(this.items, (item)=> {
        if (!_.get(item, 'input', false) || !_.get(item, 'label', false)) {
          if (this.schema.localised) {
            item.localised = true
          }
          const foundParagraphType = _.find(this.types, {field: item._type})
          if (!_.isUndefined(foundParagraphType)) {
            return _.extend(_.omit(foundParagraphType, ['_value', '_type']), {
              _value: _.omit(item, '_type')
            })
          }
          const fieldName = _.get(this.schema, 'originalModel', _.get(this.schema, 'model', 'not-found'))
          console.error(`Paragraph of type ${item._type} is not allowed in field '${fieldName}', will show option to convert to`,_.get(this, 'schema.types', []))
          item.showConvert = _.get(this.types, '[0].title', false)
          if (!item.showConvert) {
            item.cannotConvert = true
          }
        }
        return item
      })
      // console.warn('getSchemaForItems ----', this.items, this.schema.model)
    },
    blockMoreItems() {
      return (this.disabled || this.schema.disabled) || (this.maxCount !== -1 && this.items.length >= this.maxCount)
    },
    onError (error) {
      console.error('ParagraphView - error', error)
    },
    validate () {
      _.each(this.$refs.vfg, vfg => {
        if (!vfg.validate()) {
          this.errors = vfg.errors
          throw new Error('group validation error')
        }
      })
      return true
    },
    getSchema (item, index) {
      let schemaItems = []
      const {resource, locale, userLocale, disabled} = this.schema
      if (item.input === 'group') {
        schemaItems = _.map(item.schema, schemaItems => {
          let paragraphKey = `${this.paragraphLevel > 1 ? this.schema.paragraphKey : this.schema.model}[${index}].${schemaItems.field}`
          return _.extend({}, schemaItems, {
            field: `_value.${schemaItems.field}`,
            paragraphKey,
            paragraphType: item.title,
            localised: _.get(schemaItems, 'localised', false),
            label: schemaItems.label || schemaItems.field
          })
        })
      } else {
        schemaItems.push(_.extend({}, item, {
          field: '_value',
          localised: this.schema.localised
        }))
      }
      let extraSources = _.isString(item.source) ? _.get(ResourceService.getSchema(item.source), 'extraSources', {}) : {}
      const fields = SchemaService.getSchemaFields(schemaItems, resource, locale, userLocale, disabled, extraSources, this.schema.rootView || this)
      const groups = SchemaService.getNestedGroups(resource, fields, 0, null, '_value.')
      return {fields: groups}
    },
    getAttachment (fileItemId, field) {
      const attach = _.find(this.model._attachments, {_fields: {fileItemId}})
      return field ? _.get(attach, field) : attach
    },
    onChangeType (type) {
      const foundType = _.find(this.types, {label: type})
      if (_.isUndefined(foundType)) {
        console.warn(`No type found for ${type} in types:`, this.types)
        return
      }
      this.selectedType = foundType
    },
    async requestResourcesForParagraph(paragraph) {
      // NOTE: Requests additional resources
      await pAll(_.map(paragraph.schema, (field)=> {
        return async () => {
          if (_.includes(['select', 'multiselect'], _.get(field, 'input', false)) && _.isString(_.get(field, 'source', false))) {
            const result = ResourceService.get(field.source)
            if (_.isUndefined(result)) {
              await ResourceService.cache(field.source)
            }
          }
        }
      }), {concurrency: 5})
    },
    async onClickAddNewItem () {
      if (!this.selectedType) {
        return
      }
      const newItem = _.cloneDeep(this.selectedType)
      await this.requestResourcesForParagraph(newItem)
      this.items.push(newItem)
      this.updateItems()
    },
    findIds (obj) {
      const ids = []
      _.each(obj, (value, key) => {
        if (key === 'id') {
          return ids.push(value)
        }
        if (_.isPlainObject(value) || _.isArray(value)) {
          ids.push(...this.findIds(value))
        }
      })
      return ids
    },
    onClickRemoveItem (item) {
      let attachments = _.get(this.model, '_attachments', [])
      if (_.includes(['image', 'file', 'group'], item.input)) {
        _.each(this.findIds(item), fileItemId => {
          attachments = _.reject(attachments, {_fields: {fileItemId}})
        })
      }
      _.set(this.model, '_attachments', attachments)
      this.items = _.difference(this.items, [item])
      this.key = uuid()
      this.updateItems()
    },
    onEndDrag () {
      this.key = uuid()
      this.updateItems()
    },
    onModelUpdated (value, model, paragraphIndex) {
      if (value instanceof Event) {
        return
      }
      _.set(this.items, `[${paragraphIndex}].${model}`, value)
      this.updateItems()
    },
    updateItems() {
      // console.warn('updateItems before ', _.cloneDeep(this.items))
      const items = _.map(this.items, (item)=> {
        const obj = _.get(item, '_value', {})
        obj._type = item.title
        return obj
      })
      this.$emit('input', items, this.schema.model)
    },
    toggleMultipleDropZone() {
      this.showMultipleDropZone = !this.showMultipleDropZone
    },
    onDragEnter(event) {
      event.preventDefault()
      this.isDragOver = true
    },
    onDragOver(event) {
      event.preventDefault()
      this.isDragOver = true
    },
    onDragLeave(event) {
      event.preventDefault()
      this.isDragOver = false
    },
    onDropFiles(event) {
      event.preventDefault()
      this.isDragOver = false
      const files = Array.from(event.dataTransfer.files)
      this.processFiles(files)
    },
    onSelectFiles(event) {
      const files = Array.from(event.target.files)
      this.processFiles(files)
      // Clear the input so the same file can be selected again
      event.target.value = ''
    },
    async processFiles(files) {
      // Process files sequentially to avoid race conditions
      for (const file of files) {
        await this.processSingleFile(file)
        // Small delay to ensure DOM updates are complete
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    },
    async processSingleFile(file) {
      const extension = '.' + file.name.split('.').pop().toLowerCase()
      const matchingTypes = this.fileImageTypesMap[extension]
      const mapping = _.get(this.schema, 'options.mapping', {})
      let paragraphConfig = null
      if (matchingTypes && matchingTypes.length > 0) {
        // Use the first matching type from mapping
        paragraphConfig = matchingTypes[0]
      } else if (_.has(mapping, 'default')) {
        // Use default mapping if no specific extension mapping found
        paragraphConfig = {
          type: mapping.default._type,
          field: mapping.default.field
        }
      }
      if (paragraphConfig) {
        // Find the paragraph type in our available types
        const paragraphType = _.find(this.types, { title: paragraphConfig.type })
        if (paragraphType) {
          console.warn(`Processing file ${file.name} for field ${paragraphConfig.field}`)
          await this.createParagraphWithFile(paragraphType, file, paragraphConfig.field)
        } else {
          console.warn(`Paragraph type ${paragraphConfig.type} is not an existing paragraph resource type, ignoring file: ${file.name}`)
          this.$emit('notify', `Paragraph type ${paragraphConfig.type} is not available for file: ${file.name}`)
        }
      } else {
        console.warn(`No paragraph type found for file extension: ${extension}`)
        this.$emit('notify', `No paragraph type supports files with extension: ${extension}`)
      }
    },
    async createParagraphWithFile(paragraphType, file, targetField) {
      const newItem = _.cloneDeep(paragraphType)
      // Only set title if we're NOT setting an image field (to avoid overwriting the image field)
      const titleField = _.find(newItem.schema, field => field.field === 'title')
      if (titleField && targetField !== 'image') {
        const fileName = file.name.split('.').slice(0, -1).join('.')
        _.set(newItem, '_value.title', fileName)
      }
      await this.requestResourcesForParagraph(newItem)
      this.items.push(newItem)
      this.updateItems()
      // Wait for the component to be fully rendered
      await this.$nextTick()
      // Trigger file processing on the target field
      // Use the current index of the newly added item (length - 1)
      const currentItemIndex = this.items.length - 1
      console.warn(`Creating paragraph with file ${file.name} at index ${currentItemIndex}`)
      this.triggerFileUpload(targetField, file, currentItemIndex)
    },
    triggerFileUpload(targetField, file, itemIndex) {
      // console.warn(`Triggering file upload for field: ${targetField} in item ${itemIndex}`)
      // Use a more targeted approach with setTimeout to ensure components are mounted
      setTimeout(() => {
        const success = this.findAndTriggerFileValidation(targetField, file, itemIndex)
        if (!success) {
          console.warn(`Could not trigger file validation for field: ${targetField}. Trying alternative method...`)
          const altSuccess = this.findAndTriggerFileValidationByRef(targetField, file, itemIndex)
          if (!altSuccess) {
            console.warn(`Alternative method also failed. Trying synthetic file input...`)
            this.triggerSyntheticFileInput(targetField, file, itemIndex)
          }
        }
      }, 200) // Increased delay to ensure components are fully mounted and rendered
    },
    findAndTriggerFileValidation(targetField, file, itemIndex) {
      try {
        const paragraphItems = this.$el.querySelectorAll('.v-card.item')
        if (paragraphItems && paragraphItems[itemIndex]) {
          const paragraphElement = paragraphItems[itemIndex]
          const fieldWrappers = paragraphElement.querySelectorAll('.field-wrapper')
          for (let wrapper of fieldWrappers) {
            const labels = wrapper.querySelectorAll('label, .field-label')
            const fieldMatches = _.some(labels, label => {
              const labelText = label.textContent || label.innerText || ''
              return labelText.toLowerCase().includes(targetField.toLowerCase())
            })
            if (fieldMatches) {
              const filesToPass = [file]
              const refInputElements = wrapper.querySelectorAll('*')
              for (let element of refInputElements) {
                if (element.__vueParentComponent || element.__vue__ || element._vnode) {
                  const vueInstance = element.__vueParentComponent || element.__vue__ || element._vnode?.component
                  if (vueInstance) {
                    if (_.get(vueInstance, 'ctx.onUploadChanged', false)) {
                      vueInstance.ctx.onUploadChanged(filesToPass)
                    return true
                    } else if (_.get(vueInstance, 'exposed.onUploadChanged', false)) {
                      vueInstance.exposed.onUploadChanged(filesToPass)
                      return true
                    } else if (_.get(vueInstance, 'setupState.onUploadChanged', false)) {
                      vueInstance.setupState.onUploadChanged(filesToPass)
                      return true
                    }
                  }
                }
              }
              // Alternative approach: look for the v-file-input component specifically
              const fileInputComponents = wrapper.querySelectorAll('.v-file-input')
              for (let fileInputEl of fileInputComponents) {
                const vueComponent = this.findVueComponent(fileInputEl)
                if (vueComponent && vueComponent.onUploadChanged) {
                  // console.warn(`Found v-file-input component with onUploadChanged method for field: ${targetField}`)
                  vueComponent.onUploadChanged(filesToPass)
                  return true
                }
              }
            }
          }
          // Fallback: try to find by field name or data attributes
          const allInputs = paragraphElement.querySelectorAll('input[type="file"]')
          for (let input of allInputs) {
            if (input.name && input.name.includes(targetField)) {
              const vueComponent = this.findVueComponent(input)
              if (_.get(vueComponent, 'onUploadChanged', false)) {
                // console.warn(`Fallback: triggering onUploadChanged for field: ${targetField}`)
                const filesToPass = [file]
                vueComponent.onUploadChanged(filesToPass)
                return true
              }
            }
          }
        }
      } catch (error) {
        console.error('Could not find and trigger file validation:', error)
      }
      return false
    },
    findVueComponentForField(fieldWrapper, targetField) {
      const elements = fieldWrapper.querySelectorAll('*')
      for (let element of elements) {
        if (element.__vueParentComponent) {
          const component = element.__vueParentComponent
          if (_.isFunction(_.get(component, 'ctx.onUploadChanged', false)) && _.get(component, 'ctx.schema.field', []).includes(targetField)) {
            return component.ctx
          } else if (_.isFunction(_.get(component, 'exposed.onUploadChanged', false)) && _.get(component, 'exposed.schema.field', []).includes(targetField)) {
            return component.exposed
          } else if (_.isFunction(_.get(component, 'setupState.onUploadChanged', false)) && _.get(component, 'setupState.schema.field', []).includes(targetField)) {
            return component.setupState
          }
        }
        if (element.__vue__) {
          const component = element.__vue__
          if (_.isFunction(_.get(component, 'onUploadChanged', false)) && _.get(component, 'schema.field', []).includes(targetField)) {
            return component
          }
        }
      }
      return null
    },
    findAndTriggerFileValidationByRef(targetField, file, itemIndex) {
      try {
        const paragraphItems = this.$el.querySelectorAll('.v-card.item')
        if (paragraphItems && paragraphItems[itemIndex]) {
          const paragraphElement = paragraphItems[itemIndex]
          console.warn(`Alternative method: Found paragraph element at index ${itemIndex}`)
          const fieldWrappers = paragraphElement.querySelectorAll('.field-wrapper')
          for (let wrapper of fieldWrappers) {
            const labels = wrapper.querySelectorAll('label, .field-label')
            const fieldMatches = _.some(labels, label => {
              const labelText = label.textContent || label.innerText || ''
              return labelText.toLowerCase().includes(targetField.toLowerCase())
            })
            if (fieldMatches) {
              console.warn(`Alternative method: Found matching field wrapper for ${targetField}`)
              const filesToPass = [file]
              const parentComponent = this.findVueComponent(wrapper)
              if (parentComponent) {
                console.warn(`Alternative method: Found parent Vue component`, parentComponent)
                if (parentComponent.$refs && parentComponent.$refs.input) {
                  const inputRef = parentComponent.$refs.input
                  console.warn(`Alternative method: Found input ref`, inputRef)
                  if (inputRef.onUploadChanged) {
                    console.warn(`Alternative method: Triggering onUploadChanged via input ref`)
                    inputRef.onUploadChanged(filesToPass)
                    return true
                  }
                  if (parentComponent.onUploadChanged) {
                    console.warn(`Alternative method: Triggering onUploadChanged via parent component`)
                    parentComponent.onUploadChanged(filesToPass)
                    return true
                  }
                }
                if (parentComponent.onUploadChanged) {
                  console.warn(`Alternative method: Directly triggering onUploadChanged on parent`)
                  parentComponent.onUploadChanged(filesToPass)
                  return true
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn('Alternative method failed:', error)
      }
      return false
    },
    triggerSyntheticFileInput(targetField, file, itemIndex) {
      try {
        // Look for the specific paragraph item by index
        const paragraphItems = this.$el.querySelectorAll('.v-card.item')
        if (paragraphItems && paragraphItems[itemIndex]) {
          const paragraphElement = paragraphItems[itemIndex]
          console.warn(`Synthetic method: Found paragraph element at index ${itemIndex}`)
          // Look for all field wrappers within this specific paragraph
          const fieldWrappers = paragraphElement.querySelectorAll('.field-wrapper')
          for (let wrapper of fieldWrappers) {
            // Check for field labels or other identifiers to match our target field
            const labels = wrapper.querySelectorAll('label, .field-label')
            const fieldMatches = _.some(labels, label => {
              const labelText = label.textContent || label.innerText || ''
              return labelText.toLowerCase().includes(targetField.toLowerCase())
            })
            if (fieldMatches) {
              console.warn(`Synthetic method: Found matching field wrapper for ${targetField}`)
              // Find the actual file input element
              const fileInput = wrapper.querySelector('input[type="file"]')
              if (fileInput) {
                console.warn(`Synthetic method: Found file input element`)
                // Create a synthetic file list with only one file
                const dataTransfer = new DataTransfer()
                dataTransfer.items.add(file)  // Always add only one file per call
                // Set the files property
                fileInput.files = dataTransfer.files
                // Create and dispatch a change event
                const changeEvent = new Event('change', {
                  bubbles: true,
                  cancelable: true
                })
                // Add the files to the event
                Object.defineProperty(changeEvent, 'target', {
                  value: fileInput,
                  enumerable: true
                })
                console.warn(`Synthetic method: Dispatching change event on file input with ${fileInput.files.length} file(s)`)
                fileInput.dispatchEvent(changeEvent)

                return true
              }
            }
          }
        }
      } catch (error) {
        console.warn('Synthetic method failed:', error)
      }
      return false
    },
    findVueComponent(element) {
      // Traverse up the DOM tree to find the Vue component
      let currentElement = element
      while (currentElement && currentElement.parentNode) {
        // Check for Vue 3 component instance
        if (currentElement.__vueParentComponent) {
          const component = currentElement.__vueParentComponent
          if (component.ctx && component.ctx.onUploadChanged) {
            return component.ctx
          }
          if (component.exposed && component.exposed.onUploadChanged) {
            return component.exposed
          }
          if (component.setupState && component.setupState.onUploadChanged) {
            return component.setupState
          }
        }
        // Check for Vue 2 component instance (fallback)
        if (currentElement.__vue__) {
          return currentElement.__vue__
        }
        currentElement = currentElement.parentNode
      }
      return null
    },
    getAllAcceptedTypes() {
      const mapping = _.get(this.schema, 'options.mapping', {})
      const extensions = []
      _.each(mapping, (config, key) => {
        if (key === 'default') return
        // Handle comma-separated extensions
        const keyExtensions = key.split(',').map(ext => {
          const trimmed = ext.trim().toLowerCase()
          return trimmed.startsWith('.') ? trimmed : '.' + trimmed
        })
        extensions.push(...keyExtensions)
      })
      return extensions.join(',')
    },
    getSupportedExtensions() {
      const mapping = _.get(this.schema, 'options.mapping', {})
      const extensions = []
      _.each(mapping, (config, key) => {
        if (key === 'default') return
        // Handle comma-separated extensions
        const keyExtensions = key.split(',').map(ext => {
          const trimmed = ext.trim().toLowerCase()
          return trimmed.startsWith('.') ? trimmed : '.' + trimmed
        })
        extensions.push(...keyExtensions)
      })
      return extensions.join(', ')
    }
  }
}
</script>

<style lang="scss" scoped>
@use '@a/scss/variables.scss' as *;
@use '@a/scss/mixins.scss' as *;
.paragraph-view {
  width: 100%;
  border: 2px $paragraph-top-bar-background solid;
  border-radius: 8px;
  padding: 8px;
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  /* Ensure sticky positioning context */
  overflow: visible;

  /* Create a stacking context for nested sticky elements */
  isolation: isolate;

  .paragraph-header-bar + .paragraph-content {
    padding-top: 16px;
  }
  .paragraph-content {
    flex: 1;
    /* Don't use overflow-y: auto here as it breaks sticky positioning for nested elements */
    /* Allow sticky elements to stick within this container */
    position: relative;
    /* Conditional padding-top: only when sticky header is displayed */
  }
}

.multiple-drop-zone {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 32px;
  margin: 16px 0;
  text-align: center;
  background-color: #fafafa;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover, &.drag-over {
    border-color: var(--v-theme-primary, #1976d2);
    background-color: rgba(var(--v-theme-primary-rgb, 25, 118, 210), 0.04);
  }

  .drop-zone-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .drop-zone-text {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .primary-text {
      font-size: 18px;
      font-weight: 500;
      color: var(--v-theme-on-surface, #212121);
    }

    .secondary-text {
      font-size: 14px;
      color: var(--v-theme-on-surface-variant, #757575);
    }

    .supported-types {
      font-size: 12px;
      color: var(--v-theme-on-surface-variant, #757575);
      font-style: italic;
    }
  }
}

.item {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  align-items: stretch;
  border: 2px $paragraph-top-bar-background solid;
  border-radius: 8px;
  /* Ensure nested paragraph sticky headers work */
  overflow: visible;

  .handle, .file-item-handle {
    cursor: pointer;
  }
  .handle {
    border-radius: 0px !important;
    @include h5;
  }
  .file-item-handle {
    width: 20px;
    background-color: grey;
  }

  textarea, input {
    width: 100%;
  }
  textarea {
    height: 100px;
  }
  .row {
    display: flex;
    span {
      display: block;
      width: calc(100% - 50px);
      &:first-child {
        width: 50px;
      }
    }
  }
  .item-main {
    width: 100%;
    padding: 8px;
  }
  .file-item {
    display: flex;
    margin-bottom: 10px;
    textarea {
      height: 50px;
    }
  }

  .file-item-main {
    width: 100%;

    img {
      max-width: 200px;
      max-height: 113px;
    }
  }
}
.disabled {
  pointer-events: none;
}
.add-new-item, .remove-item, .add-multiple-items {
  color: $btn-action-color !important;
  max-height: 34px;
  button {
    &:before {
      transform: translate(50%, 0);
    }
  }
  span {
    @include cta-text;
    text-transform: none;
    text-transform: uppercase !important;
    letter-spacing: 0;
  }
}
.add-btn-wrapper {
  display: flex;
  gap: 8px;

  .add-new-item, .add-multiple-items {
    background-color: $btn-action-background !important;
  }
}
.paragraph-footer, .paragraph-header, .paragraph-header-bar {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  width: 100%;
  justify-content: flex-start;
  gap: 16px;
}
.paragraph-header-bar {
  position: -webkit-sticky;
  position: sticky;
  top: calc(var(--paragraph-level, 0) * 80px); /* Stack headers based on nesting level */
  background-color: var(--v-theme-surface, white);
  border-bottom: 1px solid var(--v-theme-outline, #e0e0e0);
  padding: 16px 8px;
  margin-top: 0;
  z-index: calc(5000 - var(--paragraph-level, 0)) !important; /* Higher level headers appear on top, above other components */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px 8px 0 0;
  backdrop-filter: blur(8px);

  /* Ensure sticky positioning works in nested contexts */
  align-self: flex-start;
  width: 100%;

  /* Force sticky positioning to work */
  contain: layout style paint;

  /* Debug styles - remove after testing */
  &::before {
    content: "Level: " attr(data-paragraph-level) " CSS: " attr(data-css-level);
    position: absolute;
    top: -20px;
    left: 0;
    background: red;
    color: white;
    padding: 2px 4px;
    font-size: 10px;
    font-family: monospace;
    z-index: 9999;
    pointer-events: none;
  }
}
.paragraph-header {
  background-color: $paragraph-top-bar-background;
  color: $paragraph-top-bar-color !important;
  display: flex;
  align-items: center;
  align-content: center;
  justify-content: space-between;
  height: 34px;
  padding: 8px;
  padding-left: 16px;
  .paragraph-title {
    height: 100%;
    @include subtext;
  }
}

.item {
  @include nested-paragraphs;
}
.convert-paragraph {
  .convert-action {
    display: flex;
    align-items: flex-end;
    gap: 16px;
  }
  .error-message, .v-btn {
    @include cta-text;
  }
  .error-message {
    color: $imag-orange;
  }
  .v-btn {
    color: $btn-action-color;
    background-color: $btn-action-background;
  }
}

</style>
<style lang="scss">
@use '@a/scss/variables.scss' as *;
@use '@a/scss/mixins.scss' as *;
.paragraph-view {
  .item-main-wrapper {
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    flex: 1 0;
    /* Ensure nested sticky headers work */
    overflow: visible;

    > .v-btn {
      margin: 10px;
    }
    .field-wrapper {
      margin-bottom: 0;
    }
  }
  .paragraph-header-bar {
    .field-label {
      padding-left: 8px;
    }

    /* Make sure header items are properly aligned */
    .add-btn-wrapper {
      display: flex;
      align-items: center;
      justify-content: flex-start;

      .add-new-item {
        margin: 0;
        white-space: nowrap;
      }
    }

    /* Responsive layout for header */
    @media (max-width: 768px) {
      flex-direction: column;
      gap: 8px;

      .add-btn-wrapper {
        width: 100%;
        justify-content: center;
      }
    }
  }
  .custom-checkbox {
    margin-top: 12px;
  }
  .add-btn-wrapper {
    display: flex;
    justify-content: flex-end;
    gap: 8px;

    .add-new-item {
      margin: 0;
    }

    .add-multiple-items {
      margin: 0;
    }
  }
  .v-input {
    display: flex;
    flex-direction: column;
  }
  .v-card {
    pointer-events: auto;
    touch-action: auto;
    /* Ensure nested sticky headers work */
    overflow: visible;

    &.item {
      &.highlighted, &:hover:not(.not-highlighted) {
        @include highlight-paragraph;
      }
      &:hover {
        &:has(.v-card.item:hover) {
          @include nested-paragraphs;
          .v-card.item:hover {
            @include highlight-paragraph;
          }
        }
      }
    }
    &:not(.editor) {
      background-color: transparent;
      margin-bottom: 0;
      +.v-card.item {
        margin-top: vw(16px);
      }
    }
  }
}

// Dynamic layout styles
.paragraph-view {
  .dynamic-layout-container {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: stretch; // Make all items same height

    // Remove the default margin-bottom from items in dynamic layout
    .item {
      margin-bottom: 0 !important;
    }
    // Override the default +.v-card.item margin
    .v-card.item + .v-card.item {
      margin-top: 0 !important;
    }
    .dynamic-layout-item {
      flex-shrink: 0;
      flex-grow: 0;
      box-sizing: border-box;
      min-width: 0; // Prevent overflow
      // Ensure the item content doesn't break the layout
      .item-main {
        overflow: hidden;
      }
      // Add some visual indication for development
      &::before {
        content: attr(data-slots);
        position: absolute;
        top: 2px;
        right: 2px;
        background: rgba(0, 0, 0, 0.1);
        font-size: 10px;
        padding: 2px 4px;
        border-radius: 2px;
        color: #666;
        font-family: monospace;
        z-index: 10;
        pointer-events: none;
      }
    }

    // Responsive behavior for smaller screens
    @media (max-width: 768px) {
      .dynamic-layout-item {
        width: 100% !important;
        max-width: 100% !important;
        flex-basis: 100% !important;
      }
    }

    @media (max-width: 1024px) and (min-width: 769px) {
      .dynamic-layout-item {
        // On tablets, ensure items don't get too small
        &[style*="flex-basis: calc(8.33%"], // 1/12
        &[style*="flex-basis: calc(16.67%"], // 2/12
        &[style*="flex-basis: calc(25%"] { // 3/12
          width: calc(33.33% - 10.667px) !important;
          max-width: calc(33.33% - 10.667px) !important;
          flex-basis: calc(33.33% - 10.667px) !important;
        }
      }
    }
  }

  // Conditional padding for stacked sticky headers
  &:has(.paragraph-header-bar) .paragraph-content {
    padding-top: calc(80px * (var(--paragraph-level, 0) + 1)); /* Reserve space for all parent sticky headers */
  }
}
</style>
