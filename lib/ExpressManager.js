const express = require('express')
const autoBind = require('auto-bind')
class ExpressManager {
  constructor () {
    autoBind(this)
    this.app = express()
  }
  express () {
    return this.app
  }
}
exports = module.exports = ExpressManager
