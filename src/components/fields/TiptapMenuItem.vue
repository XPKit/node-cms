<template>
  <v-btn class="menu-item" icon elevation="0" :class="{ 'is-active': isActive ? isActive(): null }" :title="title" @click.stop.prevent="action">
    <v-icon>{{ icon }}</v-icon>
  </v-btn>
</template>

<script>

export default {
  props: {
    icon: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    action: {
      type: Function,
      required: true
    },
    isActive: {
      type: Function,
      default: null
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@a/scss/variables.scss';

.menu-item {
  background: transparent;
  border: none;
  color: $wysiwyg-toolbar-color;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  cursor: pointer;

  .v-icon {
    color: $wysiwyg-toolbar-color;
    font-size: 16px;
    width: 16px;
    height: 16px;
  }
  &.is-active,
  &:hover {
    background-color: $wysiwyg-toolbar-hover-background;
    .v-icon {
      color: white;
    }
  }
}
</style>
