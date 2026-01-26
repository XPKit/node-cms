<template>
  <div class="custom-checkbox" :class="{disabled: schema.disabled}">
    <field-label :schema="schema" />
    <div ref="input" class="switch" :class="{active: getValue()}" tabindex="-1" @click="onChange" @focus="onFieldFocus(true)" @blur="onFieldFocus(false)">
      <div class="drag" />
      <div class="labels">
        <span class="label inactive">{{ $filters.translate('TL_NO') }}</span>
        <span class="label active">{{ $filters.translate('TL_YES') }}</span>
      </div>
    </div>
    <div v-if="showHint()" class="help-block">
      <v-icon size="small" icon="$information" />
      <span>{{ schema.options.hint }}</span>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import AbstractField from '@m/AbstractField'

export default {
  mixins: [AbstractField],
  methods: {
    getValue() {
      const value = _.get(this.model, this.schema.model, false)
      return _.isNull(value) ? false : value
    },
    onChange() {
      if (this.disabled) {
        return
      }
      this._value = !this.getValue()
      this.$emit('input', this._value, this.schema.model)
    },
  },
}
</script>

<style lang="scss" scoped>
@use '@a/scss/variables.scss' as *;
@use '@a/scss/mixins.scss' as *;
  .custom-checkbox {
    .switch {
      position: relative;
      width: 80px;
      height: 32px;
      left: 4px;
      border-radius: 100px;
      border: 2px solid $switch-field-border-color;
      background-color: $switch-field-background;
      color: $switch-field-color;
      cursor: pointer;
      .drag {
        width: 24px;
        height: 24px;
        border-radius: 100px;
        background-color: $switch-field-drag-background;
        position: absolute;
        top: 2px;
        left: auto;
        right: 2px;
        transition: transform 0.3s;
      }
      .labels {
        padding: 0px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 28px;
        user-select: none;
      }
      .label {
        @include subtext;
        opacity: 1;
        font-weight: 700;
        transition: opacity 0.3s;
        &.active {
          opacity: 0;
        }
      }
      &.active {
        background-color: $switch-field-active-background;
        color: $switch-field-active-color;
        right: auto;
        .drag {
          background-color: $switch-field-active-drag-background;
          transform: translateX(-200%);
        }
        .label {
          &.active {
            opacity: 1;
          }
          &.inactive {
            opacity: 0;
          }
        }
      }
    }
      &.disabled {
        pointer-events: none;
        touch-action: none;
        opacity: 0.5;
      }
  }
</style>
