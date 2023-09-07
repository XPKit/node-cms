<template>
  <div v-if="schema != null" class="vue-form-generator">
    <fieldset v-if="schema.fields">
      <!-- <div v-for="field in schema.fields" :key="field.model" class="field-wrapper" :class="{focused: field.focused === -1}"> -->
      <div v-for="field in schema.fields" :id="field.model + '-' + formId" :key="field.model" class="field-wrapper" :data-model="field.model" :class="{focused: field.focused === -1}">
        <component :is="getFieldType(field)" :key="field.model" :schema="field" :model="model" :form-options="formOptions" :disabled="disabled" :focused="field.focused" @input="onInput" />
      </div>
    </fieldset>
  </div>
</template>
<script>
import _ from 'lodash'
import FieldSelectorService from '@s/FieldSelectorService'
import TranslateService from '@s/TranslateService'

export default {
  props: ['formId', 'schema', 'model', 'formOptions', 'disabled'],
  created () {
    _.each(this.schema.fields, (field) => {
      const fieldType = this.getFieldType(field)
      if (!(fieldType in Vue.options.components)) {
        console.error(`${fieldType} isn't defined as a custom field type, will not render it`)
      }
      field.focused = false
    })
    FieldSelectorService.events.on('select', this.onFieldSelected)
  },
  beforeDestroy () {
    FieldSelectorService.events.off('select', this.onFieldSelected)
  },
  methods: {
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
      this.$emit('input', value, model)
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
