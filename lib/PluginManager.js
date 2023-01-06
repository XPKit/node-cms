const autoBind = require('auto-bind')
const basicAuth = require('basic-auth-connect')
const ExpressManager = require('./ExpressManager')

class PluginManager extends ExpressManager {
  constructor () {
    super()
    autoBind(this)
    this.cms = null
  }

  authentication (req, res, next) {
    basicAuth((username, password, callback) => {
      this.cms.authenticate(username, password, req, (error, result) => {
        if (error && error.code === 500) {
          return res.status(500).send(error)
        }
        callback(error, result)
      })
    })(req, res, next)
  }
}

exports = module.exports = PluginManager
