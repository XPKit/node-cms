<template>
  <div class="field-label">
    <span v-if="schema.required" class="text-red"><strong>* </strong></span>{{ schema.label }}
  </div>
</template>

<script>
  import _ from 'lodash'

  export default {
    props: {
      schema: { type: Object, default: () => {} },
    },
    methods: {
      getHint () {
        return _.get(this.schema, 'hint', '')
      }
    }
  }
</script>

<style lang="scss" scoped>
@use '@a/scss/variables.scss' as *;
@use '@a/scss/mixins.scss' as *;

.field-label {
  @include subtext;
  padding-left: 16px;
  color: $field-label-color;
  .v-icon {
    margin-top: -8px;
  }
}
</style>
