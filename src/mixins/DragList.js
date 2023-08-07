import _ from 'lodash'

export default {
  data () {
    return {
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
      const filenameComponents = _.get(a, '_filename', '').split('.')
      const suffix = filenameComponents.length > 1 ? `.${_.last(filenameComponents)}` : ''
      const win = window.open(window.origin + a.url + suffix, '_blank')
      win.focus()
      console.log(a)
    }
  }
}
