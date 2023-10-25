<template>
  <div class="plugin-page">
    <component :is="plugin.component" :component="plugin.component" />
  </div>
</template>

<script>

export default {
  props: ['plugin']
}
</script>
<style lang="scss" scoped>
@import '@a/scss/variables.scss';
.plugin-page {
  background-color: $layout-background;
}
</style>

<style lang="scss">
@import '@a/scss/variables.scss';
.plugin-page {
  .plugin-title {
    background-color: $plugin-title-background;
    padding: 16px 25px;
    h5 {
      @include h5;
      color: $plugin-title-color;
    }
  }
}
</style>
