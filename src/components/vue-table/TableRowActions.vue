<template>
  <div class="vue-table-generator-field table-column-actions">
    <v-btn small icon @click="edit(row)"><v-icon>mdi-note-edit-outline</v-icon></v-btn>
    <v-btn small class="delete-btn" icon @click="remove(row)"><v-icon>mdi-trash-can</v-icon></v-btn>
  </div>
</template>

<script>

export default {
  props: ['row', 'column', 'rowIndex', 'edit', 'remove']
}
</script>

<style lang="scss" scoped>
@import '@a/scss/variables.scss';
.table-column-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  .v-icon {
    color: $table-row-icon-color;
  }
}
</style>
