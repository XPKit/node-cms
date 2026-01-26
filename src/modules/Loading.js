import LoadingService from '@s/LoadingService'

const Loading = {
  install(app, options) {
    this.params = options
    app.config.globalProperties.$loading = LoadingService
  },
}

export default Loading
