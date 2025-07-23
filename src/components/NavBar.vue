<template>
  <div class="nav-bar-wrapper">
    <v-toolbar class="nav-bar" height="58" :class="localeClass">
      <v-toolbar-title>
        <template v-if="settingsData && hasLogoOrTitle()">
          <img v-if="getLogo()" :src="getLogo()" class="logo">
          <template v-else-if="settingsData.title && settingsData.title.length > 0">
            {{ settingsData.title }}
          </template>
        </template>
        <img v-else :src="getDefaultLogo()" class="logo">
      </v-toolbar-title>
      <v-spacer />
      <resource-list :select-resource-callback="selectResourceCallback" :grouped-list="groupedList" :selected-item="selectedItem" />
      <v-spacer />
      <system-info v-if="config" :config="config" :settings-data="settingsData" />
    </v-toolbar>
  </div>
</template>

<script>
import _ from 'lodash'
import TranslateService from '@s/TranslateService'
import SystemInfo from '@c/SystemInfo'
import ResourceService from '@s/ResourceService'
import ResourceList from '@c/ResourceList'
import defaultLogo from '@a/logo.svg'

export default {
  components: { SystemInfo, ResourceList },
  props: {
    toolbarTitle: { type: [String, Boolean], default: false },
    groupedList: { type: Array, default: () => [] },
    config: { type: [Object, Boolean], default: false },
    localeClass: { type: Object, default: () => {} },
    selectResourceCallback: { type: Function, default: () => {} },
    selectedItem: { type: Object, default: () => {} }
  },
  data () {
    return {
      settingsData: false
    }
  },
  mounted () {
    this.getSettingsData()
  },
  methods: {
    getDefaultLogo () {
      return defaultLogo
     },
    getLogo () {
      return _.get(this.settingsData, 'logo[0].url', false)
    },
    hasLogoOrTitle () {
      const title = _.get(this.settingsData, 'title', false)
      if (title) {
        window.document.title = title
      }
      return this.getLogo() || title
    },
    async getSettingsData () {
      try {
        this.settingsData = _.first(await ResourceService.cache('_settings'))
      } catch (error) {
        console.error('Failed to get settings data:', error)
      }
    },
    getSelectedItemName () {
      const displayname = _.get(this.selectedItem, 'displayname', false)
      return displayname ? TranslateService.get(displayname) : _.get(this.selectedItem, 'name', false)
    }
  }
}
</script>
<style lang="scss">
@use '@a/scss/variables.scss' as *;

.nav-bar-wrapper {
  z-index: 2001;
  .nav-bar {
    background-color: $navbar-background;
    color: $navbar-color;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    .v-toolbar__title {
      padding-left: vw(16px);
      max-height: 100%;
      max-width: 200px;
      width: 200px;
    }
    .v-toolbar__content {
      width: 100%;
    }
    .logo {
      max-width: 200px;
      max-height: $navbar-height;
    }
  }
}
</style>
