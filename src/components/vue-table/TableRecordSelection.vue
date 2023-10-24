<template>
  <div class="checkbox" :class="{'blink-background': selected}" @click="onChange(row._id, !selected)">
    <template v-if="row._local">
      <v-icon size="small" :class="{displayed: selected}">mdi-check-bold</v-icon>
    </template>
  </div>

  <!-- <v-checkbox class="vue-table-generator-field custom-checkbox" hide-details :value="selected" @change="onChange($event, row._id)" /> -->
</template>

<script lang="jsx">
export default {
  props: ['row', 'selected', 'onChange']
}
</script>

<style lang="scss" scoped>
@import '@a/scss/variables.scss';
.checkbox{
  pointer-events: auto;
  touch-action: auto;
  .v-icon {
    color: $table-header-background;

  }
}

</style>
