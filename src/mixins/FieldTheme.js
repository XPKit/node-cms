import { get as objGet } from 'lodash'
import LoginService from '@s/LoginService'

export default {
  data() {
    return {
      theme: 'light',
    }
  },
  mounted() {
    LoginService.events.on('changed-theme', (theme) => {
      this.theme = theme
    })
    this.theme = objGet(LoginService, 'user.theme', 'light')
  },
}
