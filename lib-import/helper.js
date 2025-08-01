import util from 'util'
import measure from 'measure'
import numeral from 'numeral'
import Logger from 'img-sh-logger'
import Dayjs from 'dayjs'
import _ from 'lodash'

const logger = new Logger()

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

const findRecordByUniqueKey = function (errors, records, uniqueKey, name, value) {
  const v = _.find(records, {[uniqueKey]: value})
  if (!v && errors != null) {
    errors.push('record (' + value + ') not found in resource ' + name)
  }
  return v != null ? v._id : void 0
}

let convertKeyToId = function (value, type, records, name, uniqueKeys, errors) {
  const uniqueKey = _.first(uniqueKeys)
  if (type === 'select') {
    return findRecordByUniqueKey(errors, records, uniqueKey, name, value)
  } else if (type === 'multiselect') {
    return _.compact(_.map(value, (key)=> findRecordByUniqueKey(errors, records, uniqueKey, key)))
  }
  return value
}

export default {
  startProcess: startProcess,
  convertData: convertData,
  convertKeyToId: convertKeyToId
}

