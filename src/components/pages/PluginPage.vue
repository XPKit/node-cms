<template>
  <div class="plugin-page">
    <component :is="plugin.component" :component="plugin.component" />
  </div>
</template>

<script>

  export default {
    props: {
      plugin: { type: Object, default: () => ({}) }
    }
  }
</script>
<style lang="scss" scoped>
@use '@a/scss/variables.scss' as *;
@use '@a/scss/mixins.scss' as *;
.plugin-page {
  background-color: $layout-background;
}
</style>

<style lang="scss">
@use '@a/scss/variables.scss' as *;
@use '@a/scss/mixins.scss' as *;
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
