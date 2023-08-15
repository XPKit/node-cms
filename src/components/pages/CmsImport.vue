<template>
  <div class="cms-import">
    <h3>Cms Import</h3>
    <div class="config-resources">
      <h4>Resources</h4>
      <v-chip-group
        v-if="config && config.resources"
        column
      >
        <v-chip
          v-for="(item, index) in config.resources" :key="index" :ripple="false"
        >
          {{ item }}
        </v-chip>
      </v-chip-group>
    </div>
    <hr>
    <h4>Actions</h4>
    <div>
      <v-btn dense @click="openFile()">Edit Google Sheet</v-btn>
      <div class="other-actions">
        <v-btn dense :disabled="loading" @click="checkStatus()">Check Difference</v-btn>
        <v-btn dense :disabled="loading" @click="execute()">Import from Remote</v-btn>
      </div>
    </div>
    <hr>
    <div>
      <h3>Upload Xlsx</h3>
      <v-file-input ref="xlsxFile" dense hide-details outlined type="file" @change="onChangeXlsxFile" />
      <div class="other-actions">
        <v-btn dense :disabled="loading || !uploadedXlsx" @click="checkXlsxStatus()">Check Difference</v-btn>
        <v-btn dense :disabled="loading || !uploadedXlsx" @click="executeXlsx()">Import from Remote</v-btn>
      </div>
    </div>
    <div v-if="status || error">
      <h4 v-if="type == 0">Difference:</h4>
      <h4 v-else>Status:</h4>
      <pre v-html="status" />
      <pre v-html="error" />
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import axios from 'axios'
export default {
  data () {
    return {
      config: null,
      status: null,
      error: null,
      type: 0,
      loading: false,
      uploadedXlsx: null
    }
  },
  async mounted () {
    const response = await axios('./config')
    this.config = response.data.import
  },
  methods: {
    async onChangeXlsxFile (event) {
      this.uploadedXlsx = null
      const file = _.first(event.target.files)
      if (!file) {
        return
      }
      this.uploadedXlsx = file
    },
    openFile () {
      window.open(`https://docs.google.com/spreadsheets/d/${this.config.gsheetId}/edit`, '_blank').focus()
    },
    async checkStatus () {
      this.loading = true
      this.status = null
      this.error = null
      this.$loading.start('cms-import')
      this.type = 0
      this.$nextTick(async () => {
        try {
          const response = await axios('../import/status')
          this.status = response.data
        } catch (e) {
          this.status = null
          this.error = _.get(e, 'message', e)
        }
        this.$loading.stop('cms-import')
        this.loading = false
      })
    },
    async execute () {
      this.loading = true
      this.status = null
      this.error = null
      this.type = 1
      this.$loading.start('cms-import')
      this.$nextTick(async () => {
        try {
          const response = await axios('../import/execute')
          this.status = response.data
        } catch (e) {
          this.status = null
          this.error = _.get(e, 'message', e)
        }
        this.$loading.stop('cms-import')
        this.loading = false
      })
    },
    async checkXlsxStatus () {
      this.loading = true
      this.status = null
      this.error = null
      this.$loading.start('xlsx-import')
      this.type = 0
      this.$nextTick(async () => {
        try {
          const formData = new FormData()
          formData.append('xlsx', this.uploadedXlsx)
          const response = await axios.post('../import/statusXlsx', formData)
          this.status = response.data
        } catch (e) {
          this.status = null
          this.error = _.get(e, 'message', e)
        }
        this.$loading.stop('xlsx-import')
        this.loading = false
      })
    },
    async executeXlsx () {
      this.loading = true
      this.status = null
      this.error = null
      this.type = 1
      this.$loading.start('xlsx-import')
      this.$nextTick(async () => {
        try {
          const formData = new FormData()
          formData.append('xlsx', this.uploadedXlsx)
          const response = await axios.post('../import/executeXlsx', formData)
          this.status = response.data
        } catch (e) {
          this.status = null
          this.error = _.get(e, 'message', e)
        }
        this.$loading.stop('xlsx-import')
        this.loading = false
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.cms-import {
  padding: 20px;
  height: calc(100% - 25px);
  overflow: scroll;
  h3 {
    margin: 0px;
  }
  h4 {
    margin-bottom: 2px;
  }
  .config-resources {
    ul {
      padding-left: 17px;
      li {
        list-style: circle;
        text-transform: capitalize;
      }
    }
  }
  .config {
    margin-top: 0px;
    background: #f3f3f3;
    padding: 10px;
    border: 1px solid #c7c7c7;
    border-radius: 6px;
    color: green;
    font-size: 11px;
  }
  .other-actions {
    margin-top: 12px;
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .v-file-input {
    max-width: 200px;
  }
  hr {
    margin: 12px 0;
  }
}
</style>
