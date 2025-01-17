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
      debug: true,
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
      this.receivedUpdate = []
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
      this.client.onopen = this.onOpen
      this.client.onclose = this.onClose
      this.client.onmessage = this.onMessage
    },
    onClose () {
      // console.info('Websocket - onClose')
      this.isConnecting = false
      this.isConnected = false
      clearTimeout(this.heatbeat)
      clearTimeout(this.connecting)
      this.connecting = setTimeout(async () => {
        await this.connectToWebsocketServer()
      }, this.reconnectAfter)
    },
    onOpen () {
      // console.info('Websocket - onOpen')
      this.onHeartbeat()
      this.isConnecting = false
      this.isConnected = true
    },
    onMessage (event) {
      const msg = JSON.parse(event.data)
      if (!_.get(msg, 'action', false)) {
        console.info('ws msg received without action:', msg)
      } else if (msg.action === 'ping') {
        return this.pong()
      } else if (msg.action === 'update') {
        console.warn('received msg', msg)
        if (_.get(msg, 'data.resource', false) && msg.data.resource === this.selectedResource.name) {
          if (this.isSameRecord(msg)) {
            console.warn('same record was edited')
          } else {
            console.warn('same resource was edited')
          }
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
@import '@a/scss/variables.scss';
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
