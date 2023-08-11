<template>
  <v-simple-checkbox class="vue-table-generator-field custom-switch" :ripple="false" :value="getValue()" />
</template>

<script lang="jsx">
import _ from 'lodash'

export default {
  props: ['row', 'column', 'rowIndex', 'field'],
  methods: {
    getValue () {
      return _.get(this.row, this.column.field, false)
    }
  }
}
</script>

<style lang="scss" scoped>
.custom-switch {
  .v-input--selection-controls__input {
    margin: 0 auto;
  }
}
</style>
