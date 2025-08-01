import express from 'express'
import autoBind from 'auto-bind'

class ExpressManager {
  constructor () {
    autoBind(this)
    this.app = express()
  }
  express () {
    return this.app
  }
}
export default ExpressManager
