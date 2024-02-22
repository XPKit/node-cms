<template>
  <div class="field-label">
    <v-tooltip v-if="getHint().length > 0" eager location="right">
      <template #activator="{ props }">
        <div class="test" v-bind="props"> <span v-if="schema.required" class="text-red"><strong>* </strong></span>{{ getLabel() }}<v-icon size="x-small">mdi-help-circle-outline</v-icon></div>
      </template>
      <span>{{ schema.hint }}</span>
    </v-tooltip>
    <template v-else>
      <span v-if="schema.required" class="text-red"><strong>* </strong></span>{{ getLabel() }}
    </template>
  </div>
</template>

<script>
import _ from 'lodash'

export default {
  props: {
    schema: {
      type: Object,
      default: () => {}
    },
    label: {
      type: String,
      default: () => ''
    }
  },
  methods: {
    getHint () {
      return _.get(this.schema, 'hint', '')
    },
    getLabel () {
      return this.label.length > 0 ? this.label : this.schema.label
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
