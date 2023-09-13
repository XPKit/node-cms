<template>
  <div v-if="groupedList" class="resources-content">
    <omnibar :select-resource-callback="selectResourceCallback" :grouped-list="groupedList" :selected-item="selectedItem" />
    <div class="resource-list">
      <div v-for="(resourceGroup, index) in groupedList" :key="`resource-group-${index}`" class="resource">
        <v-menu auto open-on-hover offset-y :close-on-content-click="false">
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
  computed: {
    groupedList () {
      const others = { name: 'TL_OTHERS' }
      const plugins = { name: 'TL_PLUGINS' }
      let groups = [others, plugins]
      let list = _.union(this.resourceList, _.map(this.plugins, (item) => _.extend(item, {type: 'plugin'})))
      _.each(list, (item) => {
        if (_.isEmpty(item.group)) {
          return
        }
        if (!_.isString(item.group)) {
          const oldGroup = _.find(groups, (group) => {
            if (_.isEqual(group.name, item.group)) {
              return group
            }
          })
          if (!oldGroup) {
            groups.push({ name: item.group })
          }
        }
      })
      _.each(list, (item) => {
        if (_.isEmpty(item.group)) {
          return
        }
        if (_.isString(item.group)) {
          const oldGroup = _.find(groups, (group) => {
            if (group === item.group) {
              return group
            }
            if (group.name === item.group) {
              return group
            }
            if (_.includes(_.values(group.name), item.group)) {
              return group
            }
          })
          if (!oldGroup) {
            groups.push({ name: item.group })
          }
        }
      })
      _.each(list, (item) => {
        const oldGroup = _.find(groups, (group) => {
          if (_.isEqual(group.name, item.group) || group === item.group || group.name === item.group || _.includes(_.values(group.name), item.group)) {
            return group
          }
        })
        if (oldGroup) {
          oldGroup.list = oldGroup.list || []
          oldGroup.list.push(item)
          return
        }
        if (item.type === 'plugin') {
          plugins.list = plugins.list || []
          plugins.list.push(item)
        } else {
          others.list = others.list || []
          others.list.push(item)
        }
      })
      groups = _.orderBy(groups, (item) => {
        if (item.name === 'CMS') {
          return String.fromCharCode(0x00)
        } else if (item === others) {
          return String.fromCharCode(0xff)
        }
        return `${TranslateService.get(item.name, 'enUS')}`.toLowerCase()
      }, 'asc')
      return _.filter(groups, (group) => group.list && group.list.length !== 0)
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

.v-menu__content, .v-list {
  border-radius: 0px 0px 8px 8px !important;
}

.v-menu__content {
  background-color: transparent;
  max-height: 40vh !important;
}

.v-list {
  @include blurred-background;
  transform: translate3d(0,0,0 );
  display: flex;
  padding-left: vw(16px) ;
  flex-direction: column;
  align-items: flex-start;
  .v-list-item {
    display: inline-block;
    .v-list-item__title {
      line-height: 26px;
    }
  }
}

.v-btn, .v-list-item {
  color: white;
  min-height: 26px;
  @include cta-text;
  font-weight: normal;
  font-style: normal;
  background-color: $navbar-resource-group-background;
  &.selected {
    font-weight: bold !important;
    background-color: $navbar-resource-group-background-selected;
  }
}

.v-btn {
  color: $navbar-resource-group-title-color;
}

.v-list-item {
  .v-list-item__title {
    @include cta-text;
    font-style: normal;
    color: $navbar-resource-title-color;
  }
  &.selected {
    font-weight: bold !important;
    font-size: vw(14px) !important;
    .v-list-item__title {
      color: $navbar-resource-title-color-selected;
    }
  }
}

</style>
