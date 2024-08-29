<template>
  <div :class="`group nested-level-${paragraphLevel}`">
    <div class="header">
      <field-label :schema="schema" />
    </div>
    <div class="group-content">
      <custom-form
        ref="input"
        v-model:model="model"
        :schema="schema.groupOptions"
        :paragraph-level="paragraphLevel + 1"
        @error="onError"
        @input="onModelUpdated"
      />
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import AbstractField from '@m/AbstractField'

export default {
  mixins: [AbstractField],
  props: ['groupOptions', 'paragraphLevel'],
  data () {
    return {
      errors: null
    }
  },
  mounted() {
    console.warn('GROUP', this.schema)
  },
  methods: {
    onError (error) {
      console.error('Group - onError:', error)
    },
    async validate () {
      const isValid = _.get(await this.$refs.input.validate(), 'length', 0) === 0
      if (!isValid) {
        this.errors = this.$refs.input.errors
        throw new Error('group validation error')
      }
      return isValid
    },
    debouncedValidate () {
      return this.$refs.input.debouncedValidate()
    },
    clearValidationErrors () {
      return this.$refs.input.clearValidationErrors()
    },
    onModelUpdated (value, model) {
      console.warn('Group - onModelUpdated:', value, model)
      this.$emit('input', value, model)
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@a/scss/variables.scss';
.header {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  justify-content: flex-start;
  gap: 16px;
  background-color: $paragraph-top-bar-background;
  color: $paragraph-top-bar-color !important;
  display: flex;
  justify-content: space-between;
  height: 34px;
}
.group {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  align-items: stretch;
  border: 2px $paragraph-top-bar-background solid;
  border-radius: 8px;
  .group-content {
    padding: 8px 16px;
  }
  @for $i from 1 through 6 {
    $valIndex: get-level-index($i);
    &.nested-level-#{$i} {
      @include nested-paragraph-levels-border($valIndex);
      .header, .field-label {
        @include nested-paragraph-levels($valIndex);
      }
    }
  }
}
</style>
