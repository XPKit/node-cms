const osu = require('node-os-utils')
const autoBind = require('auto-bind')
const ExpressManager = require('./ExpressManager')

const cpu = osu.cpu
const mem = osu.mem
const netstat = osu.netstat
const drive = osu.drive

class SystemManager extends ExpressManager {
  constructor () {
    super()
    autoBind(this)
  }
  init (cms, options) {
    this.cms = cms
    this.options = options
    this.app.get('/api/system', this.onGetSystem)
  }

  async onGetSystem (req, res, next) {
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
    res.json({
      cpu: {
        count: cpu.count(),
        usage: cpuUsage,
        model: cpu.model()
      },
      memory: memory,
      network: network,
      drive: driveUsage,
      uptime: Math.floor(process.uptime())
    })
  }
}

exports = module.exports = new SystemManager()
