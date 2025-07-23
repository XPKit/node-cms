# node-cms Configuration Options (`cms.json`)

This document describes all available options for configuring node-cms via the `cms.json` file.

---

## Top-Level Options

| Option                | Type      | Default         | Description |
|-----------------------|-----------|-----------------|-------------|
| `ns`                  | Array     | `[]`            | Namespace array for multi-app setups |
| `resources`           | String    | `./resources`   | Path to the resources directory |
| `data`                | String    | `./data`        | Path to the data directory |
| `autoload`            | Boolean   | `true`          | Auto-load resources on startup |
| `mode`                | String    | `'normal'`      | CMS mode (e.g., 'normal') |
| `mid`                 | String    | `Date.now().toString(36)` | Machine ID |
| `disableREST`         | Boolean   | `false`         | Disable REST API plugin |
| `disableAdmin`        | Boolean   | `false`         | Disable admin UI plugin |
| `disableJwtLogin`     | Boolean   | `true`          | Disable JWT login |
| `disableReplication`  | Boolean   | `false`         | Disable replication plugin |
| `disableAuthentication`| Boolean  | `false`         | Disable authentication (all users anonymous) |
| `wsRecordUpdates`     | Boolean   | `true`          | Enable WebSocket record updates |
| `importFromRemote`    | Boolean   | `true`          | Enable import-from-remote plugin |
| `disableAnonymous`    | Boolean   | `false`         | Disable anonymous access |
| `defaultPaging`       | Number    | `12`            | Default page size for listings |
| `smartCrop`           | Boolean   | `true`          | Enable smart cropping for images |
| `test`                | Boolean   | `false`         | Enable test mode (for development/testing) |

## Authentication & Session

| Option                | Type      | Default         | Description |
|-----------------------|-----------|-----------------|-------------|
| `auth.secret`         | String    | (required)      | Secret key for authentication (must be at least 16 chars) |
| `session.secret`      | String    | `'MdjIwFRi9ezT'`| Secret for session cookies |
| `session.resave`      | Boolean   | `true`          | Resave session on every request |
| `session.saveUninitialized` | Boolean | `true`      | Save new sessions even if unmodified |

## System Logging

The `syslog` section controls how logs are captured and stored. The `method` option supports several values:

| Value         | Description                                                                 |
|-------------- |-----------------------------------------------------------------------------|
| `file`        | (default) Write logs to a file specified by `syslog.path`                   |
| `syslog`      | Capture logs from the system syslog (Linux only, `/var/log/syslog`)         |
| `journalctl`  | Capture logs from systemd journal (Linux only, requires `identifier`)       |
| `command`     | Run a custom command to capture logs (set `syslog.command`)                 |

Other options:

| Option           | Type    | Default           | Description                                 |
|------------------|---------|-------------------|---------------------------------------------|
| `syslog.method`  | String  | `'file'`          | Logging method (see table above)            |
| `syslog.path`    | String  | `'./syslog.log'`  | Path to log file (for `file` method)        |
| `syslog.identifier` | String | (none)           | Service name for `journalctl`/`syslog`      |
| `syslog.command` | String  | (none)            | Custom command for `command` method         |
| `syslog.max`     | Number  | `2000`            | Max log lines to keep in memory             |

**Examples:**

```json
"syslog": {
  "method": "file",
  "path": "./syslog.log"
}
```

```json
"syslog": {
  "method": "journalctl",
  "identifier": "my-service"
}
```

```json
"syslog": {
  "method": "command",
  "command": "tail -f /var/log/custom.log"
}
```

## Sync (Optional)

| Option                | Type      | Default         | Description |
|-----------------------|-----------|-----------------|-------------|
| `sync.resources`      | Array     | `[]`            | List of resource names to sync |

## Example `cms.json`

```json
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
  "wsRecordUpdates": true,
  "auth": {
    "secret": "your-secret-key"
  },
  "session": {
    "secret": "MdjIwFRi9ezT",
    "resave": true,
    "saveUninitialized": true
  },
  "syslog": {
    "method": "file",
    "path": "./syslog.log"
  },
  "smartCrop": true,
  "defaultPaging": 12,
  "test": true,
  "sync": {
    "resources": ["articles", "comments"]
  }
}
```

---

For more details on each option, see the main documentation or the JSDoc comments in `index.js`.
