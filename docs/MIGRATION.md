## Migration

#### Migration json database to mongoDB database

Add migration field in config like this

```
  {
  "ns": [],
  "resources": "./resources",
  "data": "./data",
  "autoload": true,
  "mode": "normal",
  "mid": "kb90zalx",
  "disableREST": false,
  "disableAdmin": false,
  "disableJwtLogin": true,
  "disableReplication": false,
  "disableAuthentication": false,
  "disableAnonymous": false,
  "migration": "./data",
    "type": "mongodb",
    "url": "localhost/node-cms"
  }
}
```

Use GET /migration api to preview the migrating data
```
GET http://localhost:9990/migration
```

Use POST /migration api to process migrating data to mongodb database
```
POST http://localhost:9990/migration
```
