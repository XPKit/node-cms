const _ = require('lodash')

function escapeRegExp(string, wildcard = '(.+)') {
  let regEx = string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  regEx = _.replace(regEx, '\\{\\{\\*\\}\\}', wildcard)
  return regEx
}

/*
 * Expose
 */

exports = module.exports = escapeRegExp
