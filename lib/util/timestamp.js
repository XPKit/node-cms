/*
 * Constructor
 *
 * @return {String} timestamp
 */
const timestamp = (() => {
  let _ts
  let _it = 0
  return () => {
    const now = Date.now()
    if (_ts === now) {
      _it++
    } else {
      _it = 0
    }
    _ts = now
    if (_it > 0) {
      return `${now}.${(`00000000${_it}`).slice(-8)}`
    }
    return now.toString()
  }
})()
module.exports = timestamp
