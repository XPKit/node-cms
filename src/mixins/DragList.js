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
    }
  }
}
