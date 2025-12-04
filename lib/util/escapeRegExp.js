const wildcard = '(\\\\.|\\\\[)(.+)(\\\\.|\\\\])'
function escapeRegExp(string, isLocalised = true) {
  let regEx = string.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&')
  const hasWildcard = regEx.split('\\\\.\\\\{\\\\{\\\\*\\\\}\\\\}\\\\.')
  if (hasWildcard.length > 1) {
    regEx = hasWildcard.join(wildcard)
  }
  regEx = regEx.split('\\\\.\\\\{\\\\{\\\\*\\\\}\\\\}\\\\.').join(wildcard)
  regEx = `${regEx}${isLocalised ? '(\\\\.\\.+)?' : ''}$`
  return regEx
}
exports = module.exports = escapeRegExp
