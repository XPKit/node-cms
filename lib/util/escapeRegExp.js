
function escapeRegExp(string, wildcard = '(\\\\.|\\\\[)(.+)(\\\\.|\\\\])\\(') {
  let regEx = string.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&')
  const hasWildcard = regEx.split('\\\\.\\\\{\\\\{\\\\*\\\\}\\\\}\\\\.')
  let closingGroup = ''
  if (hasWildcard.length > 1) {
    regEx = hasWildcard.join(wildcard)
    closingGroup = '\\)'
  }
  regEx = regEx.split('\\\\.\\\\{\\\\{\\\\*\\\\}\\\\}\\\\.').join(wildcard)
  regEx = `${regEx}${closingGroup}(\\\\.\\.+)?$`
  return regEx
}
export default escapeRegExp
