<template>
  <v-app>
    <notifications group="notification" position="bottom left" />
    <div class="cms-layout">
      <div>
        <nav-bar />
      </div>
      <div class="cms-inner-layout">
        <div class="resources">
          <locale-list v-if="localeList" :locale-list="localeList" />
          <resource-list :class="{locale:localeList && localeList.length > 1}" :list="resourceList" :plugins="pluginList" :selected-item="selectedResource || selectedPlugin" @selectItem="selectResource" />
        </div>
        <div class="records">
          <template v-if="selectedResource && (!selectedResource.view || selectedResource.view == 'list')">
            <record-list v-if="selectedResource" :list="recordList" :locale="locale" :selected-item="selectedRecord"
                         :resource="selectedResource"
                         :multiselect="multiselect"
                         :multiselect-items="multiselectItems"
                         @selectItem="selectRecord"
                         @changeMultiselectItems="onChangeMultiselectItems"
                         @selectMultiselect="onSelectMultiselect"
            />
            <record-editor v-if="selectedRecord" :key="selectedRecord._id" :resource-list="resourceList" :record.sync="selectedRecord" :resource="selectedResource" :locale.sync="locale"
                           :user-locale="TranslateService.locale" @updateRecordList="updateRecordList"
            />
          </template>
          <record-table v-if="selectedResource && selectedResource.view == 'table'" :record-list="recordList" :resource-list="resourceList" :resource="selectedResource" :record.sync="selectedRecord" :locale.sync="locale"
                        :user-locale="TranslateService.locale"
                        @unsetRecord="unsetSelectedRecord" @updateRecordList="updateRecordList"
          />
          <plugin-page v-if="selectedPlugin" :plugin="selectedPlugin" />

          <multiselect-page v-if="selectedResource && multiselect"
                            :multiselect-items="multiselectItems"
                            :locale="locale"
                            :resource="selectedResource"
                            :record-list="recordList"
                            @cancel="onCancelMultiselectPage"
                            @changeMultiselectItems="onChangeMultiselectItems"
                            @updateRecordList="updateRecordList"
          />

          <button-counter />
        </div>
      </div>
    </div>
    <loading :class="{active:LoadingService.isShow}" />
  </v-app>
</template>

<script>
import axios from 'axios/dist/axios.min'
import _ from 'lodash'
import pAll from 'p-all'

import Loading from './Loading.vue'
import LocaleList from './LocaleList.vue'
import ResourceList from './ResourceList.vue'
import RecordList from './RecordList.vue'
import RecordEditor from './RecordEditor.vue'
import RecordTable from './RecordTable.vue'
import LoadingService from '../services/LoadingService'
import ConfigService from '../services/ConfigService'
import TranslateService from '../services/TranslateService'
import ResourceService from '../services/ResourceService'

