import Emitter from 'tiny-emitter'

class DialogService {
  constructor () {
    this.events = new Emitter()
  }

  send (isEditing) {
    this.events.emit('dialog', isEditing)
  }

  show (data) {
    /*
      {
        event: 'selectRecord',
        callback: ()=> yourCallback(),
        title: 'Title',
        message: 'Message',
        cancel: 'Cancel',
        confirm: 'Confirm',
      }
    */
    this.events.emit('dialog:show', data)
  }

  confirm (data) {
    this.events.emit('dialog:confirm', data)
  }
}

export default new DialogService()
