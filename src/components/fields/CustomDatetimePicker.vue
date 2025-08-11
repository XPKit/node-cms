<template>
  <div class="date-picker-wrapper">
    <field-label :schema="schema" />
    <date-picker
      ref="input"
      v-model="_value"
      class="date-picker" :dark="theme === 'dark'"
      :enable-time-picker="enableTimePicker"
      :time-picker="!enableDatePicker && enableTimePicker"
      :enable-date-picker="enableDatePicker"
      :time-picker-inline="enableDatePicker && enableTimePicker"
      :enable-minutes="isInFormat('mm')"
      :enable-seconds="isInFormat('ss')"
      mode-height="100px"
      :day-class="getDayClass"
      :format="formatDateSelection"
      :placeholder="placeholder"
      :locale="locale"
      model-type="timestamp"
      tabindex="-1"
      @focus="onFieldFocus(true)" @blur="onFieldFocus(false)"
    />
  </div>
</template>

<script>
  import _ from 'lodash'
  import AbstractField from '@m/AbstractField'
  import Dayjs from 'dayjs'

  export default {
    mixins: [AbstractField],
    props: {
      theme: { type: String, default: 'default' },
      options: { type: Object, default: () => ({}) },
      customDatetimePickerOptions: { type: Object, default: () => ({}) }
    },
    computed: {
      placeholder() {
        const placeholder = _.get(this.schema, 'customDatetimePickerOptions.placeholder', false)
        if (!placeholder) {
          console.warn(`No placeholder found in customDatetimePickerOptions for field ${this.schema.model}, will default to 'YYYY-MM-DD'`)
          return 'YYYY-MM-DD'
        }
        return placeholder
      },
      fieldType() {
        const resourceSchema = _.get(this.schema, 'resource.schema', [])
        const foundField = _.find(resourceSchema, {field: this.schema.originalModel})
        if (!foundField) {
          return console.error(`Couldn't find field ${this.schema.originalModel} in resource schema`, resourceSchema)
        }
        return _.get(foundField, 'input', false)
      },
      enableTimePicker() {
        return this.fieldType.indexOf('time') !== -1
      },
      enableDatePicker() {
        return this.fieldType.indexOf('date') !== -1
      },
      locale() {
        return this.schema.locale === 'enUS' ? 'en' : 'zh'
      }
    },
    created () {
      this.schema.format = _.get(this.schema, 'format', 'YYYY/MM/DD h:i:s')
    },
    methods: {
      isInFormat(toFind) {
        return this.schema.format.indexOf(toFind) !== -1
      },
      getDayClass (date) {
        const tomorrow = Dayjs().startOf('day').add(1, 'day')
        if (Dayjs(date).isSame(tomorrow, 'day'))
          return 'marked-cell'
        return ''
      },
      formatDateSelection (date) {
        return Dayjs(date).format(this.schema.format)
      }
    }
  }
</script>

<style lang="scss">
@use '@a/scss/variables.scss' as *;

.date-picker {
  border-radius: 8px;
  --dp-border-radius: 8px;
  background-color: $record-editor-background;
  --dp-background-color: $record-editor-background;
  --dp-text-color: #212121;
  --dp-hover-color: #f3f3f3;
  --dp-hover-text-color: #212121;
  --dp-hover-icon-color: #959595;
  --dp-primary-color: #1976d2;
  --dp-primary-disabled-color: #6bacea;
  --dp-primary-text-color: #f8f5f5;
  --dp-secondary-color: #c0c4cc;
  --dp-border-color: #ddd;
  --dp-menu-border-color: #ddd;
  --dp-border-color-hover: #aaaeb7;
  --dp-border-color-focus: #aaaeb7;
  --dp-disabled-color: #f6f6f6;
  --dp-scroll-bar-background: #f3f3f3;
  --dp-scroll-bar-color: #959595;
  --dp-success-color: #76d275;
  --dp-success-color-disabled: #a3d9b1;
  --dp-icon-color: #959595;
  --dp-danger-color: #ff6f60;
  --dp-marker-color: #ff6f60;
  --dp-tooltip-color: #fafafa;
  --dp-disabled-color-text: #8e8e8e;
  --dp-highlight-color: rgb(25 118 210 / 10%);
  --dp-range-between-dates-background-color: var(--dp-hover-color, #f3f3f3);
  --dp-range-between-dates-text-color: var(--dp-hover-text-color, #212121);
  --dp-range-between-border-color: var(--dp-hover-color, #f3f3f3);
  &.dp__theme_dark {
    // --dp-background-color: $record-editor-background;
    --dp-text-color: #fff;
    --dp-hover-color: #484848;
    --dp-hover-text-color: #fff;
    --dp-hover-icon-color: #959595;
    --dp-primary-color: #005cb2;
    --dp-primary-disabled-color: #61a8ea;
    --dp-primary-text-color: #fff;
    --dp-secondary-color: #a9a9a9;
    --dp-border-color: #2d2d2d;
    --dp-menu-border-color: #2d2d2d;
    --dp-border-color-hover: #aaaeb7;
    --dp-border-color-focus: #aaaeb7;
    --dp-disabled-color: #737373;
    --dp-disabled-color-text: #d0d0d0;
    --dp-scroll-bar-background: #212121;
    --dp-scroll-bar-color: #484848;
    --dp-success-color: #00701a;
    --dp-success-color-disabled: #428f59;
    --dp-icon-color: #959595;
    --dp-danger-color: #e53935;
    --dp-marker-color: #e53935;
    --dp-tooltip-color: #3e3e3e;
    --dp-highlight-color: rgb(0 92 178 / 20%);
    --dp-range-between-dates-background-color: var(--dp-hover-color, #484848);
    --dp-range-between-dates-text-color: var(--dp-hover-text-color, #fff);
    --dp-range-between-border-color: var(--dp-hover-color, #fff);
  }
}

</style>
