/*
 * CMS REST API exposed as plugin
 */

/*
 * Module dependencies
 */

const _ = require('lodash')
const express = require('express')
const routes = require('./routes')
const bodyParser = require('body-parser')

/*
 * Default options
 */

const defaults = {
  mount: '/api'
}

/*
 * Constructor
 *
 * @param {Object} options, optional
 *   @param {Route} mount, route to mount itself, eg. '/api'
 */

function Rest (options) {
  const opts = _.extend({}, defaults, options)
  const mw = {}
  mw.authorize = require('./middleware/authorize')
  mw.find_resource = require('./middleware/find_resource')
  mw.list_resources = require('./middleware/list_resources')
  mw.parse_query = require('./middleware/parse_query')

  return function plugin () {
    const app = express()

    options = {
      limit: '50mb'
    }

    app.get('/:resource([\\w-_]+)', bodyParser.json(options), mw.find_resource(this), mw.authorize(this), mw.parse_query, routes.list)
    app.get('/:resource([\\w-_]+)/:id([\\w-_]+)', bodyParser.json(options), mw.find_resource(this), mw.authorize(this), mw.parse_query, routes.find)
    app.post('/:resource([\\w-_]+)', bodyParser.json(options), mw.find_resource(this), mw.authorize(this), mw.parse_query, routes.create)
    app.put('/:resource([\\w-_]+)/:id([\\w-_]+)', bodyParser.json(options), mw.find_resource(this), mw.authorize(this), mw.parse_query, routes.update)
    app.delete('/:resource([\\w-_]+)/:id([\\w-_]+)', bodyParser.json(options), mw.find_resource(this), mw.authorize(this), mw.parse_query, routes.remove)

    app.get('/:resource([\\w-_]+)/file/:aid([\\w-_]+)', mw.find_resource(this), mw.parse_query, routes.findFile)
    app.get('/:resource([\\w-_]+)/:id([\\w-_]+)/attachments/:aid([\\w-_]+).:ext([\\w-_]+)?', mw.find_resource(this), mw.authorize(this), mw.parse_query, routes.findAttachment)
    app.post('/:resource([\\w-_]+)/:id([\\w-_]+)/attachments', mw.find_resource(this), mw.authorize(this), mw.parse_query, routes.createAttachment)
    app.delete('/:resource([\\w-_]+)/:id([\\w-_]+)/attachments/:aid([\\w-_]+)', mw.find_resource(this), mw.authorize(this), mw.parse_query, routes.removeAttachment)

    this._app.use(opts.mount, app)

    this._app.use('/resources', mw.list_resources(this))
  }
}

/*
 * Expose
 */

exports = module.exports = Rest
