import _ from 'lodash'
import axios from 'axios'

class LoginService {
  constructor () {
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
      const { data } = await axios.get('./login')
      this.user = data
      return data
    } catch (error) {
      return null
    }
  }

  async checkStatus () {
    let status
    try {
      status = await this.getStatus()
    } catch (error) {
    }
    if (_.isEmpty(status)) {
      // console.info('will logout')
      await this.logout()
    }
  }

  async changeTheme (isDark) {
    try {
      const newTheme = _.get(this.user, 'theme', 'dark') === 'dark' ? 'light' : 'dark'
      console.warn('changeTheme ', this.user, newTheme)
      await axios.get(`./changeTheme/${newTheme}`)
      console.warn('Successfully changed the theme for user')
    } catch (error) {
      console.error('Failed to change theme: ', error)
    }
  }

  async logout () {
    this.user = null
    try {
      await axios.get('./logout')
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
