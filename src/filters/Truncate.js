import _ from 'lodash'

export default function (value, params) {
  if (_.isString(params)) {
    if (_.includes(params, 'n')) {
      console.warn('Truncate - should truncate the text by number of items')
    }
    return _.truncate(value, { length: _.toNumber(params) })
  }
  return _.truncate(value, { length: params })
}
