# node-cms

node-cms is Content management system (CMS), written in node.js, uses leveldb as an asset and content store.

It installs a CMS called node-cms in your path, that developer can run a CMS or install as a node module for developing application that requires CMS or editable data.


## Documentation

`node-cms` is a content management system, in which `resources` [`documents` and `attachments`] are described using plain javascript. It uses a well-defined schema files to dynamically build admin ui and HTTP REST API.

-   [Getting Started](docs/GETTING_STARTED.md): start here
-   [API](docs/API.md)
-   [Configuring node-cms](docs/CONFIG.md)
-   [Field Types](docs/FIELDS.md): Existing field types used by node-cms
-   [Migration](docs/MIGRATION.md): Migrate data
-   [Import](docs/IMPORT.md): Import data from xlsx

## User Guide

### Prerequsites

1. goto [git-scm.com](http://git-scm.com/), download and install **GIT**
2. download and install `nodejs` from [nodejs.org](http://nodejs.org/)

### Installation

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

#### Authors

Edouard Durand<edouard.durand@imagination.com>

Kong Yim <kong.yim@imagination.com>

Louis Wang <louis.wang@imagination.com>

Hugo Barbier <hugo.barbier@imagination.com>

#### License
[ISC](LICENSE)

