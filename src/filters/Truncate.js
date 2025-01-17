import _ from 'lodash'

export default function (value, params) {
  return _.truncate(value, { length: _.isString(params) ? _.toNumber(params) : params })
}
