import autoBind from 'auto-bind'
import _ from 'lodash'
import WebSocket, { WebSocketServer } from 'ws'
import ExpressManager from './ExpressManager.js'
import Logger from 'img-sh-logger'

const logger = new Logger()
class UpdatesManager extends ExpressManager {
  constructor () {
    super()
    autoBind(this)
    this.pingIntervalDuration = 30000
  }
  init (cms, options) {
    if (!options.wsRecordUpdates) {
      return logger.info('wsRecordUpdates is not enabled in configuration, will not send websocket messages on record updates')
    }
    if (!cms.server) {
      return logger.warn('No server for WS')
    }
    // logger.warn('Will init WebSocketServer for record updates')
    cms.wss = new WebSocketServer({ server: cms.server })
    cms.wss.on('connection', this.onConnection)
    this.cms = cms
  }
  heartbeat(ws) {
    if (ws.isAlive === false) {
      logger.log('WebSocket::onPing: Killed a Zombie WebSocket')
      return ws.terminate()
    }
    this.ping(ws)
  }
  onConnection(ws) {
    logger.log('WebSocket::onConnection: Client connected')
    ws.isAlive = true
    const heartbeatInterval = setInterval(() => this.heartbeat(ws), this.pingIntervalDuration)
    ws.on('close', () => {
      logger.log('WebSocket::onClose: Client disconnected')
      clearInterval(heartbeatInterval)
    })
    ws.on('message', (buffer) => {
      try {
        const data = JSON.parse(buffer)
        if (_.get(data, 'action', '???') === 'pong') {
          ws.isAlive = true
          return
        }
        logger.log('Received WS message: ', data)
      } catch (error) {
        logger.error('WebSocket::onMessage: Error:', error)
      }
    })
    this.ping(ws)
  }
  ping (ws) {
    ws.isAlive = false
    this.send(ws, { action: 'ping' })
  }
  send (ws, data) {
    try {
      ws.send(JSON.stringify(data))
    } catch (error) {
      logger.error('WebSocket::send: Error:', error)
    }
  }
  broadcast (data) {
    const clients = _.get(this.cms, 'wss.clients', false)
    if (!clients) {
      return
    }
    clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        this.send(ws, data)
      }
    })
  }
}
export default new UpdatesManager()
