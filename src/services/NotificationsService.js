// import _ from 'lodash'
import Emitter from 'tiny-emitter'

class NotificationsService {
  constructor () {
    this.events = new Emitter()
  }

  send (message, type = 'success') {
    // console.warn('sendNotification', {message, type})
    this.events.emit('notification', {message, type})
  }

  sendOmnibarDisplayStatus (status) {
    this.events.emit('omnibar-display-status', status)
  }
}

export default new NotificationsService()
