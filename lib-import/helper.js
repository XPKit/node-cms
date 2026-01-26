const util = require('node:util')
const logger = new (require('img-sh-logger'))()
const Dayjs = require('dayjs')
const duration = require('dayjs/plugin/duration')
Dayjs.extend(duration)
const _ = require('lodash')

const startProcess = function () {
  const label = util.format.apply(util, arguments)
  logger.info(label)
  const start = Date.now()
  return function () {
    const totalTime = Date.now() - start
    // Use dayjs.duration to format elapsed time as hh:mm:ss
    const dur = Dayjs.duration(totalTime)
    const formatted = util.format(
      '%s:%s:%s',
      String(dur.hours()).padStart(2, '0'),
      String(dur.minutes()).padStart(2, '0'),
      String(dur.seconds()).padStart(2, '0'),
    )
    const totalTimeStr = util.format('(%s.%s)', formatted, totalTime % 1000)
    return logger.info(label, util.format.apply(util, arguments), totalTimeStr)
  }
}

const toNumber = (value) => {
  if (_.isString(value)) {
    return _.toNumber(value)
  } else if (_.isNumber(value)) {
    return value
  }
  return null
}

const convertData = (value, type) => {
  if (_.includes(['multiselect', 'pillbox'], type)) {
    if (!_.isString(value)) {
      return []
    }
    value = value.split(',')
    value = _.compact(_.map(value, _.trim))
    return value
  } else if (_.includes(['number', 'integer'], type)) {
    return toNumber(value)
  } else if (type === 'checkbox') {
    return _.isString(value) ? _.includes(['TRUE', 'true', 'True'], value) : value
  } else if (_.includes(['datetime', 'date'], type)) {
    return Dayjs(value, 'DD/MM/YYYY').valueOf() || Dayjs(value, 'YYYY-MM-DD').valueOf()
  }
  return _.trim(value)
}

const findRecordByUniqueKey = (errors, records, uniqueKey, name, value) => {
  const v = _.find(records, { [uniqueKey]: value })
  if (!v && errors != null) {
    errors.push(`record (${value}) not found in resource ${name}`)
  }
  return v != null ? v._id : void 0
}

const convertKeyToId = (value, type, records, name, uniqueKeys, errors) => {
  const uniqueKey = _.first(uniqueKeys)
  if (type === 'select') {
    return findRecordByUniqueKey(errors, records, uniqueKey, name, value)
  } else if (type === 'multiselect') {
    return _.compact(_.map(value, (key) => findRecordByUniqueKey(errors, records, uniqueKey, key)))
  }
  return value
}

module.exports = {
  startProcess: startProcess,
  convertData: convertData,
  convertKeyToId: convertKeyToId,
}
