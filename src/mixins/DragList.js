import _ from 'lodash'
import {v4 as uuid} from 'uuid'

export default {
  data () {
    return {
      key: uuid(),
      dragging: false,
      dragOptions: {
        animation: 200,
        group: 'description',
        disabled: false,
        ghostClass: 'ghost'
      }
    }
  },
  methods: {
    onStartDrag () {
      this.dragging = true
    },
    viewFile (attachment = false) {
      var a = attachment || this.attachment()
      if (!a) {
        return
      }
      const filenameComponents = _.get(a, '_filename', '').split('.')
      const suffix = filenameComponents.length > 1 ? `.${_.last(filenameComponents)}` : ''
      const win = window.open(window.origin + a.url + suffix, '_blank')
      win.focus()
    },
    getKey (elem) {
      return `${elem._filename}-${Math.random()}`
    }
  }
}
