
<script>
import _ from 'lodash'

export default {
  data () {
    return {
    }
  },
  mounted () {
  },
  methods: {
    notify (text, type = 'success') {
      const notificationObj = {
        group: 'notification',
        text,
        type
        // duration: -1
      }
      const logFunc = _.get(console, type, console.info)
      logFunc(text)
      this.$notify(notificationObj)
    }
  }
}
</script>
