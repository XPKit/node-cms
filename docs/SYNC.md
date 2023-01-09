## Sync

#### Sync database (not db replication)

Add sync field in config like this

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
  "apiVersion": 2,
  "sync": {
    "resources": [
      "articles",
      "comments"
    ]
  }
}
```
