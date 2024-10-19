<template>
  <div class="field-label">
    <span v-if="schema.required" class="text-red"><strong>* </strong></span>{{ getLabel() }}
  </div>
</template>

<script>
import _ from 'lodash'

export default {
  props: {
    schema: {
      type: Object,
      default: () => {}
    }
  },
  methods: {
    getHint () {
      return _.get(this.schema, 'hint', '')
    },
    getLabel () {
      // console.warn(`Field-label - ${this.schema.label}`, this.schema)
      return this.schema.label
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@a/scss/variables.scss';

.field-label {
  @include subtext;
  padding-left: 16px;
  color: $field-label-color;
  .v-icon {
    margin-top: -8px;
  }
}
</style>
