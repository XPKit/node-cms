<template>
  <div class="field-label"><span v-if="schema.required" class="text-red"><strong>* </strong></span>{{ getLabel() }}</div>
</template>

<script>
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
}
</style>
