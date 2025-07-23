<template>
  <div class="cms-replicator">
    <h2>Replicator Resources</h2>
    <v-btn @click="fetchResources">Refresh</v-btn>
    <v-table>
      <thead>
        <tr>
          <th>Resource</th>
          <th>Type</th>
          <th>Direction</th>
          <th>Peers</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="resource in resources" :key="resource.name">
          <td>{{ resource.name }}</td>
          <td>{{ resource.type }}</td>
          <td>{{ resource.direction }}</td>
          <td>{{ resource.peers.join(', ') }}</td>
          <td>
            <v-btn size="small" @click="syncResource(resource.name)">Sync All</v-btn>
            <v-btn size="small" @click="syncRecordPrompt(resource.name)">Sync Record</v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
    <v-dialog v-model="showDialog">
      <v-card>
        <v-card-title>Sync Record</v-card-title>
        <v-card-text>
          <v-text-field v-model="recordId" label="Record ID" />
        </v-card-text>
        <v-card-actions>
          <v-btn @click="doSyncRecord">Sync</v-btn>
          <v-btn @click="showDialog = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
export default {
  data() {
    return {
      resources: [],
      showDialog: false,
      recordId: '',
      recordResource: ''
    }
  },
  mounted() {
    this.fetchResources()
  },
  methods: {
    async fetchResources() {
      const res = await fetch('/replicator/resources')
      this.resources = await res.json()
    },
    async syncResource(resource) {
      await fetch(`/replicator/sync/${resource}`, { method: 'POST' })
      this.$notify && this.$notify('Sync started for ' + resource)
    },
    syncRecordPrompt(resource) {
      this.recordResource = resource
      this.showDialog = true
      this.recordId = ''
    },
    async doSyncRecord() {
      if (!this.recordId) return
      await fetch(`/replicator/sync/${this.recordResource}/${this.recordId}`, { method: 'POST' })
      this.$notify && this.$notify('Sync started for record ' + this.recordId)
      this.showDialog = false
    }
  }
}
</script>
<style scoped>
.cms-replicator { padding: 2em; }
</style>
