import _ from 'lodash'
class LoadingService {
  constructor () {
    this.isShow = false
    this.list = []
  }
  start (param) {
    this.isShow = true
    this.list = _.union(this.list, [param])
  }

  stop (param) {
    this.list = _.difference(this.list, [param])
    if (_.isEmpty(this.list)) {
      this.isShow = false
    }
  }
}

export default new LoadingService()
