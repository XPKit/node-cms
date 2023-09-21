<template>
  <v-checkbox class="vue-table-generator-field custom-switch" hide-details :value="selected" @change="onChange($event, row._id)" />
</template>

<script lang="jsx">
export default {
  props: ['row', 'selected', 'onChange']
}
</script>

<style lang="scss" scoped>
.custom-switch {
  margin: 0 auto;
  padding: 0;
}
</style>
