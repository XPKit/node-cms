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
      if (_.get(this.user, '_updatedAt', false) && _.get(data, '_updatedAt', false)) {
        if (this.user._updatedAt !== data._updatedAt) {
          console.warn('User data updated, will logout...')
          return await this.logout()
        }
      } else if (_.isEmpty(data) && !_.isEmpty(this.user)) {
        console.warn('User not logged in, will logout...')
        return await this.logout()
      }
      this.user = data
      // Only a response that actually carried the server's boot time can tell us whether it restarted.
      // Logged out, /login answers {}, and treating that as a brand new server reloads the page on
      // every other poll, which wipes whatever has been typed into the login form.
      const remoteUptime = _.get(this.user, 'uptime', false)
      if (!_.isNumber(remoteUptime)) {
        return this.user
      }
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
    } catch {
      return null
    }
  }

  async checkStatus () {
    let status
    try {
      status = await this.getStatus()
    } catch {
    }
    // Against the user we are holding *now*, not the one we held before the call: getStatus logs
    // out by itself when the session has gone, and testing the earlier value logged the same
    // session out a second time - two requests, two reloads, every callback twice.
    if (_.isEmpty(status) && !_.isEmpty(this.user)) {
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
