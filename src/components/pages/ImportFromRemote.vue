<template>
  <div class="plugin-wrapper">
    <div class="plugin-title">
      <h5>Import from remote node-cms</h5>
    </div>
    <v-card elevation="0" class="import-from-remote">
      <div class="main-container">
        <!-- TODO: hugo -
          diplay both local and remote URL
            do we add a form to manually enter the remote node-cms's info ?
          should be able to select the resources in common that we want to sync
            for the selected resources, allow to select the records we want to sync
          add a dialog when clicking import btn to confirm the import
        -->
        <div class="local">
          local
        </div>
        <div class="remote">
          remote
        </div>
        <div class="actions">
          <v-btn>Import</v-btn>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script>
// import RequestService from '@s/RequestService'
// import _ from 'lodash'
  export default {
    data () {
      return {

      }
    },
    async mounted () {
      console.warn('MOUNTED')
    },
    methods: {

    }
  }
</script>

<style lang="scss" scoped>
@use '@a/scss/variables.scss' as *;
.import-from-remote {
  .main-container {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    .local, .remote {
      width: 50%;
    }
    .actions {
      width: 100%;
    }
  }
}
</style>
