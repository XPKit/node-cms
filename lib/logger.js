const path = require('path')
const fs = require('fs-extra')
const util = require('util')
const _ = require('lodash')
const colors = require('colors')
const Dayjs = require('dayjs')
const createDebug = require('debug')

const mainDirectory = process.cwd()
const logPath = path.join(mainDirectory, 'logs', 'logs.txt')

/**
 * Reads the consuming project's package.json so log namespaces carry its name, falling back to
 * node-cms's own when there is none (for instance when the cwd is not a project root).
 * @returns {Object} The parsed package.json
 */
function readHostPackage () {
  try {
    const hostPath = path.join(mainDirectory, 'package.json')
    if (fs.existsSync(hostPath)) {
      return require(hostPath)
    }
  } catch (error) {
    console.error('logger: could not read the host package.json, falling back to node-cms:', error.message)
  }
  return require('../package.json')
}

const packageJson = readHostPackage()

const logLevels = {
  trace: { prefix: '👣', color: 'gray', colorNumber: 8 },
  verbose: { prefix: '🔭', color: 'gray', colorNumber: 8 },
  debug: { prefix: '🐛', color: 'magenta', colorNumber: 5 },
  info: { prefix: '📟', color: 'cyan', colorNumber: 6 },
  warn: { prefix: '⚠️', color: 'yellow', colorNumber: 3 },
  error: { prefix: '🔥', color: 'red', colorNumber: 1 }
}

// debug picks a namespace colour by hashing the name; levels are more useful than hashes here.
const originalSelectColor = createDebug.selectColor
createDebug.selectColor = function (namespace) {
  const level = _.findKey(logLevels, (value, key) => _.endsWith(namespace, `:${key}`))
  if (level) {
    return logLevels[level].colorNumber
  }
  return originalSelectColor.call(this, namespace)
}

// Our own timestamp is part of every line, so debug's would be a duplicate. Set on debug's options
// rather than process.env.DEBUG_HIDE_DATE, so requiring this module leaves the environment alone.
_.set(createDebug, 'inspectOpts.hideDate', true)

// Turn our namespaces on by default, because almost nothing sets DEBUG and silent logs are worse
// than noisy ones here. An explicit DEBUG always wins, and debug.enable() does not touch the
// environment, so a consumer's own configuration is never overwritten.
if (_.isEmpty(_.get(process, 'env.DEBUG', ''))) {
  const levels = _.keys(logLevels).join(',').replace(/([^,]+)/g, `${packageJson.name}:*:$1`)
  createDebug.enable(_.get(packageJson, 'config.log_filter', levels))
  // enable() also persists the filter through debug's save(), which writes process.env.DEBUG.
  // The filter is already applied in memory, so drop that write and leave the environment as found.
  delete process.env.DEBUG
}

/**
 * Structured V8 call sites for the current stack, used to name the calling file and function.
 * @param {Function} boundary - Frames above and including this function are omitted
 * @returns {Array<Object>} CallSite objects, innermost first
 */
function callSites (boundary) {
  const original = Error.prepareStackTrace
  Error.prepareStackTrace = (_error, stack) => stack
  const holder = {}
  Error.captureStackTrace(holder, boundary)
  const stack = holder.stack
  Error.prepareStackTrace = original
  return _.isArray(stack) ? stack : []
}

let fileLoggingFailed = false

/**
 * Appends a line to logs/logs.txt. A logging failure must never take the process with it, so the
 * first error is reported to stderr and file logging then stays quiet for the rest of the run.
 * @param {string} line - The formatted line, already written to stderr
 * @returns {void}
 */
function appendToLogFile (line) {
  if (fileLoggingFailed) {
    return
  }
  try {
    fs.ensureDirSync(path.dirname(logPath))
    fs.appendFile(logPath, `${line}\n`, error => {
      if (error && !fileLoggingFailed) {
        fileLoggingFailed = true
        process.stderr.write(`logger: file logging disabled, could not write ${logPath}: ${error.message}\n`)
      }
    })
  } catch (error) {
    fileLoggingFailed = true
    process.stderr.write(`logger: file logging disabled, could not write ${logPath}: ${error.message}\n`)
  }
}

/**
 * Per-file logger. Construct one per module; the namespace is taken from the constructing file, so
 * the caller never names itself: `new (require('./logger'))()`.
 */
class Logger {
  constructor () {
    const caller = _.first(callSites(Logger))
    const fileName = caller ? caller.getFileName() : ''
    const shortName = path.basename(fileName || 'unknown', path.extname(fileName || ''))
    const namespace = `${packageJson.name}:${shortName}`
    _.each(logLevels, (value, key) => {
      const instance = createDebug(`${namespace}:${key}`)
      instance.log = this.log
      instance.color = value.colorNumber
      this[`_${key}`] = { prefix: value.prefix, instance, color: value.color, colorNumber: value.colorNumber }
      this[key] = (...data) => this.template(this[`_${key}`], data)
    })
  }

  /**
   * Sink for every debug instance: stderr first, then the log file.
   * @param {...*} args - Pre-formatted debug arguments
   * @returns {void}
   */
  log = (...args) => {
    const line = util.format(...args)
    process.stderr.write(`${line}\n`)
    appendToLogFile(line)
  }

  /**
   * @returns {string} Current time as YYYY/MM/DD HH:mm:ss.SSS
   */
  timestamp = () => {
    return new Dayjs().format('YYYY/MM/DD HH:mm:ss.SSS')
  }

  /**
   * Formats one call: timestamp, level glyph and the calling function's name, then the message.
   * Objects are rendered with %O on their own line, matching how the call sites expect to read.
   * @param {Object} logLevel - One of the per-level descriptors built in the constructor
   * @param {Array} data - Arguments as passed to the level method
   * @returns {void}
   */
  template = (logLevel, data) => {
    // Frames from this file are the level wrapper and template itself; the caller is the first
    // frame outside it, which is the name worth printing.
    const frames = _.filter(callSites(this.template), frame => frame.getFileName() !== __filename)
    const named = _.find(frames, frame => frame.getFunctionName() != null)
    const methodName = named ? named.getFunctionName() : ''
    const level = logLevel || this._trace
    const paint = colors[level.color] ? colors[level.color] : colors.green
    const prefix = `${this.timestamp()} ${colors[level.color] ? paint(level.prefix) : level.prefix} ${paint(methodName)}`
    let payload = data
    if (_.isArray(payload) && payload.length === 1) {
      payload = _.first(payload)
    }
    if (_.isString(payload)) {
      return level.instance('%s %s', prefix, payload)
    }
    if (_.isString(_.first(payload))) {
      const message = _.first(payload)
      return level.instance('%s %s\n%O', prefix, message, _.slice(payload, 1))
    }
    return level.instance('%s\n%O', prefix, payload)
  }
}

module.exports = Logger
