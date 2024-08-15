

const util = require('util')
const Transform = require('stream').Transform
const _ = require('lodash')

/*
 * Inherit from stream.Transform
 */

util.inherits(Through, Transform)

/*
 * Constructor
 *
 * @param {Function} transform(chunk, encoding, done)
 * @param {Object} locals
 * @param {Object} options
 */

function Through (transform, locals, options) {
  if (!(this instanceof Through)) {
    return new Through(transform, locals, options)
  }
  Transform.call(this, options)
  this._transform = transform.bind(this)
  _.extend(this, locals)
}


exports = module.exports = Through
