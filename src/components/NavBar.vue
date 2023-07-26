<template>
  <div class="nav-bar-wrapper">
    <v-toolbar min-width="100%" width="100%" class="nav-bar" :class="localeClass">
      <v-toolbar-title>{{ getPageTitle() }}</v-toolbar-title>
      <v-spacer />
      <resource-list :select-resource-callback="selectResourceCallback" :resource-list="resourceList" :plugins="plugins" :selected-item="selectedItem" />
      <v-spacer />
      <system-info v-if="config" :config="config" />
    </v-toolbar>
  </div>
</template>

<script>
import _ from 'lodash'
import TranslateService from '@s/TranslateService'
import SystemInfo from '@c/SystemInfo'
import ResourceList from '@c/ResourceList'

export default {
  components: {SystemInfo, ResourceList},
  props: {
    toolbarTitle: {
      type: [String, Boolean],
      default: false
    },
    config: {
      type: [Object, Boolean],
      default: false
    },
    localeClass: {
      type: Object,
      default: () => {}
    },
    selectResourceCallback: {
      type: Function,
      default: () => {}
    },
    resourceList: {
      type: Array,
      default: () => []
    },
    plugins: {
      type: Array,
      default: () => []
    },
    selectedItem: {
      type: Object,
      default: () => {}
    }
  },
  methods: {
    getPageTitle () {
      const nameParts = []
      if (this.toolbarTitle) {
        nameParts.push(this.toolbarTitle)
      }
      const selectedItemName = this.getSelectedItemName()
      if (selectedItemName) {
        nameParts.push(selectedItemName)
      }
      return _.join(nameParts, ' - ')
    },
    getSelectedItemName () {
      if (_.get(this.selectedItem, 'displayname', false)) {
        return TranslateService.get(this.selectedItem.displayname)
      }
      return _.get(this.selectedItem, 'name', false)
    }
  }
}
</script>
<style lang="scss">
.nav-bar-wrapper {
  z-index: 2001;
}
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  background-color: green;
  .v-toolbar__content {
    width: 100%;
  }
}
</style>
