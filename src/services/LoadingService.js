import _ from 'lodash'
import Emitter from 'tiny-emitter'

class LoadingService {
  constructor() {
    this.events = new Emitter()
    this.list = []
  }
  start(name) {
    this.isShow = true
    this.list.push(name)
    // console.info('start', name, this.list)
    this.checkLoading()
  }

  stop(name) {
    this.list = _.filter(this.list, (item) => item !== name)
    this.list = _.compact(this.list)
    // console.info('stop', name, this.list)
    this.checkLoading()
  }

  checkLoading() {
    this.events.emit('has-loading', _.get(this.list, 'length', 0) > 0)
  }
}

export default new LoadingService()
