import _ from 'lodash'
import axios from 'axios'

class LoginService {
  constructor () {
    this.user = null
    this.logoutCallbackList = []
  }

  init () {
    console.info(`LoginService - init`)
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

  async logout () {
    this.user = null
    try {
      await axios.get('./logout')
    } catch (error) {
      console.error(`Failed to logout: `, error)
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
