<template>
  <div id="updates-notifier">
    <div v-if="debug" class="debug">
      <div class="status">
        <label> {{ $filters.translate('TL_WS_UPDATES_CONNECTION_STATUS') }}:</label>
        <span>{{ $filters.translate(getConnectionStatus()) }}</span>
      </div>
      <div class="messages">{{ receivedUpdate }}</div>
    </div>
    <div class="update-notification">
      <!-- :type="isSameRecord() ? 'warning' : 'info'" -->
      <v-alert
        v-if="receivedUpdate"
        variant="flat"
        max-width="400"
        :title="$filters.translate(getTitle(receivedUpdate))" density="compact"
        :close-label="$filters.translate('TL_WS_UPDATES_CLOSE')" closable
      >
        <div class="description" v-html="$filters.translate(getDescription(receivedUpdate))" />
        <v-btn rounded compact variant="flat" size="small" @click="reloadResource()">{{ $filters.translate('TL_WS_UPDATES_RELOAD') }}</v-btn>
      </v-alert>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import LoginService from '@s/LoginService'

export default {
  props: {
    selectedResource: {
      type: Object,
      default: ()=> {}
    },
    selectedRecord: {
      type: [Object, Boolean],
      default: ()=> {}
    }
  },
  data() {
    return {
      debug: false,
      client: null,
      connecting: null,
      heatbeat: null,
      isConnecting: false,
      isConnected: false,
      reconnectAfter: 500,
      pingIntervalDuration: 30000,
      pingDelay: 5000,
      receivedUpdate: false
    }
  },
  mounted() {
    this.connectToWebsocketServer()
  },
  methods: {
    reloadResource() {
      this.$emit('reloadResource', _.get(this.receivedUpdate, 'data._id', false))
      this.receivedUpdate = false
      this.$forceUpdate()
    },
    recordOrResource() {
      return this.isSameRecord() ? 'RECORD' : 'RESOURCE'
    },
    getTitle() {
      return `TL_WS_UPDATES_${this.recordOrResource()}_TITLE`
    },
    getDescription() {
      return `TL_WS_UPDATES_${this.recordOrResource()}_DESCRIPTION`
    },
    isSameRecord() {
      return _.get(this.receivedUpdate, 'data._id', '?') === _.get(this.selectedRecord, '_id', '??')
    },
    getConnectionStatus() {
      if (this.isConnecting) {
        return 'TL_WS_UPDATES_CONNECTING'
      } else if (this.isConnected) {
        return 'TL_WS_UPDATES_CONNECTED'
      }
      return 'TL_WS_UPDATES_RECONNECTING'
    },
    connectToWebsocketServer() {
      const url = `${window.location.origin.replace(/^(http)/, 'ws')}/_updates`
      // console.warn(`Will connect to ${url}`)
      this.client = new WebSocket(url)
      _.each(['onopen', 'onclose', 'onmessage'], (key)=> this.client[key] = this[key])
    },
    onclose () {
      // console.info('Websocket - onclose')
      this.isConnecting = false
      this.isConnected = false
      clearTimeout(this.heatbeat)
      clearTimeout(this.connecting)
      this.connecting = setTimeout(async () => {
        await this.connectToWebsocketServer()
      }, this.reconnectAfter)
    },
    onopen () {
      // console.info('Websocket - onopen')
      this.onHeartbeat()
      this.isConnecting = false
      this.isConnected = true
    },
    isFromSelf(msg) {
      const user = _.get(LoginService, 'user', {})
      return _.get(msg, 'data._updatedBy', false) === `${user.group}~${user.username}`
    },
    onmessage (event) {
      const msg = JSON.parse(event.data)
      if (!_.get(msg, 'action', false)) {
        return console.info('ws msg received without action:', msg)
      } else if (msg.action === 'ping') {
        return this.pong()
      } else if (msg.action === 'update') {
        if (this.isFromSelf(msg)) {
          // console.warn('msg from self', msg, LoginService.user)
          return
        }
        console.warn('received msg', msg)
        if (_.get(msg, 'data.resource', false) && msg.data.resource === this.selectedResource.name) {
          console.warn(`same ${this.isSameRecord(msg) ? 'record' : 'resource'} was edited`)
          this.receivedUpdate = msg
        }
      }
    },
    send (data) {
      try {
        this.client.send(JSON.stringify(data))
      } catch (error) {
        console.error('WebSocket::send: Error:', error)
      }
    },
    pong () {
      // console.info('WebSocket::pong: Responded')
      this.send({ action: 'pong' })
      this.onHeartbeat()
    },
    onHeartbeat () {
      clearTimeout(this.heatbeat)
      this.heatbeat = setTimeout(() => {
        console.info('WebSocket::onHeartbeat: Timeout')
        this.client.close()
      }, this.pingIntervalDuration + this.pingDelay)
    }
  }
}
</script>

<style lang="scss">
@use '@a/scss/variables.scss' as *;
@use '@a/scss/mixins.scss' as *;
#updates-notifier {
  .debug {
    background: aqua;
    position: absolute;
    top: 16px;
    right: 16px;
    border: 2px solid black;
    margin: 16px;
    padding: 8px 16px;
    z-index: 4200;
  }
}
.update-notification {
  position: absolute;
  top: 74px;
  left: 50%;
  // max-width: 25vw;
  transform: translate(-50%, 0);
  z-index: 4200;
  display: flex;
  flex-direction: column;
  gap: 8px;
  .v-btn {
    margin-top: 8px;
  }
  .v-alert-title {
    @include cta-text;
  }
  .v-alert__content {
    @include small-cta-text;
  }
  .v-alert-title {
    @include h5;
  }
}
</style>
