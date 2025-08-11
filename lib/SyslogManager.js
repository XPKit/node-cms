const _ = require('lodash')
const os = require('os')
const fs = require('fs-extra')
const spawn = require('child_process').spawn
const ansiHTML = require('ansi-html')
const TailingReadableStream = require('tailing-stream')
const Tail = require('tail').Tail
const chalk = require('chalk')
const Dayjs = require('dayjs')
const util = require('util')
const { table } = require('table')
const ExpressManager = require('./ExpressManager')
const logger = new (require('img-sh-logger'))()
class SyslogManager extends ExpressManager {
  constructor() {
    super()
    ansiHTML.setColors({
      reset: ['f8f8f2', '222'],
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
    this.logClients = []
    this.matchHtmlRegExp = /["'&<>]/
    this.escapeCharCodesMapping = {
      34: '&quot;',
      38: '&amp;',
      39: '&#39;',
      60: '&lt;',
      62: '&gt;'
    }
    this.levels = {'trace': -3, 'verbose': -2, 'debug': -1, 'info': 0, 'warn': 1, 'error': 2}
  }
  init = (cms, options) => {
    this.cms = cms
    this.options = options
    this.app.get('/api/_syslog', this.onGetSyslog)
    const syslogMethod = _.get(this.options, 'syslog.method', 'syslog')
    if (os.platform() === 'linux' && (syslogMethod === 'syslog' || syslogMethod === 'journalctl')) {
      logger.info('Syslog Configuration:', _.get(this.options, 'syslog', {}))
      this.startSysLogCapturing()
    } else {
      this.startVirtualSysLog()
    }
  }
  escapeHTML = (string) => {
    let str = '' + string
    let match = this.matchHtmlRegExp.exec(str)
    if (!match) {
      return str
    }
    let escape
    let html = ''
    let index = 0
    let lastIndex = 0
    for (index = match.index; index < str.length; index++) {
      const val = _.get(this.escapeCharCodesMapping, str.charCodeAt(index), false)
      if (!val) {
        continue
      }
      escape = val
      if (lastIndex !== index) {
        html += str.substring(lastIndex, index)
      }
      lastIndex = index + 1
      html += escape
    }
    return lastIndex !== index ? html + str.substring(lastIndex, index) : html
  }
  getSyslogData = (data) => {
    if (data.id > 0) {
      const item = _.find(this.syslogData, {id: _.toNumber(data.id)})
      if (item) {
        const currentId = _.indexOf(this.syslogData, item)
        return _.drop(this.syslogData, currentId + 1)
      }
    }
    return this.syslogData
  }
  onGetSyslog = (req, res) => {
    try {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Cache-Control', 'no-cache, no-transform')
      res.setHeader('Connection', 'keep-alive')
      res.flushHeaders() // flush the headers to establish SSE with client
      this.syslogData.forEach((log) => {
        res.write(`data: ${JSON.stringify(log)}\n\n`)
      })
      this.logClients.push(res)
      req.on('close', () => {
        const index = this.logClients.indexOf(res)
        this.logClients.splice(index, 1)
      })
    } catch (error) {
      logger.error('Error while getting syslog:', error)
    }
  }
  startSysLogCapturing = () => {
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
        let commandLine = 'tail -q -n0 -f /var/log/syslog'
        if (this.options.syslog.method === 'journalctl') {
          commandLine = `journalctl -f -u ${identifier}.service --output cat -n 0`
        } else if (this.options.syslog.method === 'command' && this.options.syslog.command !== false) {
          commandLine = this.options.syslog.command
        }
        commandLine = commandLine.split(' ')
        logger.warn('should spawn', commandLine)
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
  convertToHTML = (line) => {
    // eslint-disable-next-line no-control-regex
    line = line.replace(/ {2}\u001b\[([0-9]{1,3})?;([0-9]{1,3})?m/g, '\u001b[$1m')
    // eslint-disable-next-line no-control-regex
    line = line.replace(/\u001b\[([0-9]{1,3})?;([0-9]{1,3})?m/g, '\u001b[$1m')
    line = line.replace(/#033\[([0-9]{1,3})?m/g, '\u001b[$1m')
    return ansiHTML(line)
  }
  cleanLine = (line) => {
    // eslint-disable-next-line no-control-regex
    return `${line}`.replace(/ {2}\u001b\[([0-9]{1,3})?;([0-9]{1,3})?m/g, '$1')
    // eslint-disable-next-line no-control-regex
      .replace(/\u001b\[([0-9]{1,3})?;([0-9]{1,3})?m/g, '$1')
      .replace(/#033\[([0-9]{1,3})?m/g, '[$1')
  }
  injectDataToSyslogData = (data, fromFile = false) => {
    const identifier = _.get(this.options, 'syslog.identifier')
    const logPath = _.get(this.options, 'syslog.path', false)
    const syslogMethod = _.get(this.options, 'syslog.method', 'file')
    const doubleDate = RegExp('^(\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z)\\ (.*)\\ \\d{4}/\\d{2}/\\d{2}\\ \\d{2}:\\d{2}:\\d{2}\\.\\d{4}', 'g')
    const startingDate = RegExp('^(\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z)\\ ', 'g')
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
    // Write to file only if method is 'file' and data is not from file (to prevent circular writes)
    if (logPath && lines.length > 0 && syslogMethod === 'file' && !fromFile) {
      const logContent = lines.join('\n') + '\n'
      fs.appendFile(logPath, logContent, (err) => {
        if (err) {
          logger.error('Error writing to syslog file:', err)
        }
      })
    }
    let lastId = _.get(_.last(this.syslogData), 'id', -1)
    lines = _.map(lines, (line, idx) => {
      const logLevel = this.cleanLine(line).split(' ')[0].split(':').slice(-1)[0]
      return {
        id: lastId + idx + 1,
        line: line,
        html: this.convertToHTML(this.escapeHTML(line)),
        level: _.get(this.levels, logLevel, 0)
      }
    })
    this.syslogData.push(...lines)
    _.each(lines, (line) => {
      this.logClients.forEach((client) => {
        client.write(`data: ${JSON.stringify(line)}\n\n`)
      })
    })
    this.syslogData = _.takeRight(this.syslogData, _.get(this.options, 'syslog.max', 2000))
  }
  generateExampleLog = () => {
    const example = { example: 'string', nested: { a: { b: 1, c: { e: { f: { alongvartobetested: { h: 1, a: 1, b: 2 } }, i: 2 }, j: 3 }, k: 4 }, d: 'string' } }
    example.nested.a.c.e.f.alongvartobetested.a = example
    const exampleLogs = [
      'Emojis Example: 🐛 to ✂️ Copy and 📋 Paste 👌',
      'Standard ANSI Example: \u001b[36mBlue Example\u001b[39m!',
      'None-Standard ANSI Example: #033[37mGray Example #033[39m!',
      `Chalk Example: ${chalk.white.bgRed.bold('White Text with Red Background Example')}!`,
      'Normal Example: Hello World!',
      'A multiline Example: \nHello World!\nFrom a multiline example!',
      'An inline inspect Example: \n' + util.inspect(example, { showHidden: false, depth: null, colors: true }),
      'A multiline inspect Example: \n' + util.inspect(example, { showHidden: true, depth: Infinity, colors: true }),
      'A table Example: \n' + table([
        ['0A', '0B', '0C'],
        ['1A', '1B', '1C'],
        ['2A', '2B', '2C']
      ]),
      'Dori me\nInterimo, adapare\nDori me\nAmeno, Ameno\nLatire\nLatiremo\nDori me\nAmeno\nOmenare imperavi ameno\nDimere, dimere matiro\nMatiremo\nAmeno\nOmenare imperavi emulari, ameno\nOmenare imperavi emulari, ameno\nAmeno dore\nAmeno dori me\nAmeno dori me\nAmeno dom\nDori me reo\nAmeno dori me\nAmeno dori me\nDori me am\nAmeno\nOmenare imperavi ameno\nDimere dimere matiro\nMatiremo\nAmeno',
      'A raw HTML example that is automatically escaped: <b>Hello World</b>'
    ]
    this.injectDataToSyslogData(chalk.cyan.bold(`[${new Dayjs().format('YYYY/MM/DD HH:mm:ss.SSSS')}] `) + exampleLogs[_.random(0, exampleLogs.length - 1)])
    setTimeout(this.generateExampleLog, 500 + Math.floor(Math.random() * 3000))
  }

  setupConsoleCapture = () => {
    const logPath = _.get(this.options, 'syslog.path', false)
    if (!logPath) {
      return
    }
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    }
    const originalStdoutWrite = process.stdout.write
    const originalStderrWrite = process.stderr.write
    const writeToFile = (content) => {
      if (_.isString(content)) {
        fs.appendFile(logPath, content, (err) => {
          if (err && err.code !== 'ENOENT') {
            originalConsole.error('Error writing to syslog file:', err)
          }
        })
      }
    }
    process.stdout.write = function(chunk, encoding, callback) {
      const result = originalStdoutWrite.call(process.stdout, chunk, encoding, callback)
      writeToFile(chunk)
      return result
    }
    process.stderr.write = function(chunk, encoding, callback) {
      const result = originalStderrWrite.call(process.stderr, chunk, encoding, callback)
      writeToFile(chunk)
      return result
    }
    // Override console methods to ensure they're captured too
    console.log = function(...args) {
      originalConsole.log.apply(console, args)
      const message = args.map(arg => typeof arg === 'string' ? arg : util.inspect(arg)).join(' ')
      writeToFile(message + '\n')
    }
    console.warn = function(...args) {
      originalConsole.warn.apply(console, args)
      const message = args.map(arg => typeof arg === 'string' ? arg : util.inspect(arg)).join(' ')
      writeToFile(message + '\n')
    }
    console.error = function(...args) {
      originalConsole.error.apply(console, args)
      const message = args.map(arg => typeof arg === 'string' ? arg : util.inspect(arg)).join(' ')
      writeToFile(message + '\n')
    }
    console.info = function(...args) {
      originalConsole.info.apply(console, args)
      const message = args.map(arg => typeof arg === 'string' ? arg : util.inspect(arg)).join(' ')
      writeToFile(message + '\n')
    }
    this.originalStreams = {
      stdout: originalStdoutWrite,
      stderr: originalStderrWrite,
      console: originalConsole
    }
    originalConsole.log('Stream and console capture setup complete. All terminal output will be written to:', logPath)
  }
  fileMethod = (logPath) => {
    logger.warn('Virtual Syslog with file method is activated. Capturing console logs and writing to file.')
    this.setupConsoleCapture()
    try {
      logger.warn('Setting up tail for file:', logPath)
      const tail = new Tail(logPath, { fromBeginning: false, follow: true })
      tail.on('line', (data) => {
        this.injectDataToSyslogData(data, true)
      })
      tail.on('error', (error) => {
        logger.error('Tail error for file method:', error)
      })
      this.tailInstance = tail
      logger.warn('Tail setup complete for file method')
    } catch (error) {
      logger.error('Error starting tail for file method:', error)
    }
  }
  syslogMethod = (logPath) => {
    logger.warn('Virtual Syslog with syslog method is activated. Tailing file:', logPath)
    try {
      const tail = new Tail(logPath, { fromBeginning: false, follow: true })
      tail.on('line', (data) => {
        console.log('Tail reading from file:', data)
        this.injectDataToSyslogData(data, true)
      })
      tail.on('error', (error) => {
        logger.error('Tail error:', error)
      })
      this.tailInstance = tail
    } catch (error) {
      logger.error('Error starting tail:', error)
    }
  }
  journalctlMethod = (logPath) => {
  // Method is 'journalctl': Read from the file using TailingReadableStream
    logger.warn('Virtual Syslog with journalctl method is activated. Reading from file:', logPath)
    const stream = TailingReadableStream.createReadStream(logPath, { timeout: 0 })
    stream.on('data', buffer => {
      console.log('Reading from file:', buffer.toString())
      this.injectDataToSyslogData(buffer.toString(), true)
    })
  }
  startVirtualSysLog = () => {
    const logPath = _.get(this.options, 'syslog.path', false)
    const syslogMethod = _.get(this.options, 'syslog.method', 'file')
    if (logPath !== false) {
      fs.ensureFileSync(logPath)
      if (syslogMethod === 'file') {
        this.fileMethod(logPath)
      } else if (syslogMethod === 'syslog') {
        this.syslogMethod(logPath)
      } else if (syslogMethod === 'journalctl') {
        this.journalctlMethod(logPath)
      } else {
        if (os.platform() !== 'linux') {
          logger.warn('Unknown syslog method:', syslogMethod, '. Generating example logs (non-Linux system).')
          this.generateExampleLog()
        } else {
          logger.warn('Unknown syslog method:', syslogMethod, '. No action taken on Linux system.')
        }
      }
    } else {
      if (os.platform() !== 'linux') {
        logger.warn('Virtual Syslog is activated but no syslog.path found in configuration; example log will be thrown (non-Linux system).')
        this.generateExampleLog()
      } else {
        logger.warn('Virtual Syslog is activated but no syslog.path found in configuration; no action taken on Linux system.')
      }
    }
  }
}

exports = module.exports = new SyslogManager()
