const Cms = require('node-cms')
const autoBind = require('auto-bind')

class ApplicationManager {
  constructor () {
    autoBind(this)
  }

  async init (server, config) {
    try {
      this.cms = new Cms(config)
      const api = this.cms.api()
      const adminGroup = await api('_groups').find()
      console.warn('admin group:', adminGroup)
    } catch (error) {
      console.error(error)
    }
  }
}

module.exports = new ApplicationManager()
