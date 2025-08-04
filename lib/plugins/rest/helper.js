const routes = require('./routes')
const mw = {
  authorize: require('./middleware/authorize'),
  find_resource: require('./middleware/find_resource'),
  list_resources: require('./middleware/list_resources'),
  parse_query: require('./middleware/parse_query')
}

/*
 * Constructor
 *
 */
class RestHelper  {
  constructor () {
    this.mw = mw
    this.routes = routes
  }
}

exports = module.exports = RestHelper
