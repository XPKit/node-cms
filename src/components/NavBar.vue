<template>
  <div class="nav-bar-wrapper">
    <v-toolbar min-width="100%" width="100%" class="nav-bar" height="58" :class="localeClass">
      <v-toolbar-title>
        <template v-if="settingsData && hasLogoOrTitle()">
          <img v-if="getLogo()" :src="getLogo()" class="logo">
          <template v-else-if="settingsData.title && settingsData.title.length > 0">
            {{ settingsData.title }}
          </template>
        </template>
        <template v-else>{{ getPageTitle() }}</template>
      </v-toolbar-title>
      <v-spacer />
      <resource-list :select-resource-callback="selectResourceCallback" :grouped-list="groupedList" :resource-list="resourceList" :plugins="plugins" :selected-item="selectedItem" />
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

export default {
  components: {SystemInfo, ResourceList},
  props: {
    toolbarTitle: {
      type: [String, Boolean],
      default: false
    },
    groupedList: {
      type: Array,
      default: () => []
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
  data () {
    return {
      settingsData: false
    }
  },
  mounted () {
    this.getSettingsData()
  },
  methods: {
    getLogo () {
      const foundLogo = _.find(_.get(this.settingsData, '_attachments', []), {_name: 'logo'})
      return _.isUndefined(foundLogo) ? false : _.get(foundLogo, 'url', '')
    },
    hasLogoOrTitle () {
      return this.getLogo() || _.get(this.settingsData, 'title', false)
    },
    async getSettingsData () {
      try {
        this.settingsData = _.first(await ResourceService.cache('_settings'))
      } catch (error) {
        console.error(error)
      }
    },
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
@import '@a/scss/variables.scss';

.nav-bar-wrapper {
  z-index: 2001;
  .v-toolbar.v-sheet {
    &.theme--light {
      background-color: $navbar-background;
      color: $navbar-color;
    }
  }
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  .v-toolbar__title {
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
</style>
