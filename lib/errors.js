const _ = require('lodash')
const autoBind = require('auto-bind')


class Errors {
  constructor () {
    autoBind(this)
  }

  getError (code, message, data = false) {
    const errorObj = {code, message}
    if (data) {
      errorObj.data = data
    }
    return errorObj
  }

  duplicateFoundError (fieldName) {
    return this.getError(400, `Field '${fieldName}' is duplicated`, arguments)
  }
  listRecordError (resource, query)  {
    return this.getError(500, `list resource (${_.isString(query) ? query : JSON.stringify(query)}) error in resource (${resource})`, arguments)
  }
  listNotFoundError (resource, query) {
    return this.getError(404, `list resource with query (${_.isString(query) ? query : JSON.stringify(query)}) not found in resource (${resource})`, arguments)
  }
  recordNotFoundError (resource, query) {
    return this.getError(404, `record (${_.isString(query) ? query : JSON.stringify(query)}) not found in resource (${resource}) error`, arguments)
  }
  findRecordError (resource, query) {
    return this.getError(500, `record (${_.isString(query) ? query : JSON.stringify(query)}) not found in resource (${resource}) error`, arguments)
  }
  updateRecordError (resource, id) {
    return this.getError(500, `record (${id}) update in resource (${resource}) error`, arguments)
  }
  removeRecordError (resource, id) {
    return this.getError(500, `remove record (${id}) in resource (${resource}) error`, arguments)
  }
  removeAttachmentError (resource, id, aid) {
    return this.getError(500, `record (${id}) remove attachment (${aid}) in resource (${resource}) error`, arguments)
  }
  findAttachmentError (resource, id, aid) {
    return this.getError(404, `record (${id}) find attachment (${aid}) in resource (${resource}) error`, arguments)
  }
  createAttachmentError (resource, id) {
    return this.getError(500, `record (${id}) create attachment in resource (${resource}) error`, arguments)
  }
}

exports = module.exports = Errors
