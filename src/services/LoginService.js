import _ from 'lodash'
import Emitter from 'tiny-emitter'
import RequestService from './RequestService'
import VueCookies from 'vue-cookies'

class LoginService {
  constructor () {
    this.events = new Emitter()
    this.user = null
    this.logoutCallbackList = []
  }

  init () {
    // console.info('LoginService - init')
    setInterval(async () => {
      this.checkStatus()
    }, 1000 * 15)
  }

  async getPlugins() {
    const groups = await RequestService.get(`${window.location.pathname}_groups`)
    return _.get(_.find(groups, {name: _.get(this.user, 'group', false)}), 'plugins', [])
  }

  async getStatus () {
    try {
      const data = await RequestService.get(`${window.location.pathname}login`)
      this.user = data
      const remoteUptime = _.get(this.user, 'uptime', +new Date())
      const localUptime = _.parseInt(VueCookies.get('uptime') || -1)
      if (localUptime <= -1) {
        VueCookies.set('uptime', `${remoteUptime}`)
        console.warn('Server uptime saved:', VueCookies.get('uptime'))
      } else if (_.isNumber(localUptime) && remoteUptime > localUptime) {
        console.warn('Will reload page for a new version...')
        VueCookies.remove('uptime')
        window.location.reload(true)
      }
      return this.user
    } catch (error) {
      return null
    }
  }

  async checkStatus () {
    let status
    const userBefore = _.cloneDeep(this.user)
    try {
      status = await this.getStatus()
    } catch (error) {
    }
    if (_.isEmpty(status) && !_.isEmpty(userBefore)) {
      console.info('will logout')
      await this.logout()
    }
  }

  async changeTheme () {
    try {
      const newTheme = _.get(this.user, 'theme', 'dark') === 'dark' ? 'light' : 'dark'
      this.events.emit('changed-theme', newTheme)
      await RequestService.get(`${window.location.pathname}changeTheme/${newTheme}`)
      console.info(`Successfully changed the theme for user: ${newTheme}`)
      _.set(this.user, 'theme', newTheme)
      document.querySelectorAll('body')[0].classList = [`v-theme--${newTheme}`]
      return newTheme
    } catch (error) {
      console.error('Failed to change theme: ', error)
    }
  }

  async logout () {
    this.user = null
    try {
      await RequestService.get(`${window.location.pathname}logout`)
      window.location.reload()
    } catch (error) {
      console.error('Failed to logout: ', error)
    }
    _.each(this.logoutCallbackList, callback => {
      callback()
    })
  }

  onLogout (callback) {
    this.logoutCallbackList.push(callback)
  }

  checkPermission (module) {
    return _.includes(this.user.group.modules, module)
  }
}

export default new LoginService()
