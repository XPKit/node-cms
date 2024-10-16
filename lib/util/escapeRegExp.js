const _ = require('lodash')

function escapeRegExp(string) {
  let regEx = string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  regEx = _.replace(regEx, '\\{\\{\\*\\}\\}', '(.+)')
  return regEx
}

/*
 * Expose
 */

exports = module.exports = escapeRegExp
