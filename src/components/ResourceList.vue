<template>
  <div v-if="groupedList" class="resources-content">
    <omnibar :select-resource-callback="selectResourceCallback" :grouped-list="groupedList" :selected-item="selectedItem" />
    <div class="resource-list">
      <div v-for="(resourceGroup, index) in groupedList" :key="`resource-group-${index}`" class="resource">
        <v-menu location="bottom" open-on-click :close-on-content-click="false" content-class="resources-menu" transition="false">
          <template #activator="{ props }">
            <div class="menu-btn-wrapper" v-bind="props">
              <v-btn variant="text" rounded size="small" :class="{selected: groupSelected(resourceGroup)}">
                {{ $filters.translate(resourceGroup.name) }}
              </v-btn>
            </div>
          </template>
          <v-list rounded>
            <v-list-item
              v-for="resource in orderedList(resourceGroup.list)" :key="resource.name" density="compact"
              :class="{selected: isSelected(resource)}" @click="selectResourceCallback(resource)"
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
import Omnibar from '@c/Omnibar'
import TranslateService from '@s/TranslateService'

export default {
  components: { Omnibar },
  props: {
    selectResourceCallback: { type: Function, default: () => {} },
    groupedList: { type: Array, default: () => [] },
    selectedItem: { type: Object, default: () => {} },
  },
  async mounted() {
    await this.$nextTick()
    if (_.isEmpty(this.selectedItem)) {
      // Selects first resource in first group
      this.selectResourceCallback(_.first(_.get(_.first(this.groupedList), 'list', [])))
    }
  },
  methods: {
    isSelected(resource) {
      if (_.get(resource, 'type', false) === 'plugin') {
        return _.get(resource, 'pluginComponent', false) === _.get(this.selectedItem, 'pluginComponent', false)
      }
      return this.selectedItem === resource
    },
    getResourceTitle(resource) {
      return resource.displayname ? TranslateService.get(resource.displayname) : resource.title
    },
    orderedList(list) {
      const collator = new Intl.Collator('en', {
        sensitivity: 'base',
        caseFirst: 'upper',
        usage: 'sort',
        ignorePunctuation: true,
        numeric: true,
      })
      return list.sort((a, b) => collator.compare(this.getResourceTitle(a), this.getResourceTitle(b)))
    },
    groupSelected(resourceGroup) {
      if (!this.selectedItem) {
        return false
      }
      const selectedItemGroup = _.get(this.selectedItem, 'group.enUS', _.get(this.selectedItem, 'group', false))
      const groupName = _.get(resourceGroup, 'name.enUS', resourceGroup.name)
      return groupName === 'TL_OTHERS' && !selectedItemGroup ? true : groupName === selectedItemGroup
    },
  },
}
</script>
<style lang="scss" scoped>
@use '@a/scss/variables.scss' as *;
@use '@a/scss/mixins.scss' as *;

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
    gap: 8px;
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
  font-size: clamp(14px, 14px, vw(14px));
  font-weight: normal;
  font-style: normal;
  background-color: $navbar-resource-group-background;
  color: $navbar-resource-group-title-color;
  letter-spacing: 0;
  &.selected {
    font-weight: bold !important;
    background-color: $navbar-resource-group-background-selected;
  }
}

</style>
