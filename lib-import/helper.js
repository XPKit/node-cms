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
    return logger.info(label, util.format.apply(util, arguments), totalTimeStr)
  }
}

let convertData = function (value, type) {
  if (type === 'select') {
    return _.trim(value)
  } else if (type === 'multiselect') {
    if (!_.isString(value)) {
      return []
    }
    value = value.split(',')
    return value = _.compact(_.map(value, _.trim))
  } else if (type === 'number') {
    if (_.isString(value)) {
      return _.toNumber(value)
    } else if (_.isNumber(value)) {
      return value
    } else {
      return null
    }
  } else if (type === 'integer') {
    if (_.isString(value)) {
      return _.toNumber(value)
    } else if (_.isNumber(value)) {
      return value
    } else {
      return null
    }
  } else if (type === 'checkbox') {
    if (_.isString(value)) {
      value = _.includes(['TRUE', 'true', 'True'], value)
    }
    return value
  } else if (type === 'pillbox') {
    if (!_.isString(value)) {
      return []
    }
    value = value.split(',')
    return value = _.compact(_.map(value, _.trim))
  } else if (type === 'datetime' || type === 'date') {
    return Dayjs(value, 'DD/MM/YYYY').valueOf() || Dayjs(value, 'YYYY-MM-DD').valueOf()
  } else {
    return _.trim(value)
  }
}

let convertKeyToId = function (value, type, records, name, uniqueKeys, errors) {
  let v
  const uniqueKey = _.first(uniqueKeys)
  if (type === 'select') {
    v = _.find(records, {
      [uniqueKey]: value
    })
    if (!v) {
      if (errors != null) {
        errors.push('record (' + value + ') not found in resource ' + name)
      }
    }
    return v != null ? v._id : void 0
  } else if (type === 'multiselect') {
    return _.compact(_.map(value, function (key) {
      v = _.find(records, {
        [uniqueKey]: key
      })
      if (!v) {
        if (errors != null) {
          errors.push('record (' + value + ') not found in resource ' + name)
        }
      }
      return v != null ? v._id : void 0
    }))
  }
  return value
}

exports = module.exports = {
  startProcess: startProcess,
  convertData: convertData,
  convertKeyToId: convertKeyToId
}
