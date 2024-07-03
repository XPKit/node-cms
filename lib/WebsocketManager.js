const _ = require('lodash')
const autoBind = require('auto-bind')
const WebSocket = require('ws')
const path = require('path')
const logger = new (require(path.join(__dirname, 'logger')))()
const express = require('express')

class WebsocketManager {
  constructor (config, getSystemInfo, getSyslogData) {
    autoBind(this)
    this.app = express()

    this.httpd = this.app.listen(_.get(config, 'webserver.port', 9090), error => {
      if (error) {
        return logger.error(error)
      }
      logger.info(`Web server started at http://localhost:${_.get(config, 'webserver.port', 9090)}`)
    })
    this.getSystemInfo = getSystemInfo
    this.getSyslogData = getSyslogData
  }

  init () {
    logger.info('WebsocketManager - init')
    try {
      this.server = new WebSocket.WebSocketServer({ server: this.httpd })
      this.server.on('connection', this.onConnection)
    } catch (error) {
      logger.error('Failed to init WebSocker Server:', error)
    }
  }

  ping (ws) {
    ws.isAlive = false
    // logger.info('WebSocket::ping: Sent')
    this.send(ws, { action: 'ping', bearer: '9-0123456789' })
  }

  send (ws, data) {
    try {
      ws.send(JSON.stringify(data))
    } catch (error) {
      logger.error('WebSocket::send: Error:', error)
    }
  }

  onConnection (ws) {
    // logger.info('WebSocket::onConnection: Client connected')
    ws.isAlive = true
    const heartbeat = setInterval(() => {
      if (ws.isAlive === false) {
        logger.info('WebSocket::onPing: Killed a Zombie WebSocket')
        return ws.terminate()
      }
      this.ping(ws)
    }, 30000)
    ws.on('close', () => {
      // logger.info('WebSocket::onClose: Client disconnected')
      clearInterval(heartbeat)
    })
    ws.on('message', async (buffer) => {
      try {
        const data = JSON.parse(buffer)
        // logger.info('Received WS message: ', data)
        const action = _.get(data, 'action', '???')
        if (action === 'pong') {
          // logger.info('WebSocket::onPong: Received')
          ws.isAlive = true
        } else if (action === 'getSystemInfo' && !_.isUndefined(ws)) {
          this.send(ws, {action: 'getSystemInfo', data: await this.getSystemInfo()})
        } else if (action === 'syslog') {
          this.send(ws, {action: 'syslog', data: this.getSyslogData(data)})
        }
      } catch (error) {
        logger.error('WebSocket::onMessage: Error:', error)
      }
    })
    this.ping(ws)
  }

  broadcast (action, data) {
    this.server.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        this.send(ws, { action, data })
      }
    })
  }
}

exports = module.exports = WebsocketManager