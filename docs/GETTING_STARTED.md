# Geting Started

## Resource Configuration

`node-cms` resources are created on-demand, so `curl localhost/api/my-custom-resource` will create a new resource namespace and 2 corresponding database, from there on REST API with work out of the box, however in order for most extra features to work `resource` `definition` should be created:

    /* resources/articles.js */
    exports = module.exports = {
      acl: { ... },                  // Access control list settings
      schema: [{...}, {...}, {...}], // Resource schema definition
      locales: [],                   // List of resource locales. when defined, enables localisation support
      filterUnpublished: true,       // extra-feature flag
      type: 'normal'                 // replication type, when defined, enables replication support
    }


## CMS Configuration

During first boot, `node-cms` (unless already present) will create a cms.json in project folder
``` Javascript
    /* default cms.json */
    {
      "resources": "./resources", // resource declarations location
      "data": "./data",           // database location
      "autoload": true,           // automatically load all resource declarations, otherwise need to call library
      "mode": "normal",           // normal or strict - defined if cms is allowed to create non-existing resources
      "netPort": 5000,            // port to use for replication, cms will use port and port + 1 for both json and binary data replication
      "mid": "hpf3vze9"           // a unique 8 char machine id
    }
```
When running `standalone`, it's possible to override config location, using `-c` flag
```
./node_modules/.bin/cms -c /etc/cms.conf server
```
When using `node-cms` as a library, it's possbile to provide configuration in constructor
``` Javascript
const cms = new CMS([options]);
```

### Schema

`resource` `schema` definition is used to generate content authoring forms in cms `admin`
``` Javascript
    schema: [{
      label: 'title',        // field label
      placeholder: 'title',  // field input placeholder text
      field: 'title',        // field in `_doc` to bind to this value, does not support nested "author.name.first" notation
      input: 'string',       // field input type, only "string", "text" and "file" are supported
      required: true         // if this field is required to be present or not empty when document is created/updated, not supported
    }]
```
### Localisation

`node-cms` has an extensive support for `resource` localisation, when specified in `resource` `definition`, localisation changes `document` format and enables content authoring localisation support:
``` Javascript
    // # in resources/articles.js
    locales: ['enUS', 'zhCN']
```
```
./node_modules/.bin/cms server
curl -XPOST localhost:3000/api/articles?locale=enUS -H 'Content-type: application/json' -d '{"title":"Hello world!"}'

    { "_id": "hrk8q651hrk8q5wly7tjryp9",
      "_createdAt": 1392187894165,
      "_updatedBy": "localAdmin",
      "_updatedAt": 1392187894165,
      "_publishedAt": null,
      "_doc": {
        "enUS": {
          "_id": "hrk8q651hrk8q5wly7tjryp9",
          "title": "Hello world!"
        }
      },
      "_attachments": []
    }
```
Check api and spec `tests` for more examples of localisation support.

### Extras

extras enabled to provide support for most commonly used routines

`filterUnpublished` will filter from query results `documents` where `_publishedAt` is not set

## Query syntax

`resources` could be queried, using both REST and Javascript APIs.
```
curl localhost:3000/api/articles?query={"title":"Hello world!"}
```
Query support is provided by excellent [sift.js](https://github.com/crcn/sift.js).
Query syntax is heavily inspired by `Mongodb`.

Check api and spec `tests` for more exmaples of search/query support.

## Replication

Replication relies on internal oplog-style append-only index to ensure every bit of data is only transfered once. Replication parties exchange acknowledge messages to ensure packed delivery. Diffie-Hellman key exchange mechanism is used to authenticate syncing parties. `node-cms` supports exclusive replication settings for `resources` when declared:
``` Javascript
    type: 'normal'
```
### Replication types

`upstream` is used to push `client` changes to `master`.
`downstream` is used to pull `master` changes to `client`.
`normal` is used to for bi-directional sync.

Use cases:

When content databases are being pulled down from master server down to nodes, `downstream` is used.
When log and analytics databases are being pushed up from nodes to master server, `upstream` is used.
For master - master replication `normal` type is used.

`node-cms` supports one-time replication, allowing user to setup replication jobs using system toolset.
By default, `node-cms` does not support content authoring, if content originates from a different machine (has a different machine id), but it's possible to enable authoring to satisfy business logic.
By default, `node-cms` does not support continious replication, but it's possible to enable it to satisfy business logic.
