# Replicator Plugin (Server Side)

The Replicator plugin enables data and attachment synchronization between multiple node-cms instances. It is designed for distributed deployments where collections and their associated files need to be kept in sync across servers.

---

## What Does the Replicator Plugin Do?

- **Document Replication:**
  - Synchronizes JSON documents (resource data) between a remote and local node-cms instance.
  - Ensures that changes made on one server are reflected on another.
- **Attachment Replication:**
  - Synchronizes file attachments (such as images or documents) associated with resources.
  - Uses efficient streaming and MD5 checksums to avoid redundant transfers.
- **Automated Cleanup:**
  - Cleans up old or orphaned attachments and indexes as part of the sync process.

---

## How to Enable or Disable the Replicator Plugin

The Replicator plugin is enabled automatically if the `netPort` option is set in your CMS configuration. If `netPort` is not set, the plugin is disabled and no replication server will be started.

**To enable:**

```json
{
  "netPort": 9000, // or any available port number
  "mid": "server-1" // unique machine/server identifier
}
```

**To disable:**

- Omit the `netPort` option from your configuration, or set it to `null` or `0`.

---

## Configuration Options

Add these options to your `cms.json` or when initializing the CMS:

| Option    | Type    | Description                                                      |
|-----------|---------|------------------------------------------------------------------|
| netPort   | Number  | Port to listen for replication connections. Enables the plugin.   |
| mid       | String  | Unique machine/server identifier for replication.                 |

**Example:**

```js
const CMS = require('./index.js');
const cms = new CMS({
  data: './data',
  locales: ['enUS'],
  netPort: 9000, // Enables replicator
  mid: 'server-1' // Unique ID for this server
});
await cms.bootstrap();
```

---

## How Replication Works

- When enabled, the server listens on `netPort` for incoming replication requests.
- The plugin exposes a `replicate` method on the CMS instance:
  - `cms.replicate(host, port, baseUrl, resourceName, callback)`
  - This method connects to a remote node-cms instance and synchronizes the specified resource and its attachments.
- Attachments are checked for existence and integrity (MD5 hash) before downloading.
- Old or removed attachments are cleaned up automatically.

---

## Usage Example

```js
// On the target server (with netPort enabled):
const CMS = require('./index.js');
const cms = new CMS({
  data: './data',
  locales: ['enUS'],
  netPort: 9000,
  mid: 'server-1'
});
await cms.bootstrap();

// On the source server (to replicate a resource):
await cms.replicate('target-host', 9000, 'http://target-host:9000/', 'articles', (err) => {
  if (err) {
    console.error('Replication failed:', err);
  } else {
    console.log('Replication complete!');
  }
});
```

---

## Notes

- The plugin uses TCP sockets for document sync and HTTP for attachment transfer.
- Ensure that firewalls allow traffic on the configured `netPort`.
- The `mid` (machine ID) should be unique for each server to avoid conflicts.
- For advanced scenarios, you may customize or extend the plugin by editing `lib/plugins/replicator/replicator.js`.

---

## Troubleshooting

- **Replication not starting?**
  - Check that `netPort` is set and not in use by another process.
  - Ensure the `mid` is unique and provided.
- **Attachments not syncing?**
  - Verify that the `baseUrl` is correct and accessible from the source server.
  - Check logs for MD5 mismatch or file access errors.

---

For more details, see the source code in `lib/plugins/replicator/replicator.js`.
