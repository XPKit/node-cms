<template>
  <div class="system-info">
    <v-menu v-if="settingsData && settingsData.linksGroups && settingsData.linksGroups.length > 0" content-class="links-menu" location="bottom" :close-on-content-click="false" transition="slide-y-transition">
      <template #activator="{ props }">
        <v-btn icon v-bind="props">
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </template>
      <div class="links-wrapper">
        <div v-for="(group, i) in settingsData.linksGroups" :key="i" class="group">
          <div class="node-cms-title">{{ group.value.title }}</div>
          <a v-for="(link, y) in group.value.links" :key="y" class="link" :href="link.value.url" :class="{active: isActiveLink(link.value.url)}">{{ link.value.name }}</a>
          <v-divider v-if="i < settingsData.linksGroups.length - 1" />
        </div>
      </div>
    </v-menu>

    <v-menu content-class="system-info-menu" location="bottom" :close-on-content-click="false" transition="slide-y-transition">
      <template #activator="{ props }">
        <v-btn icon v-bind="props">
          <v-icon>mdi-cog-outline</v-icon>
        </v-btn>
      </template>
      <div class="system-info-wrapper">
        <div class="node-cms-title flex">
          <span>{{ $filters.translate('TL_SYSTEM') }}</span>
          <theme-switch />
        </div>
        <div class="stats cpu">
          <div class="node-cms-title"><small><b>CPU Usage</b></small></div>
          <v-progress-linear rounded :model-value="system.cpu.usage" />
          <small class="text">{{ system.cpu.count }} cores ({{ system.cpu.model }})</small>
        </div>
        <div class="stats ram">
          <div class="node-cms-title"><small><b>Memory Usage</b></small></div>
          <v-progress-linear rounded :model-value="100 - system.memory.freeMemPercentage" />
          <small class="text">{{ convertBytes(system.memory.usedMemMb) }} / {{ convertBytes(system.memory.totalMemMb) }}</small>
        </div>
        <div v-if="system.drive != 'not supported'" class="stats drive">
          <div class="node-cms-title"><small><b>Disk Usage</b></small></div>
          <v-progress-linear rounded :model-value="100 - system.drive.usedPercentage" />
          <small class="text">{{ convertBytes(system.drive.usedGb * 1024) }} / {{ convertBytes(system.drive.totalGb * 1024) }}</small>
        </div>
        <div class="stats two-by-two">
          <div v-if="system.network != 'not supported'" class="stats network">
            <div class="node-cms-title"><small><b>Network Usage</b></small></div>
            <small class="text">{{ convertBytes(system.network.total.outputMb) }} <v-icon>mdi-arrow-up</v-icon> / {{ convertBytes(system.network.total.inputMb) }} <v-icon>mdi-arrow-down</v-icon></small>
          </div>
          <div class="stats uptime">
            <div class="node-cms-title"><small><b>Uptime:</b></small> <small class="text">{{ timeAgo(system.uptime) }}</small></div>
          </div>
        </div>
      </div>
    </v-menu>
    <v-btn v-if="showLogoutButton" icon @click="logout()">
      <v-icon>mdi-logout</v-icon>
    </v-btn>
  </div>
</template>

<script>
import _ from 'lodash'
import Dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import TranslateService from '@s/TranslateService'
import WebsocketService from '@s/WebsocketService'
import LoginService from '@s/LoginService'
import ThemeSwitch from '@c/ThemeSwitch'

Dayjs.extend(relativeTime)

export default {
  components: {ThemeSwitch},
  props: {
    config: {
      type: [Object, Boolean],
      default: false
    },
    settingsData: {
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
  unmounted () {
    this.destroyed = true
    clearTimeout(this.timer)
  },
  methods: {
    isActiveLink (url) {
      const urlA = new URL(window.location)
      const urlB = new URL(url)
      return urlA.host === urlB.host
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
@import '@a/scss/variables.scss';
.system-info {
  position: sticky;
  padding: 4px;
  box-sizing: border-box;
  font-size: 11.2px;
  font-weight: 400;
  >button:last-child {
    margin-left: vw(16px);
  }
  .stats {
    font-size: 0;
    .text {
      text-overflow: ellipsis;
      padding: 4px;
    }
    .progress {
      margin: 0 4px;
    }
    .node-cms-title {
      @include h6;
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
  .v-icon {
    color: $navbar-system-info-icon-color;
  }
}
.system-info-wrapper, .links-wrapper {
  min-width: 400px;
  display: flex;
  flex-direction: column;
  @include blurred-background($dark-theme);
  .node-cms-title {
    @include h6;
  }
}
.system-info-wrapper {
  gap: 16px;
  button {
    user-select: none;
    display: inline-block;
    line-height: 20px;
    text-align: center;
    font-size: 12px;
    box-sizing: border-box;
    cursor: pointer;
    i {
      margin-right: 5px;
    }
  }
  .node-cms-title {
    &.flex {
      @include h5;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  }
  small {
    @include subtext;
  }
}
.system-info-menu, .links-menu {
  background-color: transparent;
  right: 0px;
  left: auto !important;
  width: auto;
}

.links-wrapper {
  .node-cms-title {
    font-weight: bold;
  }
}
.v-input--selection-controls {
  margin-top: 0;
}
</style>

<style lang="scss">
@import '@a/scss/variables.scss';

.system-info-wrapper {
  color: $system-info-color;
  .v-progress-linear {
    margin: 8px 0;
    .v-progress-linear__buffer {
      background-color: $system-info-progress-bar-background;
    }
    .v-progress-linear__determinate {
      border-radius: 100px;
      background-color: $system-info-progress-bar !important;
      border-color: $system-info-progress-bar !important;
    }
  }
}
.links-menu {
  .node-cms-title {
    user-select: none;
  }
  .link {
    display: block;
    @include h6;
    background-color: transparent;
    transition: background-color 0.15s;
    text-decoration: none;
    padding-left: 16px;
    border-radius: 50px;
    &:hover {
      background-color: $imag-blue;
    }
    &.active {
      font-weight: bold;
      background-color: $imag-purple;

    }
  }
  .v-divider {
    margin: 8px 0;
    border-color: black;
  }
}
</style>
