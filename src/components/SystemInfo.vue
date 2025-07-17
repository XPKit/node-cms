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
          <div class="node-cms-title">{{ group.title }}</div>
          <a v-for="(link, y) in group.links" :key="y" class="link" :href="link.url" target="_blank" :class="{active: isActiveLink(link.url)}">{{ link.name }}</a>
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
          <div class="stats node-cms-version">
            <small class="text">v{{ getNodeCmsVersion() }}</small>
          </div>
        </div>
      </div>
    </v-menu>
    <v-btn v-if="showLogoutButton" icon @click="logout()">
      <v-icon>mdi-logout</v-icon>
    </v-btn>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineProps, getCurrentInstance } from 'vue'
import _ from 'lodash'
import Dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import LoginService from '@s/LoginService'
import ThemeSwitch from '@c/ThemeSwitch'
import { useTheme } from 'vuetify'

Dayjs.extend(relativeTime)
const theme = useTheme()

const props = defineProps({
  config: { type: [Object, Boolean], default: false },
  settingsData: { type: [Object, Boolean], default: false }
})

const isEditing = ref(false)
const destroyed = ref(false)
const timer = ref(null)
const eventSource = ref(false)
const firstMessage = ref(true)
const system = ref({
  cpu: { count: 0, usage: 0, model: 'Unknown' },
  memory: { totalMemMb: 0, usedMemMb: 0, freeMemMb: 0, freeMemPercentage: 0 },
  network: 'not supported',
  drive: 'not supported',
  uptime: 0
})

const showLogoutButton = computed(() => !_.get(window, 'disableJwtLogin', false))

function onGetRecordEdition(editing) {
  isEditing.value = editing
}

function getNodeCmsVersion() {
  return _.get(props.config, 'version', 'X.X.X')
}

function disconnectFromLogStream() {
  try {
    clearTimeout(timer.value)
    if (eventSource.value) {
      console.warn('close SSE')
      eventSource.value.close()
    }
  } catch { /* empty */ }
}

function connectToLogStream() {
  disconnectFromLogStream()
  firstMessage.value = true
  timer.value = setTimeout(() => {
    eventSource.value = new EventSource(`${window.location.pathname}../api/system`)
    eventSource.value.onmessage = (event) => {
      try {
        if (firstMessage.value) {
          firstMessage.value = false
          if (_.isFunction(theme.change)) {
            const userTheme = LoginService.user.theme
            theme.change(userTheme)
            document.body.classList.remove('v-theme--dark', 'v-theme--light')
            document.body.classList.add(`v-theme--${userTheme}`)
          } else {
            console.error(`Cannot call theme.change:`, theme)
          }
        }
        system.value = JSON.parse(event.data)
        const instance = getCurrentInstance()
        if (instance && instance.proxy) {
          instance.proxy.$forceUpdate()
        }
      } catch (error) {
        console.error('Failed to parse system info:', error)
      }
    }
    eventSource.value.addEventListener('end', () => {
      eventSource.value.close()
      console.warn('System info stream ended')
      connectToLogStream()
    })
    eventSource.value.onerror = (error) => {
      console.error('Error in SSE connection:', error)
      eventSource.value.close()
      connectToLogStream()
    }
  }, 1000)
}

function isActiveLink(url) {
  const urlA = new URL(window.location)
  const urlB = new URL(url)
  return urlA.host === urlB.host
}

async function logout() {
  if (isEditing.value) {
    return window.DialogService.show({event: 'logout', callback: () => logout()})
  }
  await LoginService.logout()
}

function timeAgo(current) {
  return Dayjs().subtract(parseInt(current, 10), 'second').fromNow()
}

function convertBytes(megaBytes) {
  const sizes = ['MB', 'GB', 'TB']
  if (megaBytes === 0) {
    return '0 MB'
  } else if (Math.log(megaBytes) <= 0) {
    return `${megaBytes.toFixed(1)} MB`
  }
  const i = parseInt(Math.floor(Math.log(megaBytes) / Math.log(1024)))
  if (i <= 0) {
    return megaBytes + ' ' + sizes[i]
  }
  return (megaBytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i]
}

onMounted(() => {
  window.DialogService.events.on('dialog', onGetRecordEdition)
  connectToLogStream()
})

onUnmounted(() => {
  window.DialogService.events.off('dialog', onGetRecordEdition)
  if (getCurrentInstance()?.proxy?.$loading) {
    getCurrentInstance().proxy.$loading.stop('_syslog')
  }
  destroyed.value = true
  clearTimeout(timer.value)
})
</script>
<style lang="scss" scoped>
@use '@a/scss/variables.scss' as *;
@use '@a/scss/mixins.scss' as *;
.system-info {
  position: relative;
  display: flex;
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
      color: $system-info-color;
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
  @include blurred-background;
  background-color: $system-info-background;
  .node-cms-title {
    @include h6;
    color: $system-info-color;
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
      color: $system-info-color;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  }
  small {
    @include subtext;
    color: $system-info-color;
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
@use '@a/scss/variables.scss' as *;
@use '@a/scss/mixins.scss' as *;

.system-info-wrapper {
  color: $system-info-color;
  background-color: $system-info-background;
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
.node-cms-version {
  text-align: right;
}
.stats.two-by-two {
  display: flex;
  direction: row;
  align-items: stretch;
  .stats {
    width: 50%;
  }
}
</style>
