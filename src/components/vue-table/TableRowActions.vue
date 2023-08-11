<template>
  <div class="vue-table-generator-field table-column-actions">
    <v-btn small @click="edit(row)">{{ "TL_EDIT" |translate }}</v-btn>
    <v-btn small class="delete-btn" color="node-cms-red" @click="remove(row)">{{ "TL_DELETE" |translate }}</v-btn>
  </div>
</template>

<script>

export default {
  props: ['row', 'column', 'rowIndex', 'edit', 'remove']
}
</script>

<style lang="scss" scoped>
.table-column-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
</style>
