const autoBind = require('auto-bind')
const path = require('path')
const _ = require('lodash')
const WebSocket = require('ws')
const ExpressManager = require('./ExpressManager')
const logger = new (require(path.join(__dirname, 'logger')))()

class UpdatesManager extends ExpressManager {
  constructor () {
    super()
    autoBind(this)
    this.pingIntervalDuration = 30000
  }

  init (cms) {
    if (cms.server) {
      logger.warn('Will init WebSocketServer')
      cms.wss = new WebSocket.WebSocketServer({ server: cms.server })
      cms.wss.on('connection', this.onConnection)
    } else {
      logger.warn('No server for WS')
    }
    this.cms = cms
  }

  onConnection(ws) {
    // console.log('WebSocket::onConnection: Client connected')
    ws.isAlive = true
    const heartbeat = setInterval(() => {
      if (ws.isAlive === false) {
        console.log('WebSocket::onPing: Killed a Zombie WebSocket')
        return ws.terminate()
      }
      this.ping(ws)
    }, this.pingIntervalDuration)
    ws.on('close', () => {
      // console.log('WebSocket::onClose: Client disconnected')
      clearInterval(heartbeat)
    })
    ws.on('message', (buffer) => {
      try {
        const data = JSON.parse(buffer)
        if (_.get(data, 'action', '???') === 'pong') {
          ws.isAlive = true
          return
        }
        console.log('Received WS message: ', data)
      } catch (error) {
        console.error('WebSocket::onMessage: Error:', error)
      }
    })
    this.ping(ws)
    // setTimeout(() => {
    //   this.broadcast('update', {resource: 'authors', _id: 'm0f2sswtjegvlp6wyavot4pk'})
    // }, 5000)
  }

  ping (ws) {
    ws.isAlive = false
    this.send(ws, { action: 'ping' })
  }

  send (ws, data) {
    try {
      ws.send(JSON.stringify(data))
    } catch (error) {
      console.error('WebSocket::send: Error:', error)
    }
  }

  broadcast (action, data) {
    this.cms.wss.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        this.send(ws, { action, data })
      }
    })
  }

}

exports = module.exports = new UpdatesManager()
