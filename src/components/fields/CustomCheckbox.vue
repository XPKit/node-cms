<template>
  <div class="custom-checkbox">
    <div class="field-label">{{ schema.label }}</div>
    <div ref="input" class="switch" :class="{active: getValue()}" @click="onChange">
      <div class="drag" />
      <div class="labels">
        <span class="label inactive">{{ 'TL_NO' | translate }}</span>
        <span class="label active">{{ 'TL_YES' | translate }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import AbstractField from '@m/AbstractField'

export default {
  mixins: [AbstractField],
  methods: {
    getValue () {
      const value = _.get(this.model, this.schema.model, false)
      return _.isNull(value) ? false : value
    },
    onChange () {
      this.value = !this.getValue()
      this.$emit('input', this.value, this.schema.model)
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@a/scss/variables.scss';
  .custom-checkbox {
    .switch {
      position: relative;
      width: 80px;
      height: 32px;
      border-radius: 100px;
      border: 2px solid $switch-field-border-color;
      background-color: $switch-field-background;
      color: $switch-field-color;
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
        left: 4px;
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
  }
</style>
