<template>
  <div class="sync-resources main">
    <h1>Sync Resources</h1>
    <div v-if="config">
      <select v-model="selectedResource" @change="onChangeResource">
        <option v-for="item in config.sync.resources" :key="item" :value="item">{{ item }}</option>
      </select>
      <div v-if="!isEmpty(recordData)" class="num-records">
        <span>number of records</span>
        <div class="num-records-wrapper">
          <div v-for="env in environments" :key="env" class="num-record" :num="environments.length">
            <span>{{ env }}</span>
            <span>{{ get(recordData, `${env}.length`, 'N/A') }}</span>
          </div>
        </div>
      </div>
      <div v-if="!isEmpty(reportData)" class="num-records">
        <span>records difference</span>
        <div class="num-records-wrapper">
          <div class="num-record" num="1" :set="enabled = get(recordData, `local.length`) !== undefined && get(recordData, `remote.length`) !== undefined">
            <template v-if="enabled">
              <template v-if="get(syncStatus, 'local.status') !== 'syncing' && get(syncStatus, 'remote.status') !== 'syncing'">
                <span>local / remote</span>
                <span>create: {{ reportData.create }}</span>
                <span>update: {{ reportData.update }}</span>
                <span>remove: {{ reportData.remove }}</span>
                <span v-if="includes(get(syncStatus,'remote.allows'), 'write')"><button @click="onClickDeploy('local', 'remote')">push to remote</button></span>
                <span v-if="includes(get(syncStatus,'local.allows'), 'write')"><button @click="onClickDeploy('remote', 'local')">pull from remote</button></span>
              </template>
              <template v-if="get(syncStatus, 'local.status') === 'syncing'">
                <span>resource: {{ get(syncStatus, `local.resource`) }}</span>
                <span>created: {{ get(syncStatus, `local.created`) }} / {{ get(syncStatus, `local.createTotal`) }}</span>
                <span>updated: {{ get(syncStatus, `local.updated`) }} / {{ get(syncStatus, `local.updateTotal`) }}</span>
                <span>removed: {{ get(syncStatus, `local.removed`) }} / {{ get(syncStatus, `local.removeTotal`) }}</span>
              </template>
              <template v-if="get(syncStatus, 'remote.status') === 'syncing'">
                <span>resource: {{ get(syncStatus, `remote.resource`) }}</span>
                <span>created: {{ get(syncStatus, `remote.created`) }} / {{ get(syncStatus, `remote.createTotal`) }}</span>
                <span>updated: {{ get(syncStatus, `remote.updated`) }} / {{ get(syncStatus, `remote.updateTotal`) }}</span>
                <span>removed: {{ get(syncStatus, `remote.removed`) }} / {{ get(syncStatus, `remote.removeTotal`) }}</span>
              </template>
            </template>
            <span v-if="!enabled" class="na-field">
              N/A
            </span>
          </div>
        </div>
      </div>
    </div>
    <div v-if="error" class="bg-error">
      Error: {{ error }}
    </div>
  </div>
</template>

<script>
import RequestService from '@s/RequestService'
import _ from 'lodash'
import pAll from 'p-all'

