import {v4 as uuid} from 'uuid'

export default {
  data () {
    return {
      key: uuid(),
      dragOptions: {
        animation: 200,
        group: 'description',
        disabled: false,
        ghostClass: 'ghost'
      }
    }
  },
  methods: {
    getKey (elem) {
      return `${elem._filename}-${Math.random()}`
    }
  }
}
