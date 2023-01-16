# Configuration


## Resource Configuration

`node-cms` resources are created on-demand, so `curl localhost/api/my-custom-resource` will create a new resource namespace and 2 corresponding database, from there on REST API with work out of the box, however in order for most extra features to work `resource` `definition` should be created:
``` Javascript
/* resources/articles.js */
exports = module.exports = {
  acl: { ... },                  // Access control list settings
  schema: [{...}, {...}, {...}], // Resource schema definition
  locales: [],                   // List of resource locales. when defined, enables localisation support
  filterUnpublished: true,       // extra-feature flag
  type: 'normal'                 // replication type, when defined, enables replication support
}
```

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

## Authentication Configuration

In your cms.json, you can also customize the type of authentication you want `node-cms` to use:
``` Javascript
/* default cms.json */
{
  "disableJwtLogin": true, // JWT token auth
  "disableAuthentication": false, // basic HTTP auth
  "routesToAuth": [
    "/api/_syslog",
    "/api/system",
    "/admin/resources",
    "/resources"
  ],
}
```

### disableJwtLogin
By default, basic HTTP auth is activated, if you wish to use JWT token authentication, you need to change the configuration to the following:
``` Javascript
/* cms.json */
{
  "disableJwtLogin": false, // JWT token auth
  "disableAuthentication": true, // basic HTTP auth
}
```
If enabled, the `node-cms` user will be redirected to a login page on first load.
Once logged, a `nodeCmsJwt` HTTP only cookie will be created for authentication.

### disableAuthentication
Basic HTTP authentication

### routesToAuth
Node cms routes trough which the authentication system should apply.

### Important notes
If both options are disabled:
- `node-cms` will assume you are connected as the `anonymous` user
- when editing records which the `anonymous` user isn't allowed to, `node-cms` will prompt user to identify via basic HTTP authentication

## Admin interface

check `localhost:port/admin` for default content authoring inteface.

default admin login

		username: localAdmin
		password: localAdmin



