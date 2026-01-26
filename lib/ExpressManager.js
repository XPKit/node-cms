const express = require('express')
class ExpressManager {
  constructor() {
    this.app = express()
  }
  express = () => {
    return this.app
  }
}
module.exports = ExpressManager
