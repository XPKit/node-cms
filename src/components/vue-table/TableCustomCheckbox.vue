<template>
  <div class="checkbox">
    <v-icon small :class="{displayed: getValue()}">mdi-check-bold</v-icon>
  </div>
  <!-- <v-simple-checkbox class="vue-table-generator-field custom-checkbox" :ripple="false" :value="getValue()" /> -->
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
@import '@a/scss/variables.scss';
.checkbox {
  margin: 0 auto;
  background-color: transparent;
  border: none;
  .v-icon {
    color: $table-header-background;
  }
}
</style>
