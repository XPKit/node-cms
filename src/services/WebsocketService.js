import _ from 'lodash'
import autoBind from 'auto-bind'
import Emitter from 'tiny-emitter'

// TODO: hugo - to remove / disable since not used anymore
class WebsocketService {
  constructor () {
    autoBind(this)
    this.events = new Emitter()
    this.connection = null
    this.clientID = 0
    this.isConnecting = false
    this.isConnected = false
    this.connecting = false
    this.serverUrl = false
  }

  async init (config) {
    this.serverUrl = `ws://${window.location.hostname}:${_.get(config, 'webserver.port', 9090)}`
    this.connect()
  }

  connect () {
    clearTimeout(this.connecting)
    if (this.isConnecting) {
      return
    }
    this.isConnecting = true
    this.isConnected = false
    this.events.emit('connected', false)

    setTimeout(() => {
      this.client = new WebSocket(this.serverUrl, 'json')
      console.info(`Created websocket client for ${this.serverUrl}`)
      this.client.onopen = this.onOpen
      this.client.onclose = this.onClose
      this.client.onmessage = this.onMessage
    }, 150)
  }

  onClose (event) {
    console.info('Websocket - onClose', event)
    this.isConnecting = false
    this.isConnected = false
    this.events.emit('connected', false)
    clearTimeout(this.heatbeat)
    clearTimeout(this.connecting)
    this.connecting = setTimeout(async () => {
      await this.connect()
    }, 500)
  }

  onOpen (event) {
    // console.info('Websocket - onOpen', event)
    this.onHeartbeat()
    this.isConnecting = false
    this.isConnected = true
    this.events.emit('connected', true)
  }

  onMessage (event) {
    const msg = JSON.parse(event.data)
    const action = _.get(msg, 'action', '??')
    if (action === 'ping') {
      return this.pong()
    }
    this.events.emit(action, _.get(msg, 'data', {}))
  }

  pong () {
    // console.info('WebSocket::pong: Responded')
    this.send({ action: 'pong', bearer: '9-0123456789' })
    this.onHeartbeat()
  }

  send (data) {
    try {
      if (this.client) {
        this.client.send(JSON.stringify(data))
      }
    } catch (error) {
      console.error('WebSocket::send: Error:', error)
    }
  }

  onHeartbeat () {
    clearTimeout(this.heatbeat)
    this.heatbeat = setTimeout(() => {
      // console.info('WebSocket::onHeartbeat: Timeout')
      this.client.close()
    }, 30000 + 5000)
  }
}

export default new WebsocketService()
