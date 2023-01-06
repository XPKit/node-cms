const _ = require('lodash')
const os = require('os')
const spawn = require('child_process').spawn
const autoBind = require('auto-bind')
const ansiHTML = require('ansi-html')
const TailingReadableStream = require('tailing-stream')
const chalk = require('chalk')
const Moment = require('moment')
const util = require('util')
const escapeHTML = require('escape-html')
const { table } = require('table')

const PluginManager = require('./PluginManager')

const logger = new (require('./logger'))()

class SyslogManager extends PluginManager {
  constructor () {
    super()
    autoBind(this)

    ansiHTML.setColors({
      reset: ['f8f8f2', '282a36'],
      black: 'd6d6d6',
      red: 'ff5555',
      green: '50fa7b',
      yellow: 'f1fa8c',
      blue: '6272a4',
      magenta: 'ff79c6',
      cyan: '8be9fd',
      lightgrey: 'a0a0a0',
      darkgrey: '808080'
    })

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
            logger.error(error)
            throw error
          }
        })

        cmd.on('error', (error) => {
          logger.error('spawn syslog error:', error)
        })
      }
    }, 2000)
  }

  convertToHTML (line) {
    // eslint-disable-next-line no-control-regex
    line = line.replace(/ {2}\u001b\[([0-9]{1,3})?;([0-9]{1,3})?m/g, '\u001b[$1m')
    // eslint-disable-next-line no-control-regex
    line = line.replace(/\u001b\[([0-9]{1,3})?;([0-9]{1,3})?m/g, '\u001b[$1m')
    line = line.replace(/#033\[([0-9]{1,3})?m/g, '\u001b[$1m')
    return ansiHTML(line)
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
        line,
        html: this.convertToHTML(escapeHTML(line))
      }
    })
    this.syslogData.push(...lines)
    this.syslogData = _.takeRight(this.syslogData, _.get(this.options, 'syslog.max', 2000))
  }

  generateExampleLog () {
    const example = { example: 'string', nested: { a: { b: 1, c: { e: { f: { alongvartobetested: { h: 1, a: 1, b: 2 } }, i: 2 }, j: 3 }, k: 4 }, d: 'string' } }
    example.nested.a.c.e.f.alongvartobetested.a = example
    const exampleLogs = [
      'Emojis Example: 🐛 to ✂️ Copy and 📋 Paste 👌',
      'Standard ANSI Example: \u001b[36mBlue Example\u001b[39m!',
      'None-Standard ANSI Example: #033[37mGray Example #033[39m!',
      `Chalk Example: ${chalk.blue.bgRed.bold('White Text with Red Background Example')}!`,
      'Normal Example: Hello World!',
      'A multiline Example: \nHello World!\nFrom a multiline example!',
      'An inline inspect Example: \n' + util.inspect(example, { showHidden: false, depth: null, colors: true }),
      'A multiline inspect Example: \n' + util.inspect(example, { showHidden: true, depth: Infinity, colors: true }),
      'A table Example: \n' + table([
        ['0A', '0B', '0C'],
        ['1A', '1B', '1C'],
        ['2A', '2B', '2C']
      ]),
      'An raw HTML example that is automatically escaped: <b>Hello World</b>'
    ]
    this.injectDataToSyslogData(chalk.cyan.bold(`[${new Moment().format('YYYY/MM/DD HH:mm:ss.SSSS')}] `) + exampleLogs[_.random(0, exampleLogs.length - 1)])
    setTimeout(this.generateExampleLog, 500 + Math.floor(Math.random() * 3000))
  }

  startVirtualSysLog () {
    const logPath = _.get(this.options, 'syslog.path', false)
    if (logPath !== false) {
      const stream = TailingReadableStream.createReadStream(logPath, { timeout: 0 })
      stream.on('data', buffer => {
        this.injectDataToSyslogData(buffer.toString())
      })
    } else {
      logger.warn('Virtual Syslog is activated but no syslog.path found in configuration; example log will be thrown.')
      this.generateExampleLog()
    }
  }
}

exports = module.exports = new SyslogManager()
