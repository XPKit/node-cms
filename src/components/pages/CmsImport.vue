<template>
  <div class="plugin-wrapper">
    <div class="plugin-title">
      <h5>Cms Import</h5>
    </div>
    <v-card elevation="0" class="cms-import">
      <div class="main-container">
        <div class="config-resources">
          <h5>Resources</h5>
          <v-chip-group v-if="config && config.resources" column>
            <v-chip
              v-for="(item, index) in config.resources" :key="`resource-${index}`"
              size="small" :ripple="false"
            >
              {{ item }}
            </v-chip>
          </v-chip-group>
        </div>
        <div class="divider dashed" />
        <h5>Actions</h5>
        <div>
          <v-btn rounded density="compact" @click="openFile()">Edit Google Sheet</v-btn>
          <div class="other-actions">
            <v-btn rounded density="compact" :disabled="loading" @click="checkStatus()">Check Difference</v-btn>
            <v-btn rounded density="compact" :disabled="loading" @click="execute()">Import from Remote</v-btn>
          </div>
        </div>
        <div class="divider dashed" />
        <h5>Upload Xlsx</h5>
        <div class="subtext">Import Excel</div>
        <v-card
          class="file-input-card" elevation="0" :class="{ 'drag-and-drop': dragover, bold: uploadedXlsx && uploadedXlsx.name }"
          @drop.prevent="onDrop($event)" @dragover.prevent="dragover = true" @dragenter.prevent="dragover = true" @dragleave.prevent="dragover = false"
        >
          <template v-if="!uploadedXlsx">Click or drag & drop to import an .xlsx file</template>
          <template v-else>{{ uploadedXlsx.name }}</template>
          <v-file-input
            ref="xlsxFile" accept=".xlsx, .xls, .csv"
            :rules="getRules()" class="hidden-field" flat density="compact" hide-details @change="onChangeXlsxFile"
          />
        </v-card>
        <div class="other-actions margin-top">
          <v-btn rounded density="compact" :disabled="loading || !uploadedXlsx" @click="checkXlsxStatus()">Check Difference</v-btn>
          <v-btn rounded density="compact" :disabled="loading || !uploadedXlsx" @click="executeXlsx()">Import from Remote</v-btn>
        </div>
        <div v-if="status || error">
          <h6 v-if="type == 0">Difference:</h6>
          <h6 v-else>Status:</h6>
          <div v-if="status" class="status">
            <div v-for="(item, resource) in status" :key="`status-item-${resource}`" class="status-resource">
              <strong>{{ resource }}:</strong>
              <p>create: {{ item.create || 0 }}</p>
              <p>update: {{ item.update || 0 }}</p>
              <p>remove: {{ item.remove || 0 }}</p>
            </div>
          </div>
          <pre v-else-if="error" v-html="error" />
        </div>
      </div>
    </v-card>
  </div>
</template>

