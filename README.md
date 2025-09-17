# node-cms

node-cms is Content management system (CMS), written in node.js, uses leveldb as an asset and content store.

It installs a CMS called node-cms in your path, that developer can run a CMS or install as a node module for developing application that requires CMS or editable data.


## Documentation

### Smart Cropping (Face/Object Detection)

If you enable the `smartCrop` feature in your CMS configuration, you must add the following to your project's `package.json`:

```
  "node-cms-tf": "file:node_modules/node-cms/tf"
```

Then run:

```
npm install
npm install node-cms-tf
```

This will install the TensorFlow dependencies required for smart cropping. These dependencies are only needed if you use smart cropping. If they are not installed, the system will log an error and fallback to center cropping automatically.

`node-cms` is a content management system, in which `resources` [`documents` and `attachments`] are described using plain javascript. It uses a well-defined schema files to dynamically build admin ui and HTTP REST API.

-   [Getting Started](docs/GETTING_STARTED.md): Start here
-   [API](docs/API.md)
-   [Configuring node-cms](docs/CONFIG.md)
-   [Field Types](docs/FIELDS.md): Existing field types used by node-cms

-   [Import](docs/IMPORT.md): Import data from xlsx
-   [Smart Cropping](docs/SMART_CROPPING.md): AI-powered image cropping with face detection
-   [RestHelper](docs/REST_HELPER.md): Reusable middlewares for external projects

## RestHelper - Middleware Reuse

The `RestHelper` class allows you to reuse node-cms REST API middlewares in external Express applications, providing consistent behavior and reducing code duplication.

```javascript
const CMS = require('node-cms')
const express = require('express')

// Initialize CMS and RestHelper
const cms = new CMS({ data: './data' })
await cms.bootstrap()

const { RestHelper } = CMS
const restHelper = new RestHelper()
const cmsContext = { cms }

// Use middlewares in your Express app
const app = express()

app.get('/api/:resource',
  restHelper.mw.parse_query,           // Parse query parameters
  restHelper.mw.find_resource(cmsContext),  // Find CMS resource
  async (req, res) => {
    const data = await req.resource.find(req.options)
    res.json(data)
  }
)

app.get('/api/resources', restHelper.mw.list_resources(cmsContext))
```

**Available Middlewares:**
- `parse_query`: Parses and extends request query parameters
- `find_resource`: Validates and loads CMS resources
- `list_resources`: Lists all available CMS resources
- `authorize`: JWT/basic authentication and authorization

**Benefits:**
- ✅ Consistent middleware behavior across projects
- ✅ Automatic query parsing and validation
- ✅ Built-in resource discovery and error handling
- ✅ Optional authentication/authorization support

See [RestHelper Documentation](docs/REST_HELPER.md) for detailed usage patterns and examples.

## User Guide

### Prerequsites

1. goto [git-scm.com](http://git-scm.com/), download and install **GIT**
2. download and install `nodejs` from [nodejs.org](http://nodejs.org/)

### Installation

#### Dependencies

Some features require additional system dependencies:

- **Python v3.x** (required for native modules)
- **[tensorflow](https://www.npmjs.com/package/@tensorflow/tfjs-node)**
- **[canvas](https://www.npmjs.com/package/canvas)**

**Linux (Debian/Ubuntu):**

```sh
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

**Windows:**

- Follow the official [node-canvas Windows installation guide](https://github.com/Automattic/node-canvas/wiki/Installation:-Windows)

Make sure Python and all build tools are available in your PATH.

#### Development

    $ git clone https://github.com/XPKit/node-cms.git
    $ cd node-cms
    $ npm install
    $ npm test

#### As a dependency in existing `nodejs` project

```
npm install git+https://github.com/XPKit/node-cms.git --save
```
In your server.js, running `expressjs`
``` Javascript
const express = require('express')
const CMS = require('node-cms')
const options = { // Your options, see docs/CONFIG.md
  ...
}
const app = express()
const cms = new CMS(options)
app.use(cms.express())
app.listen()
```
#### As a standalone CMS application, in an empty folder

```
npm install -g git+https://git@https://github.com/XPKit/node-cms.git
cms
```

#### npm install error in M1

if your npm install failed in node-sass with some error with c++ and node-gyp, try

```
CXXFLAGS="--std=c++17" npm install
```

#### Authors

Edouard Durand<edouard.durand@imagination.com>

Kong Yim <kong.yim@imagination.com>

Louis Wang <louis.wang@imagination.com>

Hugo Barbier <hugo.barbier@imagination.com>

#### License
[ISC](LICENSE)

