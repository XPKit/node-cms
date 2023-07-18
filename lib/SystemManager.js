const _ = require('lodash')
const osu = require('node-os-utils')
const autoBind = require('auto-bind')
const path = require('path')
const ExpressManager = require('./ExpressManager')
const WebsocketManager = require('./WebsocketManager')
const cpu = osu.cpu
const mem = osu.mem
const netstat = osu.netstat
const drive = osu.drive
const logger = new (require(path.join(__dirname, 'logger')))()

class SystemManager extends ExpressManager {
  constructor () {
    super()
    autoBind(this)
    this.server = this.app.listen(_.get(this.options, 'webserver.port', 9090), error => {
      if (error) {
        return logger.error(error)
      }
      logger.info(`Web server started at http://localhost:${this.server.address().port}`)
    })
    this.websocketServer = new WebsocketManager(this.server, this.getSystem)
  }

  init (cms, options) {
    this.cms = cms
    this.options = options
    this.app.get('/api/system', this.onGetSystem)
  }

  async getSystem () {
    let driveUsage = 'not supported'
    try {
      driveUsage = await drive.used()
    } catch (e) {}
    let cpuUsage = 0
    try {
      cpuUsage = await cpu.usage()
    } catch (e) {}
    let memory = 0
    try {
      memory = await mem.info()
    } catch (e) {}
    let network = 'not supported'
    try {
      network = await netstat.inOut()
    } catch (e) {}
    return {
      cpu: {
        count: cpu.count(),
        usage: cpuUsage,
        model: cpu.model()
      },
      memory: memory,
      network: network,
      drive: driveUsage,
      uptime: Math.floor(process.uptime())
    }
  }

  async onGetSystem (req, res, next) {
    res.json(await this.getSystem())
  }
}

exports = module.exports = new SystemManager()
