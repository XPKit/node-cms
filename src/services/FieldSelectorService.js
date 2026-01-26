// import _ from 'lodash'
import Emitter from 'tiny-emitter'

class FieldSelectorService {
  constructor() {
    this.events = new Emitter()
  }

  select(field) {
    this.events.emit('select', field)
  }

  highlightParagraph(paragraphLevel, index) {
    this.events.emit('highlight-paragraph', paragraphLevel, index)
  }
}

export default new FieldSelectorService()
