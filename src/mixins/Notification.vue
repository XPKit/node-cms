
<script>
import _ from 'lodash'
import NotificationsService from '@s/NotificationsService'
export default {
  data () {
    return {
    }
  },
  mounted () {
  },
  methods: {
    notify (message, type = 'success') {
      const logFunc = _.get(console, type, console.info)
      logFunc(message)
      NotificationsService.send(message, type)
    },
    sendOmnibarDisplayStatus (status) {
      NotificationsService.sendOmnibarDisplayStatus(status)
    }
  }
}
</script>
