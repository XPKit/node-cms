export default {
  data () {
    return {
      key: crypto.randomUUID(),
      dragOptions: {
        animation: 200,
        group: 'description',
        disabled: false,
        ghostClass: 'ghost',
        delay: 150,
        delayOnTouchOnly: false,
        touchStartThreshold: 10
      }
    }
  },
  methods: {
    getKey (elem) {
      return `${elem._filename}-${elem._id || elem._createdAt || elem._md5sum || elem._size}`
    }
  }
}
