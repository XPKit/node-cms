const _ = require('lodash')
const os = require('os')
const spawn = require('child_process').spawn
const autoBind = require('auto-bind')
const fs = require('fs-extra')
const path = require('path')

const PluginManager = require('./PluginManager')

class SyslogManager extends PluginManager {
  constructor () {
    super()
    autoBind(this)
    this.syslogData = []
  }

  init (cms, options) {
    this.cms = cms
    this.options = options
    this.app.get('/api/_syslog', this.authentication, this.onGetSyslog)
    switch (os.platform()) {
      case 'linux':
        this.startSysLogCapturing()
        break
      default:
        this.startVirtualSysLog()
    }
  }

  onGetSyslog (req, res, next) {
    if (req.query.id) {
      const item = _.find(this.syslogData, {id: _.toNumber(req.query.id)})
      if (item) {
        const currentId = _.indexOf(this.syslogData, item)
        return res.send(_.drop(this.syslogData, currentId + 1))
      }
    }
    res.send(this.syslogData)
  }

  startSysLogCapturing () {
    const identifier = _.get(this.options, 'syslog.identifier')
    if (!identifier) {
      return
    }
    let cmd = {
      exitCode: 1
    }
    if (!this.options.syslog.method) {
      this.options.syslog.method = 'syslog'
    }
    setInterval(() => {
      if (cmd.exitCode !== null) {
        let commandLine = `tail -q -n0 -f /var/log/syslog`
        if (this.options.syslog.method === 'journalctl') {
          commandLine = `journalctl -f -u ${identifier}.service --output cat -n 0`
        } else if (this.options.syslog.method === 'command' && this.options.syslog.command !== false) {
          commandLine = this.options.syslog.command
        }
        commandLine = commandLine.split(' ')
        cmd = spawn(commandLine.shift(), commandLine)
        cmd.stdout.on('data', (data) => {
          try {
            this.injectDataToSyslogData(data.toString())
          } catch (error) {
            console.error(error)
            throw error
          }
        })

        cmd.on('error', (error) => {
          console.log('spawn syslog error:', error)
        })
      }
    }, 2000)
  }

  injectDataToSyslogData (data) {
    const identifier = _.get(this.options, 'syslog.identifier')
    const doubleDate = RegExp(`^(\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z)\\ (.*)\\ \\d{4}/\\d{2}/\\d{2}\\ \\d{2}:\\d{2}:\\d{2}\\.\\d{4}`, `g`)
    const startingDate = RegExp(`^(\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z)\\ `, `g`)
    if (doubleDate.test(data)) {
      data = data.replace(startingDate, '')
    }
    const regex = new RegExp(`\\w{3}\\s+\\d+\\s+\\d{2}:\\d{2}:\\d{2} .* ${identifier}\\[\\d+\\]: `, 'g')
    if (regex.test(data)) {
      data = data.replace(regex, '')
    }
    let lines = data.split('\n')
    if (_.last(lines) === '') {
      lines = _.dropRight(lines, 1)
    }

    let lastId = _.get(_.last(this.syslogData), 'id', -1)
    lines = _.map(lines, (line, idx) => {
      return {
        id: lastId + idx + 1,
        line
      }
    })
    this.syslogData.push(...lines)
    this.syslogData = _.takeRight(this.syslogData, this.options.syslog.max || 2000)
  }

  startVirtualSysLog () {
    const data = fs.readFileSync(path.join(__dirname, '..', 'virtualSyslog.txt'), 'utf-8')
    this.injectDataToSyslogData(data)
  }
}

exports = module.exports = new SyslogManager()
