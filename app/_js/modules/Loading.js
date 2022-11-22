import LoadingService from '../services/LoadingService'

const Loading = {
  install(Vue, params = {}) {
    if (this.installed) {
      return
    }
    this.installed = true
    this.params = params

    Vue.prototype.$loading = LoadingService
  }
}

export default Loading
