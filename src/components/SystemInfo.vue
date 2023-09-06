<template>
  <div class="system-info">
    <v-menu content-class="system-info-menu" offset-y :close-on-content-click="false">
      <template #activator="{ on, attrs }">
        <v-btn icon v-bind="attrs" v-on="on">
          <v-icon>mdi-cog-outline</v-icon>
        </v-btn>
      </template>
      <div class="system-info-wrapper">
        <div class="theme-switch">
          <div class="theme-switch-container">
            <v-icon>mdi-theme-light-dark</v-icon>
            <v-switch :input-value="getTheme()" compact dense hide-details solo @change="onChangeTheme" />
          </div>
        </div>
        <div class="node-cms-title flex">
          {{ 'TL_SYSTEM' | translate }}
          <v-btn v-if="showLogoutButton" color="error" small @click="logout()"><v-icon small color="black">mdi-link-variant-off</v-icon>{{ 'TL_LOGOUT' | translate }}</v-btn>
        </div>
        <div class="stats cpu">
          <div class="node-cms-title"><small><b>CPU Usage</b></small></div>
          <v-progress-linear color="#6af" rounded :value="system.cpu.usage" />
          <small class="text">{{ system.cpu.count }} cores ({{ system.cpu.model }})</small>
        </div>
        <div class="stats ram">
          <div class="node-cms-title"><small><b>Memory Usage</b></small></div>
          <v-progress-linear color="#6af" rounded :value="100 - system.memory.freeMemPercentage" />
          <small class="text">{{ convertBytes(system.memory.usedMemMb) }} / {{ convertBytes(system.memory.totalMemMb) }}</small>
        </div>
        <div v-if="system.drive != 'not supported'" class="stats drive">
          <div class="node-cms-title"><small><b>Disk Usage</b></small></div>
          <v-progress-linear color="#6af" rounded :value="100 - system.drive.usedPercentage" />
          <small class="text">{{ convertBytes(system.drive.usedGb * 1024) }} / {{ convertBytes(system.drive.totalGb * 1024) }}</small>
        </div>
        <div class="stats two-by-two">
          <div v-if="system.network != 'not supported'" class="stats network">
            <div class="node-cms-title"><small><b>Network Usage</b></small></div>
            <small class="text">{{ convertBytes(system.network.total.outputMb) }} <v-icon>mdi-arrow-up</v-icon> / {{ convertBytes(system.network.total.inputMb) }} <v-icon>mdi-arrow-down</v-icon></small>
          </div>
          <div class="stats uptime">
            <div class="node-cms-title"><small><b>Uptime</b></small></div>
            <small class="text">{{ timeAgo(system.uptime) }}</small>
          </div>
        </div>
      </div>
    </v-menu>
  </div>
</template>

<script>
import _ from 'lodash'
import Dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import TranslateService from '@s/TranslateService'
import WebsocketService from '@s/WebsocketService'
import LoginService from '@s/LoginService'
Dayjs.extend(relativeTime)

export default {
  props: {
    config: {
      type: [Object, Boolean],
      default: false
    }
  },
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
    }
  },
  async mounted () {
    WebsocketService.events.on('getSystemInfo', (system) => {
      this.system = system
      this.$forceUpdate()
    })
    await WebsocketService.init(this.config)
    this.getSystemData()
  },
  destroyed () {
    this.destroyed = true
    clearTimeout(this.timer)
  },
  methods: {
    getTheme () {
      return _.get(LoginService, 'user.theme', 'light') === 'dark'
    },
    async onChangeTheme (value) {
      await LoginService.changeTheme(value)
      this.$vuetify.theme.dark = value
    },
    async logout () {
      await LoginService.logout()
    },
    async getSystemData () {
      try {
        WebsocketService.send({action: 'getSystemInfo'})
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
      return Dayjs().subtract(parseInt(current, 10), 'second').fromNow()
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
.system-info {
  position: sticky;
  padding: 4px;
  box-sizing: border-box;
  font-size: 11.2px;
  font-weight: 400;
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
.system-info-wrapper {
  min-width: 400px;
  padding: 16px;
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
  .node-cms-title {
    &.flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  }
  .theme-switch {
    position: absolute;
    bottom: 6px;
    right: 6px;
    .theme-switch-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
  }
}
.system-info-menu {
  background-color: inherit;
}
.v-input--selection-controls {
  margin-top: 0;
}
</style>
