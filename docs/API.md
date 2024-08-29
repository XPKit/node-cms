# APIs

`node-cms` internally uses `level` to store `documents` and `level-store` to store `attachments`. It exposes `REST` API using `expressjs` application, but it could also be included as a library in your existing `nodejs` projects, `node-cms` will expose a low-level `resource` API.

## Resource

In `node-cms` `resources` have logical representation of databases. Every `resource` has it's own namespace (folder on disk) and two corresponding databases `blob` and `json`.

`blob` database is used to store `resource` `attachments`. Internally `node-cms` splits arbitrary (up to 1TB) large attachments into smaller 64kb chunks, which then indexed and associated with correct `documents`. Chunks are stored on disk in an `ordered self-balanced b-tree`, making sure both read and write access are fast (thanks to leveldb).

`json` database is used to store schema-less `resource` `documents`. Internally `node-cms` serialises javascript objects to json, which are then indexed and stored in database as utf-8 strings.

For convenience, `node-cms` automatically handles `document` and `attachment` `id` generation as well some other fields:
``` Javascript
    {
      _id: 'hrk5v51ihrk5v4zpydyzwi06',   // a unique 24char key, comprised of machine-id, timestamp and random number
      _createdAt: 1392183087174,         // UTC timestamp
      _updatedAt: 1392183087174,         // UTC timestamp
      _doc: {                            // actual document
        _id: 'hrk5v51ihrk5v4zpydyzwi06', // normalisation
        },
      _attachments: [{                   // array of attachments associated with this document
        _id: 'hrk77wm6hrk77wjly9mpgs0a', // a unique 24char key, comprised of machine-id, timestamp and random number
        _name: 'file',                   // Content-disposition header
        _contentType: 'image/png',       // Content-type header
        _fields: {},                     // custom form fields, sent along with attachment
        _filename: '_large.png',         // filename header
        _createdAt: 1392185362433,       // UTC timestamp
        _updatedAt: 1392185362433        // UTC timestamp
      }]
    }
```
### Example:
```
./node_modules/.bin/cms server # start cms server with default params
curl -XPOST http://localhost:3000/api/articles -H 'Content-type: application/json' -d '{"hello":"world"}'

    {
      "_id": "hrk5v51ihrk5v4zpydyzwi06",
      "_createdAt": 1392183087174,
      "_updatedAt": 1392183087174,
      "_doc": {
        "_id": "hrk5v51ihrk5v4zpydyzwi06",
        "hello": "world"
        },
      "_attachments": []
    }

curl http://localhost:3000/api/articles/hrk5v51ihrk5v4zpydyzwi06/attachments -i -F name=file -F filedata=@image.png

    {
      "_id": "hrk77wm6hrk77wjly9mpgs0a",
      "_name": "file",
      "_contentType": "image/png",
      "_fields": {},
      "_filename": "image.png",
      "_createdAt": 1392185362433,
      "_updatedAt": 1392185362433
    }

curl http://localhost:3000/api/articles

    [{
      "_id": "hrk5v51ihrk5v4zpydyzwi06",
      "_createdAt": 1392183087174,
      "_updatedAt": 1392183087174,
      "_doc": {
        "_id": "hrk5v51ihrk5v4zpydyzwi06",
        "hello": "world"
        },
      "_attachments": [{
        "_id": "hrk77wm6hrk77wjly9mpgs0a",
        "_name": "file",
        "_contentType": "image/png",
        "_fields": {},
        "_filename": "image.png",
        "_createdAt": 1392185362433,
        "_updatedAt": 1392185362433
      }]
    }]
```

## Pagination

Pagination works out of the box for both REST and Javascript APIs.
```
curl localhost:3000/api/articles?page=2&limit=100
```
## REST API

Documents:

    GET    /api/:resource
    GET    /api/:resource/:id
    POST   /api/:resource
    PUT    /api/:resource/:id
    DELETE /api/:resource/:id

Attachments:

    GET    /api/:resource/:id/attachments/:id
    POST   /api/:resource/:id/attahcments
    DELETE /api/:resource/:id/attachments/:id

## Javascript API
``` Javascript
const cms = new CMS();
const api = cms.api();

articles = api('articles');

// articles.list
// articles.read
// articles.find
// articles.create
// articles.update
// articles.exists
// articles.remove
// articles.findAttachment
// articles.createAttachment
// articles.removeAttachment
```
check api and spec `tests` for API usage examples
