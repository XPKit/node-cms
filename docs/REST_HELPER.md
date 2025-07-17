# RestHelper - Middleware Reuse Guide

The `RestHelper` class provides access to node-cms REST API middlewares for use in external projects. This allows you to leverage CMS functionality in your custom Express applications without recreating the middleware logic.

## Installation & Setup

```javascript
const CMS = require('node-cms')

// Initialize CMS
const cms = new CMS({
  data: './data',
  locales: ['enUS'],
  mid: 'myproject'
})
await cms.bootstrap()

// Create RestHelper instance
const { RestHelper } = CMS
const restHelper = new RestHelper()
const cmsContext = { cms } // Required for middleware context
```

## Available Middlewares

### 1. `parse_query`
Parses query parameters and extends request options.

**Usage:**
```javascript
app.get('/api/data',
  restHelper.mw.parse_query,
  (req, res) => {
    // req.options contains parsed query parameters
    console.log(req.options) // { sort: 'name', limit: '10', query: {...} }
  }
)
```

**Query Examples:**
- `?sort=name&limit=10` → `{ sort: 'name', limit: '10' }`
- `?query={"active":true}` → `{ query: { active: true } }`

### 2. `find_resource`
Finds and validates CMS resources, adds `req.resource`.

**Usage:**
```javascript
app.get('/api/:resource',
  restHelper.mw.find_resource(cmsContext),
  async (req, res) => {
    // req.resource is now available
    const data = await req.resource.find({})
    res.json(data)
  }
)
```

### 3. `list_resources`
Lists all available CMS resources.

**Usage:**
```javascript
app.get('/api/resources', restHelper.mw.list_resources(cmsContext))
```

**Response:**
```json
[
  {
    "title": "users",
    "mid": "abc123",
    "clock": [...]
  }
]
```

### 4. `authorize`
Handles authentication and authorization (optional).

**Usage:**
```javascript
app.get('/api/secure/:resource',
  restHelper.mw.authorize(cmsContext),
  restHelper.mw.find_resource(cmsContext),
  async (req, res) => {
    // Authorized request
    const data = await req.resource.find({})
    res.json(data)
  }
)
```

## Common Patterns

### Pattern 1: Resource CRUD API
```javascript
const express = require('express')
const app = express()

// List resource items
app.get('/api/:resource',
  restHelper.mw.parse_query,
  restHelper.mw.find_resource(cmsContext),
  async (req, res) => {
    try {
      const results = await req.resource.find(req.options)
      res.json({
        resource: req.params.resource,
        count: results.length,
        data: results
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
)

// Get single item
app.get('/api/:resource/:id',
  restHelper.mw.find_resource(cmsContext),
  async (req, res) => {
    try {
      const item = await req.resource.findOne(req.params.id)
      if (!item) return res.status(404).json({ error: 'Not found' })
      res.json(item)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
)
```

### Pattern 2: Search API
```javascript
app.post('/api/search/:resource',
  express.json(),
  restHelper.mw.parse_query,
  restHelper.mw.find_resource(cmsContext),
  async (req, res) => {
    try {
      const searchOptions = {
        ...req.options,
        query: { ...req.options.query, ...req.body.query }
      }

      const results = await req.resource.find(searchOptions)
      res.json({
        searchCriteria: searchOptions,
        count: results.length,
        results: results
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
)
```

### Pattern 3: Custom Business Logic
```javascript
app.get('/api/dashboard',
  restHelper.mw.parse_query,
  async (req, res) => {
    try {
      const dashboard = {}

      // Use CMS resources for business logic
      for (const resourceName of cms._resourceNames) {
        const resource = cms.resource(resourceName)
        const count = (await resource.find({})).length
        dashboard[resourceName] = { count }
      }

      res.json({
        timestamp: new Date().toISOString(),
        resources: dashboard,
        totalResources: cms._resourceNames.length
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
)
```

## Complete Example

```javascript
const express = require('express')
const CMS = require('node-cms')

async function createAPI() {
  // Initialize CMS
  const cms = new CMS({
    data: './data',
    locales: ['enUS'],
    mid: 'myapi',
    disableREST: true,  // Disable built-in REST API
    disableAdmin: true   // Disable admin interface
  })
  await cms.bootstrap()

  // Setup RestHelper
  const { RestHelper } = CMS
  const restHelper = new RestHelper()
  const cmsContext = { cms }

  // Create Express app
  const app = express()
  app.use(express.json())

  // Add your custom routes
  app.get('/api/resources', restHelper.mw.list_resources(cmsContext))

  app.get('/api/:resource',
    restHelper.mw.parse_query,
    restHelper.mw.find_resource(cmsContext),
    async (req, res) => {
      const data = await req.resource.find(req.options)
      res.json({ resource: req.params.resource, data })
    }
  )

  // Start server
  app.listen(3000, () => {
    console.log('Custom API running on http://localhost:3000')
  })
}

createAPI().catch(console.error)
```

## Error Handling

Always wrap middleware usage in try-catch blocks:

```javascript
app.use((error, req, res, next) => {
  console.error('API Error:', error.message)
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message,
    timestamp: new Date().toISOString()
  })
})
```

## Advanced Usage

### Custom Middleware Chain
```javascript
// Create reusable middleware chains
const resourceMiddleware = [
  restHelper.mw.parse_query,
  restHelper.mw.find_resource(cmsContext)
]

const secureResourceMiddleware = [
  restHelper.mw.authorize(cmsContext),
  ...resourceMiddleware
]

// Use in routes
app.get('/api/public/:resource', ...resourceMiddleware, publicHandler)
app.get('/api/secure/:resource', ...secureResourceMiddleware, secureHandler)
```

### Middleware Context Customization
```javascript
// Custom context for specific needs
const customContext = {
  cms,
  config: { maxResults: 100 },
  logger: console
}

app.get('/api/:resource',
  restHelper.mw.find_resource(customContext),
  (req, res) => {
    // Custom logic with enhanced context
  }
)
```

## Benefits

1. **Consistency**: Same middleware logic as built-in REST API
2. **Validation**: Automatic resource validation and error handling
3. **Query Parsing**: Standardized query parameter handling
4. **Authentication**: Optional JWT/basic auth integration
5. **Maintenance**: Updates to node-cms benefit your custom API

## Notes

- Always initialize CMS before using RestHelper
- Some middlewares require `cmsContext = { cms }` parameter
- Middleware order matters - use `parse_query` before `find_resource`
- Test your middleware chains thoroughly
- Consider rate limiting and other security measures for production use
