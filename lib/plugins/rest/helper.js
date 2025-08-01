/*
 * CMS REST API exposed as plugin
 */
import routes from './routes.js'
import authorize from './middleware/authorize.js'
import findResource from './middleware/find_resource.js'
import listResources from './middleware/list_resources.js'
import parseQuery from './middleware/parse_query.js'

const mw = {
  authorize,
  find_resource: findResource,
  list_resources: listResources,
  parse_query: parseQuery
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

export default RestHelper
