const Dayjs = require('dayjs')
const duration = require('dayjs/plugin/duration')
Dayjs.extend(duration)
const _ = require('lodash')

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
  } else if (type === 'time') {
    return value
  }
  return _.trim(value)
}

module.exports = {
  convertData: convertData,
}