export default {
  data () {
    return {
      statusInterval: null,
      error: null,
      config: null,
      selectedResource: null,
      recordData: {},
      reportData: {},
      syncStatus: {},
      uniqueKeyMap: {},
      environments: ['local', 'remote'],
      syncingEnvironment: null,
      isEmpty: _.isEmpty,
      get: _.get,
      includes: _.includes
    }
  },
  unmounted () {
    if (this.statusInterval) {
      clearInterval(this.statusInterval)
    }
  },
  async mounted () {
    let data = await RequestService.get(`${window.location.pathname}resources`)
    _.each(data, resource => {
      let uniqueKeyField = _.find(resource.schema, {unique: true})
      if (uniqueKeyField) {
        this.uniqueKeyMap[resource.title] = uniqueKeyField.field
      }
    })
    this.config = await RequestService.get(`${window.location.pathname}/config`)
    if (this.selectedResource) {
      this.update()
    }
    this.statusInterval = setInterval(async () => {
      if (this.selectedResource) {
        try {
          await pAll(_.map(['local', 'remote'], env => {
            return async () => {
              try {
                this.syncStatus[env] = await RequestService.get(`${window.location.pathname}/sync/${env}/${this.selectedResource}/status`)
                this.syncStatus = _.clone(this.syncStatus)
              } catch (error) {
                console.error(error)
              }
            }
          }))
        } catch (error) {}

        const result = _.find(this.syncStatus, {status: 'syncing'})
        if (!result && this.syncingEnvironment) {
          this.$loading.stop('deploy-resource')
          if (result && result.status === 'error') {
            this.error = result.error
          }
          this.syncingEnvironment = false
          this.update()
        }
      }
    }, 5 * 1000)
  },
  methods: {
    onChangeResource () {
      this.update()
    },
    async update () {
      this.$loading.start('loading-resource')
      try {
        const uniqueKey = this.uniqueKeyMap[this.selectedResource]
        this.recordData = {}
        this.reportData = {}
        await pAll(_.map(this.environments, env => {
          return async () => {
            try {
              let data = await RequestService.get(`${window.location.pathname}sync/${env}/${this.selectedResource}`)
              _.set(this.recordData, env, data)
              data = await RequestService.get(`${window.location.pathname}sync/${env}/${this.selectedResource}/status`)
              _.set(this.syncStatus, env, data)
              this.syncStatus = _.clone(this.syncStatus)
            } catch (error) {
              console.error(error)
            }
          }
        }), {concurrency: 1})
        this.recordData = _.clone(this.recordData)
        const fromData = this.recordData.local
        const toData = this.recordData.remote
        const fromKeys = _.map(fromData, item => item[uniqueKey])
        const toKeys = _.map(toData, item => item[uniqueKey])
        let updateKeys = _.intersection(fromKeys, toKeys)
        updateKeys = _.filter(updateKeys, key => {
          let fromItem = _.find(fromData, item => (item[uniqueKey]) === key)
          let toItem = _.find(toData, item => (item[uniqueKey]) === key)
          fromItem._attachments = _.map(fromItem._attachments, item => _.omit(item, ['url']))
          toItem._attachments = _.map(toItem._attachments, item => _.omit(item, ['url']))
          return !_.isEqual(fromItem, toItem)
        })
        if (!_.isEmpty(updateKeys)) {
          _.each(updateKeys, key => {
            console.log(key, 'local', _.find(fromData, {[uniqueKey]: key}), 'remote', _.find(toData, {[uniqueKey]: key}))
          })
        }
        this.reportData = {
          create: _.difference(fromKeys, toKeys).length,
          remove: _.difference(toKeys, fromKeys).length,
          update: updateKeys.length
        }
      } catch (error) {
        console.error(error)
      }
      this.$loading.stop('loading-resource')
    },
    async onClickDeploy (from, to) {
      this.error = null
      this.$loading.start('deploy-resource')

      this.syncingEnvironment = true
      try {
        await RequestService.post(`../sync/${this.selectedResource}/from/${from}/to/${to}`)
        _.set(this.syncStatus, `${to}.status`, 'syncing')
        this.syncStatus = _.clone(this.syncStatus)
      } catch (error) {
        console.error(error)
        this.syncingEnvironment = false
        this.$loading.stop('deploy-resource')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.main {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 10px 0;
  margin: 0 20px;
  box-sizing: border-box;
  flex: 1 1 0;
  overflow-y: auto;
  font-size: 14px;
  font-family: arial;
}

h1 {
  margin-top: 0;
}

.error {
    color: red;
  }

.num-records {
  width: calc(100% - 20px);
  margin: 20px 0px;
  border: 1px grey solid;
  >span {
    background-color: grey;
    display: block;
    padding: 5px;
    text-align: center;
    color: white;
  }
  .num-records-wrapper {
    display: flex;
    padding: 0px;
    margin: 0px;
    .num-record {
      width: 20%;
      text-align: center;
      // border: 1px grey solid;

      &[num="1"] {
        width: 100%;
      }
      &[num="2"] {
        width: 50%;
      }
      &[num="3"] {
        width: 33.3%;
      }
      &[num="4"] {
        width: 25%;
      }

      span {
        padding: 5px;
        display: block;
        height: 20px;
        border-right: 1px grey solid;
        &:first-child {
          background-color: #ddd;
          border-bottom: 1px grey solid;
        }
      }
      .na-field {
        line-height: 100px;
        height: 100px;
        display: block;
      }
      &:last-child {
        span {
          border-right: 0px grey solid;
        }
      }
      button {
        width: 100%;
      }
    }
  }
}
</style>
