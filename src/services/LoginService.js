import _ from 'lodash'
import axios from 'axios'
import Emitter from 'tiny-emitter'

class LoginService {
  constructor () {
    this.events = new Emitter()
    this.user = null
    this.logoutCallbackList = []
  }

  init () {
    console.info('LoginService - init')
    setInterval(async () => {
      this.checkStatus()
    }, 1000 * 15)
  }

  async getStatus () {
    try {
      const { data } = await axios.get(`${window.location.pathname}login`)
      this.user = data
      return data
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
      // console.warn('changeTheme ', this.user, newTheme)
      this.events.emit('changed-theme', newTheme)
      await axios.get(`${window.location.pathname}changeTheme/${newTheme}`)
      console.warn('Successfully changed the theme for user')
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
      await axios.get(`${window.location.pathname}logout`)
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
