<template>
  <div v-if="schema != null" class="vue-form-generator">
    <fieldset v-if="schema.fields">
      <!-- <div v-for="field in schema.fields" :key="field.model" class="field-wrapper" :class="{focused: field.focused === -1}"> -->
      <div v-for="field in schema.fields" :key="field.model" class="field-wrapper" :class="{focused: true}">
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
  props: ['schema', 'model', 'row', 'formOptions', 'disabled'],
  created () {
    _.each(this.schema.fields, (field) => {
      const fieldType = this.getFieldType(field)
      if (!(fieldType in Vue.options.components)) {
        console.error(`${fieldType} isn't defined as a custom field type, will not render it`)
      }
      field.focused = false
    })
    FieldSelectorService.events.on('select', (field) => {
      // console.warn('RECEIVED FIELD', field)
      _.each(this.schema.fields, (f) => {
        f.focused = f.model === `${f.localised ? `${TranslateService.locale}.` : ''}${field.field}`
        if (f.focused) {
          // NOTE: Used to trigger watch in AbstractField
          setTimeout(() => {
            f.focused = -1
            this.$forceUpdate()
          }, 1)
        }
      })
      this.$forceUpdate()
    })
  },
  methods: {
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
  // border: 10px solid transparent;
  background-color: transparent;
  &.focused {
    // animation: borderPulse 0.3s;
    // background-color: rgba(0, 153, 255, 0.5);

    // animation: backgroundPulse 0.3s;

  }
}
@keyframes borderPulse {
  0% {
    border-color: transparent;
  }
  50% {
    // TODO: hugo change color later
    border-color: rgba(0, 153, 255, 0.5);
  }
  100% {
    border-color: transparent;
  }
}
@keyframes backgroundPulse {
  0% {
    background-color: transparent;
  }
  50% {
    // TODO: hugo change color later
    background-color: rgba(0, 153, 255, 0.5);
  }
  100% {
    background-color: transparent;
  }
}
</style>
