/*
 * Constructor
 *
 * @return {String} timestamp
 */

const timestamp = (function () {
  let _ts
  let _it = 0
  return function () {
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
}())

/*
 * Expose
 */

exports = module.exports = timestamp
