const util = require('util')
const measure = require('measure')
const numeral = require('numeral')
const path = require('path')
const logger = new (require(path.join(__dirname, '..', 'lib', 'logger')))()
const Dayjs = require('dayjs')
const _ = require('lodash')

let startProcess = function () {
  let done, label
  label = util.format.apply(util, arguments)
  logger.info(label)
  done = measure.measure('timeconsumingoperation')
  return function () {
    let totalTime, totalTimeStr
    totalTime = done()
    totalTimeStr = ''
    totalTimeStr = util.format('(%s.%s)', numeral(totalTime / 1000).format('hh:mm:ss'), totalTime % 1000)
    return logger.info(`${label} - ${util.format.apply(util, arguments)} - ${totalTimeStr}`)
  }
}

const toNumber = function (value) {
  if (_.isString(value)) {
    return _.toNumber(value)
  } else if (_.isNumber(value)) {
    return value
  }
  return null
}

let convertData = function (value, type) {
  if (_.includes(['multiselect', 'pillbox'], type)) {
    if (!_.isString(value)) {
      return []
    }
    value = value.split(',')
    return value = _.compact(_.map(value, _.trim))
  } else if (_.includes(['number', 'integer'], type)) {
    return toNumber(value)
  } else if (type === 'checkbox') {
    return _.isString(value) ? _.includes(['TRUE', 'true', 'True'], value) : value
  } else if (_.includes(['datetime', 'date'], type)) {
    return Dayjs(value, 'DD/MM/YYYY').valueOf() || Dayjs(value, 'YYYY-MM-DD').valueOf()
  }
  return _.trim(value)
}

exports = module.exports = {
  startProcess: startProcess,
  convertData: convertData
}