export default {
  components: {
    ResourceList,
    RecordList,
    RecordEditor,
    Loading,
    LocaleList,
    RecordTable
  },
  data () {
    return {
      locale: 'enUS',
      resourceList: [],
      selectedResource: null,
      localeList: [],
      recordList: [],
      selectedRecord: null,
      selectedPlugin: null,
      LoadingService,
      TranslateService,
      user: null,
      multiselect: false,
      multiselectItems: []
    }
  },
  computed: {
    pluginList () {
      let list = _.filter(window.plugins, (item) => {
        if (_.isUndefined(item.allowed)) {
          return true
        }
        if (_.isEmpty(this.user)) return false
        return _.includes(item.allowed, this.user.group)
      })
      return list
    }
  },
  watch: {
    '$route': function () {
      if (this.$route.query.id != null) {
        this.selectResource(_.find(_.union(this.pluginList, this.resourceList), {title: this.$route.query.id}))
      }
    }
  },
  mounted () {
    this.$loading.start('init')
    this.$nextTick(async () => {
      await ConfigService.init()
      await TranslateService.init()
      try {
        const userResponse = await axios.get('./me')
        this.user = userResponse.data
      } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', error.message)
        this.$notify({
          group: 'notification',
          type: 'error',
          text: errorMessage
        })
        throw error
      }
      const resourcesResponse = await axios.get('./resources')
      this.$loading.stop('init')
      this.resourceList = _.sortBy(resourcesResponse.data, item => item.title)
      this.resourceList = _.filter(this.resourceList, resource => {
        if (_.isUndefined(resource.allowed)) {
          return true
        }
        return _.includes(resource.allowed, this.user.group)
      })
      ResourceService.setSchemas(this.resourceList)
      this.localeList = TranslateService.config.locales
      if (this.$route.query.id != null) {
        this.selectResource(_.find(_.union(this.pluginList, this.resourceList), {title: this.$route.query.id}))
      }
    })
  },
  methods: {
    async selectResource (resource) {
      try {
        if (_.get(this.$router, 'history.current.query.id', false) !== resource.title) {
          this.$router.push({query: {id: resource.title}}).catch(error => console.error('Router throw an error:', error))
        }
        if (resource.type === 'plugin') {
          this.selectedResource = null
          this.selectedPlugin = resource
          return
        }
        this.selectedResource = resource
        this.selectedPlugin = null
        this.recordList = null
        this.selectedRecord = null
        if (!this.selectedResource) {
          return
        }
        this.locale = _.first(this.selectedResource.locales)

        this.$loading.start('selectResource')
        await this.cacheRelatedResources(resource)
        const data = ResourceService.get(resource.title)
        this.$loading.stop('selectResource')
        this.recordList = _.sortBy(data, item => -item._updatedAt)

        if (_.get(resource, 'maxCount', 0) === 1) {
          const first = _.get(this.recordList, '[0]', false)
          if (!first) {
            this.selectRecord({ _local: true })
          } else {
            this.selectRecord(first)
          }
        }
      } catch (error) {
        console.error('Error happen during selectResource:', error)
      }
    },
    async cacheRelatedResources (resource) {
      let resources = _.union([resource.title], _.values(resource.extraSources))

      const extraResrouces = (obj) => {
        if (_.isArray(obj)) {
          _.each(obj, item => {
            extraResrouces(item)
          })
        } else {
          _.each(obj, (value, key) => {
            switch (key) {
              case 'input': {
                const extraSources = _.get(obj, 'options.extraSources')
                resources.push(..._.values(extraSources))
                switch (value) {
                  case 'select':
                  case 'multiselect':
                    const source = _.get(obj, 'source')
                    if (_.isString(source)) {
                      resources.push(source)
                      const schema = ResourceService.getSchema(source)
                      resources.push(..._.values(schema.extraSources))
                    }
                    break
                  case 'paragraph':
                    _.each(_.get(obj, 'options.types'), item => {
                      extraResrouces(item)
                      const paragraphSchema = _.get(item, 'schema')
                      extraResrouces(paragraphSchema)
                    })
                }
                break
              }
              case 'extraSources':
                resources.push(..._.values(value))
            }
          })
        }
      }
      extraResrouces(resource.schema)
      resources = _.uniq(resources)

      await pAll(_.map(resources, item => {
        return async () => await ResourceService.cache(item)
      }), {concurrency: 10})
    },
    selectRecord (record) {
      this.selectedRecord = record
    },
    onSelectMultiselect (isMultiselect) {
      this.multiselect = isMultiselect
      if (isMultiselect) {
        this.unsetSelectedRecord()
      }
    },
    onChangeMultiselectItems (items) {
      this.multiselectItems = _.clone(items)
    },
    async updateRecordList (record) {
      try {
        this.$loading.start('updateRecordList')
        const data = await ResourceService.cache(this.selectedResource.title)
        this.$loading.stop('updateRecordList')
        this.recordList = _.sortBy(data, item => -item._updatedAt)
        this.selectRecord(_.find(this.recordList, { _id: _.get(record, '_id') }))
      } catch (error) {
        console.error('Error happen during updateRecordList:', error)
      }
    },
    unsetSelectedRecord () {
      this.selectedRecord = null
    },
    onCancelMultiselectPage () {
      this.multiselect = false
      this.multiselectItems = []
    }
  }
}
</script>
<style lang="scss">
.cms-layout {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  overflow: auto;
  .cms-inner-layout {
    display: flex;
    align-items: stretch;
    flex: 1 1 0;
    .resources {
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      align-items: stretch;
      flex-grow: 0;
      width: 270px;
      border-right: 1px solid #c7c7c7;
      overflow: hidden;
      .title {
        padding: 4px;
        text-transform: capitalize;
        font-weight: bold;
        color: black;
      }
      ul {
        border-bottom: 1px solid #c7c7c7;
        padding: 1px;
        li {
          padding: 4px 12px;
          cursor: pointer;
          user-select: none;
          .icon {
            width: 16px;
            height: 16px;
            display: inline-block;
            background: #6af;
            box-shadow: 0px 0px 0px 1px #06d inset;
            border-radius: 2px;
            vertical-align: -2px;
            margin-right: 10px;
          }
          &:hover {
            background-color: #eff;
            box-shadow: 0px 0px 1px 0px #09f inset;
          }
          &.selected {
            font-weight: bold;
            background-color: #f1ffee;
            color: #4c4c4c;
            box-shadow: 0px 0px 1px 0px #008a00 inset;
            cursor: auto;
          }
          &.selected .icon {
              background: #2ac12a;
              box-shadow: 0px 0px 0px 1px #008a00 inset;
          }
        }
      }
    }
    .records {
      flex: 1 1 0;
      display: flex;
      align-items: stretch;
      overflow-y: auto;
    }
  }
}

</style>
