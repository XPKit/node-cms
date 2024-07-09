// const _ = require('lodash')
const osu = require('node-os-utils')
const autoBind = require('auto-bind')
const path = require('path')
const _ = require('lodash')
const ExpressManager = require('./ExpressManager')
const cpu = osu.cpu
const mem = osu.mem
const netstat = osu.netstat
const drive = osu.drive
const logger = new (require(path.join(__dirname, 'logger')))()

class SystemManager extends ExpressManager {
  constructor () {
    super()
    autoBind(this)
  }

  init (cms, options) {
    this.cms = cms
    this.options = options
    this.clients = []
    this.clientsIntervals = []
    this.systemInfo = {}
    this.app.get('/api/system', this.onGetSystem)
    this.updateSystemInfo()
    setInterval(async () => {
      await this.updateSystemInfo()
      _.each(this.clients, (client) => {
        this.sendSystemInfo(client)
      })
    }, 5000)
  }

  async updateSystemInfo () {
    this.systemInfo = await this.getSystem()
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

  sendSystemInfo (client) {
    client.write(`data: ${JSON.stringify(this.systemInfo)}\n\n`)
  }

  async onGetSystem (req, res, next) {
    try {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Cache-Control', 'no-cache, no-transform')
      res.setHeader('Connection', 'keep-alive')
      this.sendSystemInfo(res)
      this.clients.push(res)
      req.on('close', () => {
        this.clients.splice(this.clients.indexOf(res), 1)
      })
    } catch (error) {
      logger.error('Error while getting system info:', error)
    }
  }
}

exports = module.exports = new SystemManager()
