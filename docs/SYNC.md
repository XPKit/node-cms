
## Sync Plugin

The sync plugin in node-cms allows you to synchronize the contents of specific resources between different node-cms instances. This is **not** full database replication, but rather targeted resource-level synchronization. It is useful for keeping selected resources (such as articles, comments, or other data models) in sync across multiple deployments or environments.

### What does the sync plugin do?

- Synchronizes the data of specified resources between node-cms instances.
- Only the resources listed in the sync configuration are affected.
- Can be used to push or pull updates for these resources, ensuring consistency across environments.
- Does **not** replicate the entire database or handle low-level storage replication.

### How to enable the sync plugin

To enable the sync plugin, add a `sync` field to your CMS configuration (e.g., `cms.json` or your options object). Specify the resources you want to synchronize:

```json
{
  "sync": {
    "resources": [
      "articles",
      "comments"
    ]
  }
}
```

You can add this field alongside your other configuration options. Only the resources listed will be synchronized.

### How to disable the sync plugin

To disable the sync plugin, either remove the `sync` field from your configuration or set it to `null` or an empty object:

```json
{
  "sync": null
}
```
or
```json
{
  "sync": {}
}
```

Alternatively, you can use the `disableSync` option if supported:

```json
{
  "disableSync": true
}
```

### Difference from Replication

- **Sync**: Synchronizes only the specified resources, and is typically used for selective, controlled data sharing.
- **Replication**: (Handled by a different plugin) is intended for more comprehensive, bidirectional database-level replication, including conflict resolution and peer management.

**Note:** The sync plugin is ideal for scenarios where you want to keep certain resources up-to-date between environments (e.g., staging and production) without replicating the entire database.
