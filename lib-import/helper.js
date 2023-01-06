const util = require('util')
const measure = require('measure')
const numeral = require('numeral')
const path = require('path')
const logger = new (require(path.join(__dirname, '..', 'lib', 'logger')))()
const moment = require('moment')
const _ = require('lodash')

let startProcess = function () {
  var done, label
  label = util.format.apply(util, arguments)
  logger.info(label)
  done = measure.measure('timeconsumingoperation')
  return function () {
    var totalTime, totalTimeStr
    totalTime = done()
    totalTimeStr = ''
    totalTimeStr = util.format('(%s.%s)', numeral(totalTime / 1000).format('hh:mm:ss'), totalTime % 1000)
    return logger.info(label, util.format.apply(util, arguments), totalTimeStr)
  }
}

let convertData = function (value, type) {
  switch (type) {
    case 'select':
      return _.trim(value)
    case 'multiselect':
      if (!_.isString(value)) {
        return []
      }
      value = value.split(',')
      return value = _.compact(_.map(value, _.trim))
    case 'number':
      if (_.isString(value)) {
        return _.toNumber(value)
      } else if (_.isNumber(value)) {
        return value
      } else {
        return null
      }
    case 'integer':
      if (_.isString(value)) {
        return _.toNumber(value)
      } else if (_.isNumber(value)) {
        return value
      } else {
        return null
      }
    case 'checkbox':
      if (_.isString(value)) {
        value = _.includes(['TRUE', 'true', 'True'], value)
      }
      return value
    case 'pillbox':
      if (!_.isString(value)) {
        return []
      }
      value = value.split(',')
      return value = _.compact(_.map(value, _.trim))
    case 'datetime':
    case 'date':
      return moment(value, 'DD/MM/YYYY').valueOf() || moment(value, 'YYYY-MM-DD').valueOf()
    default:
      return _.trim(value)
  }
}

let convertKeyToId = function (value, type, records, name, uniqueKeys, errors) {
  var v
  const uniqueKey = _.first(uniqueKeys)
  switch (type) {
    case 'select':
      v = _.find(records, {
        [uniqueKey]: value
      })
      if (!v) {
        if (errors != null) {
          errors.push('record (' + value + ') not found in resource ' + name)
        }
      }
      return v != null ? v._id : void 0
    case 'multiselect':
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
    default:
      return value
  }
}

exports = module.exports = {
  startProcess: startProcess,
  convertData: convertData,
  convertKeyToId: convertKeyToId
}
