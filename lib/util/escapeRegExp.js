

function escapeRegExp(string, wildcard = '(\\\\.|\\\\[)(.+)(\\\\.|\\\\])') {
  let regEx = string.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&')
  regEx = regEx.split('\\\\.\\\\{\\\\{\\\\*\\\\}\\\\}\\\\.').join(wildcard)
  return `${regEx}(\\\\.\\.+)?$`
}

/*
 * Expose
 */

exports = module.exports = escapeRegExp
