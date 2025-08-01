/*
 * CMS REST API exposed as plugin
 */
import _ from 'lodash'
import express from 'express'
import routes from './routes.js'
import bodyParser from 'body-parser'
import multer from 'multer'
import os from 'os'
import authorize from './middleware/authorize.js'
import findResource from './middleware/find_resource.js'
import listResources from './middleware/list_resources.js'
import parseQuery from './middleware/parse_query.js'

const upload = multer({ dest: os.tmpdir() })
const mw = {
  authorize,
  find_resource: findResource,
  list_resources: listResources,
  parse_query: parseQuery
}
const defaults = {
  mount: '/api'
}

/*
 * Constructor
 *
 * @param {Object} options, optional
 *   @param {Route} mount, route to mount itself, eg. '/api'
 */
class Rest  {
  constructor (cms, options, configPath) {
    this.cms = cms
    this.cms.$rest = this
    this._app = cms._app
    this.options = options
    this.configPath = configPath
    this.options = _.extend({}, defaults, options)
    this.initialize()
  }

  initialize () {
    const app = express()
    const options = {
      limit: '50mb'
    }
    app.get('/:resource([\\w-_]+)', bodyParser.json(options), mw.find_resource(this), mw.authorize(this), mw.parse_query, routes.list)
    app.get('/:resource([\\w-_]+)/:id([\\w-_]+)', bodyParser.json(options), mw.find_resource(this), mw.authorize(this), mw.parse_query, routes.find)
    app.post('/:resource([\\w-_]+)', bodyParser.json(options), mw.find_resource(this), mw.authorize(this), mw.parse_query, routes.create)
    app.put('/:resource([\\w-_]+)/:id([\\w-_]+)', bodyParser.json(options), mw.find_resource(this), mw.authorize(this), mw.parse_query, routes.update)
    app.delete('/:resource([\\w-_]+)/:id([\\w-_]+)', bodyParser.json(options), mw.find_resource(this), mw.authorize(this), mw.parse_query, routes.remove)

    app.get('/:resource([\\w-_]+)/file/:aid([\\w-_]+)', mw.find_resource(this), mw.parse_query, routes.findFile)
    app.get('/:resource([\\w-_]+)/:id([\\w-_]+)/attachments/:aid([\\w-_]+).:ext([\\w-_]+)?', mw.find_resource(this), mw.authorize(this), mw.parse_query, routes.findAttachment)
    app.get('/:resource([\\w-_]+)/:id([\\w-_]+)/attachments/:aid([\\w-_]+).:ext([\\w-_]+)?/cropped', mw.find_resource(this), mw.authorize(this), mw.parse_query, routes.findCroppedAttachment)
    app.put('/:resource([\\w-_]+)/:id([\\w-_]+)/attachments/:aid([\\w-_]+).:ext([\\w-_]+)?', mw.find_resource(this), mw.authorize(this), mw.parse_query, routes.updateAttachment)
    app.post('/:resource([\\w-_]+)/:id([\\w-_]+)/attachments', mw.find_resource(this), mw.authorize(this), mw.parse_query, upload.any(), routes.createAttachment)
    app.put('/:resource([\\w-_]+)/:id([\\w-_]+)/attachments', mw.find_resource(this), mw.authorize(this), mw.parse_query, upload.any(), routes.updateAttachment)
    app.delete('/:resource([\\w-_]+)/:id([\\w-_]+)/attachments/:aid([\\w-_]+)', mw.find_resource(this), mw.authorize(this), mw.parse_query, routes.removeAttachment)
    app.delete('/:resource([\\w-_]+)/:id([\\w-_]+)/attachments', mw.find_resource(this), mw.authorize(this), mw.parse_query, routes.removeAttachment)
    this._app.use(this.options.mount, app)
    this._app.use('/resources', mw.list_resources(this))
  }
}

export default Rest
