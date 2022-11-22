/*
 * Module dependencies
 */

const through = require('./through')
const _ = require('underscore')

/*
 * Helpers
 */

/*
 * Sum length of all elements in array
 *
 * @param {Array} arr
 * @return {Number} totalLength
 */

const getLength = function (arr) {
  return _.reduce(arr, (memo, item) => memo + item.length, 0)
}

/*
 * Cap stream, return capped data
 *
 * @param {net.Socket} socket
 * @param {Number} length
 * @param {Function} callback(data)
 */

const cap = function (socket, length, cb) {
  socket.pipe(through(function (chunk, encoding, done) {
    this._rawHeader.push(chunk)
    if (getLength(this._rawHeader) >= length) {
      socket.unpipe(this)
      const buf = Buffer.concat(this._rawHeader)
      socket.unshift(buf.slice(length))
      cb(buf.slice(0, length))
    }
    done()
  }, {
    _rawHeader: []
  }))
}

/*
 * Expose
 */

exports = module.exports = cap
