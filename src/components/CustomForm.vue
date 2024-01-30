<template>
  <div v-if="schema != null" class="vue-form-generator">
    <fieldset v-if="schema.fields">
      <template v-if="schema.layout && schema.layout.lines">
        <div v-for="(line, i) in schema.layout.lines" :id="`${formId}-${i}`" :key="i" class="line-wrapper" :class="getLineClasses(line)">
          <div v-for="field in line.fields" :id="getFieldId(field)" :key="field.model" class="field-wrapper" :data-model="field.model" :class="getFieldClasses(field)">
            <!-- <div class="red--text">{{ getFieldType(field.schema) }}</div> -->
            <component :is="getFieldType(field.schema)" v-if="field.schema" :key="field.model" :schema="field.schema" :model="model" :form-options="formOptions" :disabled="field.schema && field.schema.disabled" :focused="field.schema.focused" @input="onInput" />
          </div>
        </div>
      </template>
      <div v-for="field in schema.fields" v-else :id="getFieldId(field)" :key="field.model" class="field-wrapper" :data-model="field.model" :class="{focused: field.focused === -1}">
        <!-- <div class="red--text">{{ getFieldType(field) }}</div> -->
        <component :is="getFieldType(field)" :key="field.model" :paragraph-level="getParagraphLevel(field)" :schema="field" :model="model" :form-options="formOptions" :disabled="field.schema && field.schema.disabled" :focused="field.focused" @input="onInput" />
      </div>
    </fieldset>
  </div>
</template>
<script>
import { getCurrentInstance } from 'vue'
import _ from 'lodash'
import FieldSelectorService from '@s/FieldSelectorService'
import TranslateService from '@s/TranslateService'

export default {
  props: ['formId', 'schema', 'model', 'formOptions', 'disabled', 'paragraphIndex', 'paragraphLevel'],
  created () {
    _.each(this.schema.fields, (field) => {
      const fieldType = this.getFieldType(field)
      if (!(fieldType in getCurrentInstance().appContext.components)) {
        console.error(`${fieldType} isn't defined as a custom field type, will not render it`)
      }
      field.focused = false
    })
    FieldSelectorService.events.on('select', this.onFieldSelected)
  },
  beforeUnmount () {
    FieldSelectorService.events.off('select', this.onFieldSelected)
  },
  methods: {
    getFieldId (field) {
      return `${_.isUndefined(field.model) ? this.getFieldType(field) : field.model}-${_.isUndefined(this.formId) ? '1' : this.formId}`
    },
    getParagraphLevel (field) {
      return _.includes(['ParagraphView', 'Group'], this.getFieldType(field)) ? this.paragraphLevel : 1
    },
    getFieldClasses (field) {
      const classes = [`width-${_.get(field, 'width', '1')}`]
      if (field.schema && field.schema.focused === -1) {
        classes.push('focused')
      }
      return classes
    },
    getLineClasses (line) {
      return [`slots-${_.get(line, 'slots', '1')}`, `nb-fields-${_.get(line, 'fields.length', 1)}`]
    },
    onFieldSelected (field) {
      _.each(this.schema.fields, (f) => {
        f.focused = f.model === `${f.localised ? `${TranslateService.locale}.` : ''}${field.field}`
        if (f.focused) {
          setTimeout(() => {
            f.focused = -1
            this.$forceUpdate()
          }, 1)
        }
      })
      this.$forceUpdate()
    },
    getFieldType (field) {
      return _.get(field, 'overrideType', _.get(field, 'type', false))
    },
    onInput (value, model) {
      if (_.isUndefined(model)) {
        model = _.get(_.first(value), 'parentKey', false)
      }
      this.$emit('input', value, model, this.paragraphIndex)
    }
  }
}
</script>

<style lang="scss" scoped>
.field-wrapper {
  box-shadow: 0px 0px 10px 0px transparent;
  &.focused {
    animation: backgroundPulse 0.5s ;
  }
}
$maxColumns: 12;
$gapBetweenFields: 16px;
.line-wrapper {
  display: flex;
  flex-wrap: wrap;
  flex-grow: 1;
  align-content: flex-start;
  align-items: flex-start;
  gap: $gapBetweenFields;
  @for $nbSlots from 1 through $maxColumns {
    @for $nbFields from 1 through $maxColumns {
      &.nb-fields-#{$nbFields} {
        &.slots-#{$nbSlots} {
          >.field-wrapper {
              @for $i from 1 through $maxColumns {
                &.width-#{$i} {
                  width: calc(100% / #{$nbSlots} * #{$i} - (#{$gapBetweenFields} / #{$nbFields} * (#{$nbFields} - 1)));
                }
              }
          }
        }
      }
    }
  }
}
@keyframes backgroundPulse {
  0% {
     box-shadow: 0px 0px 10px 0px transparent;
  }
  50% {
    box-shadow: 0px 0px 10px 5px #868686;
  }
  100% {
    box-shadow: 0px 0px 10px 0px transparent;
  }
}
</style>
