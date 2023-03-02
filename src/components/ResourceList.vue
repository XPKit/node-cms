<template>
  <div class="resources-content">
    <div class="resource-list">
      <template v-for="(group, index) in groupedList">
        <div v-if="group.list && group.list.length > 0" :key="index">
          <div class="title">{{ group.name | translate }}</div>
          <ul>
            <li v-for="item in group.list" :key="item.title" :class="{selected: item == selectedItem}" @click="select(item, 'resource')">
              <span class="icon" />{{ item.displayname ? TranslateService.get(item.displayname) : item.title }}
            </li>
          </ul>
        </div>
      </template>
    </div>
    <div class="system">
      <div class="title flex">{{ 'TL_SYSTEM' | translate }} <button v-if="showLogoutButton" @click="logout()"><i class="fi-unlink" />{{ 'TL_LOGOUT' | translate }}</button></div>
      <div class="stats cpu">
        <div class="title"><small><b>CPU Usage</b></small></div>
        <div class="progress">
          <div class="progress-bar" role="progressbar" :style="`width: ${system.cpu.usage}%`" />
        </div>
        <small class="text">{{ system.cpu.count }} cores ({{ system.cpu.model }})</small>
      </div>
      <div class="stats ram">
        <div class="title"><small><b>Memory Usage</b></small></div>
        <div class="progress">
          <div class="progress-bar" role="progressbar" :style="`width: ${100 - system.memory.freeMemPercentage}%`" />
        </div>
        <small class="text">{{ convertBytes(system.memory.usedMemMb) }} / {{ convertBytes(system.memory.totalMemMb) }}</small>
      </div>
      <div v-if="system.drive != 'not supported'" class="stats drive">
        <div class="title"><small><b>Disk Usage</b></small></div>
        <div class="progress">
          <div class="progress-bar" role="progressbar" :style="`width: ${system.drive.usedPercentage}%`" />
        </div>
        <small class="text">{{ convertBytes(system.drive.usedGb * 1024) }} / {{ convertBytes(system.drive.totalGb * 1024) }}</small>
      </div>
      <div class="stats two-by-two">
        <div v-if="system.network != 'not supported'" class="stats network">
          <div class="title"><small><b>Network Usage</b></small></div>
          <small class="text">{{ convertBytes(system.network.total.outputMb) }} <i class="fi-arrow-up" /> / {{ convertBytes(system.network.total.inputMb) }} <i class="fi-arrow-down" /></small>
        </div>
        <div class="stats uptime">
          <div class="title"><small><b>Uptime</b></small></div>
          <small class="text">{{ timeAgo(system.uptime) }}</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import _ from 'lodash'
import axios from 'axios'
import TranslateService from '@s/TranslateService'
import LoginService from '@s/LoginService'

export default {
  props: [
    'list',
    'selectedItem',
    'plugins'
  ],
  data () {
    return {
      TranslateService,
      destroyed: false,
      type: null,
      timer: null,
      system: {
        cpu: {
          count: 0,
          usage: 0,
          model: 'Unknown'
        },
        memory: {
          totalMemMb: 0,
          usedMemMb: 0,
          freeMemMb: 0,
          freeMemPercentage: 0
        },
        network: 'not supported',
        drive: 'not supported',
        uptime: 0
      }
    }
  },
  computed: {
    showLogoutButton () {
      return !_.get(window, 'disableJwtLogin', false)
    },
    groupedList () {
      const others = { name: 'TL_OTHERS' }
      const plugins = { name: 'TL_PLUGINS' }
      let groups = [others, plugins]
      let list = _.union(this.list, _.map(this.plugins, (item) => _.extend(item, {type: 'plugin'})))
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

      return groups
    }
  },
  async mounted () {
    this.getSystemData()
  },
  destroyed () {
    this.destroyed = true
    clearTimeout(this.timer)
  },
  methods: {

    async logout () {
      await LoginService.logout()
    },
    async getSystemData () {
      try {
        const response = await axios.get('../api/system')
        this.system = _.get(response, 'data', this.system)
      } catch (error) {
        console.error(error)
      }
      if (!this.destroyed) {
        this.timer = setTimeout(this.getSystemData, this.error ? 10000 : 5000)
      }
    },
    select (item) {
      this.$emit('selectItem', item)
    },
    timeAgo (current) {
      const elapsed = parseInt(current, 10)
      let secondsPerMinute = 60
      let secondsPerHour = secondsPerMinute * 60
      let secondsPerDay = secondsPerHour * 24
      let secondsPerMonth = secondsPerDay * 30

      if (elapsed < secondsPerMinute) {
        return Math.round(elapsed) + ' seconds ago'
      } else if (elapsed < secondsPerHour) {
        return Math.round(elapsed / secondsPerMinute) + ' minutes ago'
      } else if (elapsed < secondsPerDay) {
        return Math.round(elapsed / secondsPerHour) + ' hours ago'
      } else if (elapsed < secondsPerMonth) {
        return '~' + Math.round(elapsed / secondsPerDay) + ' days ago'
      } else {
        return '~' + Math.round(elapsed / secondsPerMonth) + ' months ago'
      }
    },
    convertBytes (megaBytes) {
      const sizes = ['MB', 'GB', 'TB']
      if (megaBytes === 0) {
        return '0 MB'
      }
      if (Math.log(megaBytes) <= 0) {
        return `${megaBytes.toFixed(1)} MB`
      }
      const i = parseInt(Math.floor(Math.log(megaBytes) / Math.log(1024)))
      if (i <= 0) {
        return megaBytes + ' ' + sizes[i]
      }
      return (megaBytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i]
    }
  }
}
</script>
<style lang="scss" scoped>
.resources-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  position: relative;
  .resource-list {
    flex: 1 1 0;
    overflow-y: auto;
    &:after {
      display: block;
      content: '';
    }
  }
  .system {
    position: sticky;
    padding: 4px;
    box-sizing: border-box;
    font-size: 11.2px;
    font-weight: 400;
    &:before {
      display: block;
      content: '';
      position: absolute;
      top: -1px;
      border-top: 1px solid #c7c7c7;
      width: 100%;
      left: 0;
      right: 0;
    }
    .stats {
      .text {
        text-overflow: ellipsis;
        padding: 4px;
      }
      .progress {
        margin: 0 4px;
      }
    }
    .two-by-two {
      display: flex;
      direction: row;
      align-items: stretch;
      .stats {
        width: 50%;
      }
    }
  }
  .progress {
    height: 4px;
    display: flex;
    overflow: hidden;
    line-height: 0;
    font-size: .65625rem;
    border-radius: .25rem;
    background-color: #ebedef;
    .progress-bar {
      display: flex;
      flex-direction: column;
      justify-content: center;
      overflow: hidden;
      text-align: center;
      white-space: nowrap;
      transition: width .6s ease;
      color: #fff;
      background-color: #4799eb;
    }
  }
}
button {
  user-select: none;
      display: inline-block;
    line-height: 20px;
    text-align: center;
    background: #f0f0f0;
    font-size: 12px;
    color: black;
    box-sizing: border-box;
    border: 1px solid #c7c7c7;
    cursor: pointer;
  i {
    margin-right: 5px;
  }
}
.title {
  &.flex {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

</style>
