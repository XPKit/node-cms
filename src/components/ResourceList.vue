<template>
  <div v-if="groupedList" class="resources-content">
    <div class="resource-list">
      <div v-for="(resourceGroup, index) in groupedList" :key="`resource-group-${index}`" class="resource">
        <v-menu open-on-hover offset-y>
          <template #activator="{ on, attrs }">
            <v-btn :outlined="groupSelected(resourceGroup)" text small v-bind="attrs" :class="{selected: groupSelected(resourceGroup)}" v-on="on">
              {{ resourceGroup.name | translate }}
            </v-btn>
          </template>
          <v-list dense>
            <v-list-item
              v-for="resource in resourceGroup.list"
              :key="resource.name" dense
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

export default {
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
          if (_.isEqual(group.name, item.group)) {
            return group
          }
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
        if (oldGroup) {
          oldGroup.list = oldGroup.list || []
          oldGroup.list.push(item)
        } else {
          if (item.type === 'plugin') {
            plugins.list = plugins.list || []
            plugins.list.push(item)
          } else {
            others.list = others.list || []
            others.list.push(item)
          }
        }
      })
      groups = _.orderBy(groups, (item) => {
        if (item.name === 'CMS') {
          return String.fromCharCode(0x00)
        }
        if (item === others) {
          return String.fromCharCode(0xff)
        }
        return `${TranslateService.get(item.name, 'enUS')}`.toLowerCase()
      }, 'asc')
      return _.filter(groups, (group) => group.list && group.list.length !== 0)
    }
  },
  methods: {
    getResourceTitle (resource) {
      return resource.displayname ? TranslateService.get(resource.displayname) : resource.title
    },
    groupSelected (resourceGroup) {
      return this.selectedItem && resourceGroup.name === this.selectedItem.group
    }
  }
}
</script>
<style lang="scss" scoped>
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
    height: 100%;
    &:after {
      display: block;
      content: '';
    }
  }
}
.v-btn, .v-list-item {
  &.selected {
    font-weight: bold !important;
    font-size: 14px !important;
  }
}
.v-list-item.selected {
  background-color: rgba($color: #000000, $alpha: 0.25);
    font-weight: bold !important;
    font-size: 14px !important;
}

</style>