<script>
import RequestService from '@s/RequestService'
import _ from 'lodash'
export default {
  data () {
    return {
      config: null,
      status: null,
      error: null,
      type: 0,
      loading: false,
      uploadedXlsx: null,
      dragover: false
    }
  },
  async mounted () {
    const data = await RequestService.get('./config')
    this.config = data.import
  },
  methods: {
    getRules () {
      return [
        (value) => !value || value.type === 'text/xlsx' || value.type === 'text/xls' || value.type === 'text/csv' || 'Only XLSX/XLS/CSV files allowed'
      ]
    },
    onDrop (event) {
      this.dragover = false
      const files = _.get(event, 'dataTransfer.files', [])
      if (files.length > 1) {
        console.error('Only one file can be uploaded at a time.')
        return
      }
      this.onChangeXlsxFile(event, files)
    },
    async onChangeXlsxFile (event, files = false) {
      this.uploadedXlsx = null
      const file = _.first(files || _.get(event, 'target.files', event)) || event
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
      await this.$nextTick()
      try {
        this.status = await RequestService.get('../import/status')
      } catch (error) {
        this.status = null
        this.error = _.get(error, 'message', error)
      }
      this.$loading.stop('cms-import')
      this.loading = false
    },
    async execute () {
      this.loading = true
      this.status = null
      this.error = null
      this.type = 1
      this.$loading.start('cms-import')
      await this.$nextTick()
      try {
        this.status = await RequestService.get('../import/execute')
      } catch (error) {
        this.status = null
        this.error = _.get(error, 'message', error)
      }
      this.$loading.stop('cms-import')
      this.loading = false
    },
    async checkXlsxStatus () {
      this.loading = true
      this.status = null
      this.error = null
      this.$loading.start('xlsx-import')
      this.type = 0
      await this.$nextTick()
      try {
        const formData = new FormData()
        formData.append('xlsx', this.uploadedXlsx)
        this.status = await RequestService.post('../import/statusXlsx', formData)
      } catch (error) {
        this.status = null
        this.error = _.get(error, 'message', error)
      }
      this.$loading.stop('xlsx-import')
      this.loading = false
    },
    async executeXlsx () {
      this.loading = true
      this.status = null
      this.error = null
      this.type = 1
      this.$loading.start('xlsx-import')
      await this.$nextTick()
      try {
        const formData = new FormData()
        formData.append('xlsx', this.uploadedXlsx)
        this.status = await RequestService.post('../import/statusXlsx', formData)
      } catch (error) {
        this.status = null
        this.error = _.get(error, 'message', error)
      }
      this.$loading.stop('xlsx-import')
      this.loading = false
    }
  }
}
</script>

<style lang="scss" scoped>
@use '@a/scss/variables.scss' as *;
@use '@a/scss/mixins.scss' as *;
.cms-import {
  margin: 16px;
  padding: 16px;
  background-color: $layout-card-background;
  border-radius: 12px;
  h5 {
    @include h5;
    margin-bottom: 8px;
  }
  h6 {
    @include h6;
  }
  .divider {
    border-bottom: 1px solid $imag-grey;
    margin: 16px 0;
    &.dashed {
      border-bottom: 1px dashed $imag-grey;
    }
  }
  .other-actions {
    .v-btn {
      margin-bottom: 0;
    }
    &.margin-top {
      margin-top: 16px;
    }
  }
  .v-btn {
    background-color: $cms-import-btn-background !important;
    color: $cms-import-btn-color !important;
    margin-bottom: 16px;
  }
  .v-btn + .v-btn {
    margin-left: 8px;
  }
   .subtext {
    padding-left: 16px;
  }
  .v-btn__content {
    text-transform: none;
  }
  .file-input-card {
    cursor: pointer;
    background-color: $imag-light-grey;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
    user-select: none;
    &.bold {
      font-weight: bold;
    }
    &.drag-and-drop {
      background-color: $imag-grey;
    }
  }
  .hidden-field {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    user-select: none;
  }
  .v-slide-group__content {
    padding: 0 !important;
  }
  .v-chip, .subtext {
    @include subtext;
  }
  .v-chip {
    background-color: $cms-import-resource-background !important;
    color: $cms-import-resource-color !important;
    padding: 4px 8px;
    .v-chip__content {
      padding: 0;
      line-height: 1;
    }
  }
}
/*
  $cms-import-title-background: var(--cms-import-resource-background);
  $cms-import-title-color: var(--cms-import-resource-color);
  $cms-import-section-background: var(--cms-import-section-background);
  $cms-import-section-color: var(--cms-import-section-color);
  $cms-import-resource-background: var(--cms-import-resource-background);
  $cms-import-resource-color: var(--cms-import-resource-color);
  $cms-import-btn-background: var(--cms-import-btn-background);
  $cms-import-btn-color: var(--cms-import-btn-color);
*/

</style>

<style lang="scss">
@use '@a/scss/variables.scss' as *;
@use '@a/scss/mixins.scss' as *;

.cms-import {
  .v-btn__content {
    text-transform: none;
    letter-spacing: 0;
    @include h6;
    font-weight: 700;
    font-style: normal;
  }
  .status {
    margin-left: 8px;
  }
  .status-resource {
    strong {
      font-size: 14px;
      font-synthesis: initial !important;
    }
    p {
      font-size: 12px;
      margin-left: 8px;
    }
  }
}
</style>
