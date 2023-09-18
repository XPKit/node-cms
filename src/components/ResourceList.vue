<template>
  <div v-if="groupedList" class="resources-content">
    <omnibar :select-resource-callback="selectResourceCallback" :grouped-list="groupedList" :selected-item="selectedItem" />
    <div class="resource-list">
      <div v-for="(resourceGroup, index) in groupedList" :key="`resource-group-${index}`" class="resource">
        <v-menu auto open-on-hover offset-y :close-on-content-click="false" content-class="resources-menu">
          <template #activator="{ on, attrs }">
            <div class="menu-btn-wrapper" v-bind="attrs" v-on="on">
              <v-btn :outlined="groupSelected(resourceGroup)" text rounded small :class="{selected: groupSelected(resourceGroup)}">
                {{ resourceGroup.name | translate }}
              </v-btn>
            </div>
          </template>
          <v-list rounded>
            <v-list-item
              v-for="resource in resourceGroup.list"
              :key="resource.name"
              dense
              :class="{selected: selectedItem === resource}"
              @click="selectResourceCallback(resource)"
            >
              <v-list-item-title>{{ getResourceTitle(resource) }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import TranslateService from '@s/TranslateService'
import Omnibar from '@c/Omnibar'

export default {
  components: {Omnibar},
  props: {
    selectResourceCallback: {
      type: Function,
      default: () => {}
    },
    groupedList: {
      type: Array,
      default: () => []
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
  mounted () {
    this.$nextTick(() => {
      if (_.isEmpty(this.selectedItem)) {
        // NOTE: Selects first resource in first group
        this.selectResourceCallback(_.first(_.get(_.first(this.groupedList), 'list', [])))
      }
    })
  },
  methods: {
    getResourceTitle (resource) {
      return resource.displayname ? TranslateService.get(resource.displayname) : resource.title
    },
    groupSelected (resourceGroup) {
      if (!this.selectedItem) {
        return false
      }
      const selectedItemGroup = _.get(this.selectedItem, 'group.enUS', _.get(this.selectedItem, 'group', false))
      const groupName = _.get(resourceGroup, 'name.enUS', resourceGroup.name)
      if (groupName === 'TL_OTHERS' && !selectedItemGroup) {
        return true
      }
      return groupName === selectedItemGroup
    }
  }
}
</script>
<style lang="scss" scoped>
@import '@a/scss/variables.scss';

.resources-content {
  flex: 1;
  display: flex;
  align-items: stretch;
  position: relative;
  .resource-list {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: $navbar-height;
    &:after {
      display: block;
      content: '';
    }
  }
}

.resource, .menu-btn-wrapper {
  height: 100%;
  display: flex;
  align-items: center;
}

.v-btn {
  min-height: 26px;
  @include cta-text;
  font-weight: normal;
  font-style: normal;
  background-color: $navbar-resource-group-background;
  color: $navbar-resource-group-title-color;
  &.selected {
    font-weight: bold !important;
    background-color: $navbar-resource-group-background-selected;
  }
}

</style>
