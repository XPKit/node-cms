<template>
  <v-app>
    <v-theme-provider :theme="getTheme()">
      <v-snackbar
        v-model="showSnackBar" transition="scroll-y-reverse-transition" multi-line
        location="centered" class="notification elevation-10" :timeout="notification.type === 'error' ? -1 : 1000" :class="getNotificationClass()" @update:modelValue="resetNotification()"
      >
        <p>{{ notification.message }}</p>
        <template #actions>
          <v-btn rounded @click="resetNotification()">
            <v-icon>mdi-close-circle-outline</v-icon>
          </v-btn>
        </template>
      </v-snackbar>
      <div v-if="user" class="cms-layout">
        <div class="cms-inner-layout">
          <nav-bar
            v-if="resourceList.length > 0" :config="config" :toolbar-title="toolbarTitle" :locale-class="{locale:localeList && localeList.length > 1}" :select-resource-group-callback="selectResourceGroup" :select-resource-callback="selectResource" :grouped-list="groupedList" :selected-resource-group="selectedResourceGroup"
            :selected-item="selectedResource || selectedPlugin"
          />
          <div class="resources">
            <locale-list v-if="localeList" :locale-list="localeList" />
          </div>
          <div class="records">
            <template v-if="selectedResource && (!selectedResource.view || selectedResource.view == 'list')">
              <record-list
                v-if="selectedResource" :list="recordList" :num-records="numRecords" :locale="locale" :selected-item="selectedRecord"
                :grouped-list="groupedList"
                :resource-group="selectedResourceGroup" :resource="selectedResource" :select-resource-callback="selectResource"
                :multiselect="multiselect" :multiselect-items="multiselectItems"
                @selectItem="selectRecord"
                @changeMultiselectItems="onChangeMultiselectItems"
                @selectMultiselect="onSelectMultiselect"
                @updateRecordList="updateRecordList"
              />
              <record-editor
                v-if="selectedRecord && !multiselect" :key="selectedRecord._id" v-model:record="selectedRecord" v-model:locale="locale" :resource="selectedResource"
                :user-locale="TranslateService.locale" @updateRecordList="updateRecordList"
              />
            </template>
            <record-table
              v-else-if="selectedResource && selectedResource.view == 'table'"
              v-model:record="selectedRecord" v-model:locale="locale" :grouped-list="groupedList" :resource-group="selectedResourceGroup" :select-resource-callback="selectResource" :record-list="recordList" :resource="selectedResource" :user-locale="TranslateService.locale"
              @unsetRecord="unsetSelectedRecord" @updateRecordList="updateRecordList"
            />
            <plugin-page v-if="selectedPlugin" :plugin="selectedPlugin" />
          </div>
          <loading v-if="LoadingService.isShow" />
        </div>
      </div>
    </v-theme-provider>
  </v-app>
</template>

<script>
import _ from 'lodash'

import LoadingService from '@s/LoadingService'
import NotificationsService from '@s/NotificationsService'
import LoginService from '@s/LoginService'
import ConfigService from '@s/ConfigService'
import TranslateService from '@s/TranslateService'
import ResourceService from '@s/ResourceService'
import Notification from '@m/Notification.vue'
import Loading from '@c/Loading.vue'
import LocaleList from '@c/LocaleList.vue'
import NavBar from '@c/NavBar.vue'
import RecordList from '@c/RecordList.vue'
import RecordEditor from '@c/RecordEditor.vue'
import RecordTable from '@c/RecordTable.vue'
import RequestService from '@s/RequestService'

export default {
  components: {
    NavBar,
    RecordList,
    RecordEditor,
    Loading,
    LocaleList,
    RecordTable
  },
  mixins: [Notification],
  data () {
    return {
      config: false,
      paging: 12,
      locale: 'enUS',
      resourceList: [],
      selectedResource: null,
      localeList: [],
      recordList: [],
      numRecords: 0,
      notification: {},
      showSnackBar: false,
      toolbarTitle: false,
      selectedResourceGroup: null,
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
    groupedList () {
      const others = { name: 'TL_OTHERS' }
      const plugins = { name: 'TL_PLUGINS' }
      let groups = [others, plugins]
      let list = _.union(this.resourceList, _.map(this.pluginList, (item) => _.extend(item, {type: 'plugin'})))
      _.each(list, (item) => {
        if (_.isEmpty(item.group)) {
          return
        }
        if (!_.isString(item.group)) {
          const oldGroup = _.find(groups, (group) => {
            if (_.isEqual(group.name, item.group)) {
              return group
            }
          })
          if (!oldGroup) {
            groups.push({ name: item.group })
          }
        }
      })
      _.each(list, (item) => {
        if (_.isEmpty(item.group)) {
          return
        }
        if (_.isString(item.group)) {
          const oldGroup = _.find(groups, (group) => {
            if (group === item.group) {
              return group
            }
            if (group.name === item.group) {
              return group
            }
            if (_.includes(_.values(group.name), item.group)) {
              return group
            }
          })
          if (!oldGroup) {
            groups.push({ name: item.group })
          }
        }
      })
      _.each(list, (item) => {
        const oldGroup = _.find(groups, (group) => {
          if (_.isEqual(group.name, item.group) || group === item.group || group.name === item.group || _.includes(_.values(group.name), item.group)) {
            return group
          }
        })
        if (oldGroup) {
          oldGroup.list = oldGroup.list || []
          oldGroup.list.push(item)
          return
        }
        if (item.type === 'plugin') {
          plugins.list = plugins.list || []
          plugins.list.push(item)
        } else {
          others.list = others.list || []
          others.list.push(item)
        }
      })
      groups = _.orderBy(groups, (item) => {
        if (item.name === 'CMS') {
          return String.fromCharCode(0x00)
        } else if (item === others) {
          return String.fromCharCode(0xff)
        }
        return `${TranslateService.get(item.name, 'enUS')}`.toLowerCase()
      }, 'asc')
      return _.filter(groups, (group) => group.list && group.list.length !== 0)
    },
    pluginList () {
      let list = _.filter(window.plugins, (item) => {
        if (_.isUndefined(item.allowed)) {
          return true
        }
        if (_.isEmpty(this.user)) {
          return false
        }
        return _.includes(item.allowed, this.user.group)
      })
      return list
    }
  },
  watch: {
    '$route': function () {
      if (this.$route.query.id != null) {
        const allResources = _.union(this.pluginList, this.resourceList)
        if (allResources.length > 0) {
          this.selectResource(_.find(allResources, {title: this.$route.query.id}))
        }
      }
    }
  },
  unmounted () {
    NotificationsService.events.off('notification', this.onGetNotification)
  },
  mounted () {
    this.$loading.start('init')
    LoginService.onLogout(() => {
      console.info('User logged out')
      window.location.reload()
    })
    NotificationsService.events.on('notification', this.onGetNotification)
    this.$nextTick(async () => {
      await ConfigService.init()
      this.config = ConfigService.config
      this.paging = _.get(this.config, 'defaultPaging', this.paging)
      await TranslateService.init()
      this.setToolbarTitle()
      const noLogin = _.get(window, 'noLogin', false)
      if (noLogin) {
        this.user = {}
      } else {
        LoginService.init()
        try {
          this.user = await LoginService.getStatus()
          const isDark = _.get(this.user, 'theme', 'light') === 'dark'
          this.$vuetify.theme.dark = isDark
          this.$forceUpdate()
        } catch (error) {
          const errorMessage = _.get(error, 'response.data.message', error.message)
          this.notify(errorMessage, 'error')
          throw error
        }
      }
      try {
        const data = await RequestService.get(`${window.location.pathname}resources`)
        this.$loading.stop('init')
        const resourceList = _.sortBy(data, item => item.title)
        this.resourceList = _.filter(resourceList, resource => {
          if (_.isUndefined(resource.allowed)) {
            return true
          }
          return _.includes(resource.allowed, this.user.group)
        })
        ResourceService.setSchemas(this.resourceList)
        this.localeList = TranslateService.config.locales
        if (this.$route.query.id != null) {
          const resource = _.find(_.union(this.pluginList, this.resourceList), {title: this.$route.query.id})
          this.selectResource(resource)
        }
      } catch (error) {
        console.error('Error while getting resources: ', error)
        LoginService.logout()
      }
    })
  },
  methods: {
    getTheme () {
      return _.get(this.$vuetify, 'theme.dark', false) ? 'dark' : 'light'
    },
    resetNotification () {
      this.showSnackBar = false
    },
    setToolbarTitle () {
      this.toolbarTitle = _.get(ConfigService.config, `toolbarTitle.${TranslateService.locale}`, _.get(ConfigService.config, 'toolbarTitle', false))
    },
    onGetNotification (data) {
      this.notification = data
      this.showSnackBar = true
      // console.warn('received notification !', data)
    },
    getNotificationClass () {
      return `notification-${this.notification.type}`
    },
    async selectResourceGroup (resourceGroup) {
      this.selectedResourceGroup = resourceGroup
    },
    async selectResource (resource) {
      if (_.isUndefined(resource)) {
        return
      }
      try {
        if (_.get(this.$router, 'history.current.query.id', false) !== resource.title) {
          this.$router.push({query: {id: resource.title}}).catch(error => console.error('Router throw an error:', error))
        }
        if (resource.type === 'plugin') {
          this.selectedResource = null
          this.selectedPlugin = resource
          return
        }
        this.onCancelMultiselectPage()
        this.selectedResource = resource
        this.selectedPlugin = null
        this.recordList = null
        this.selectedRecord = null
        if (!this.selectedResource) {
          return
        }
        this.locale = _.first(this.selectedResource.locales)
        this.$loading.start('selectResource')
        this.paging = _.get(resource, 'paging', this.paging)
        const data = await ResourceService.cache(resource.title, this.paging, 1)
        await this.getExtraSources()
        const records = _.get(data, 'records', data)
        this.recordList = _.sortBy(records, item => -item._updatedAt)
        this.numRecords = _.get(data, 'numRecords', 0)
        if (_.get(resource, 'maxCount', 0) === 1) {
          this.selectRecord(_.get(this.recordList, '[0]', false) || { _local: true })
        }
        this.$loading.stop('selectResource')
      } catch (error) {
        console.error('Error happen during selectResource:', error)
      }
    },
    async getExtraSources () {
      this.emptyRelatedResourcesCache()
      return await ResourceService.getExtraSources(this.selectedResource)
    },
    emptyRelatedResourcesCache () {
      console.warn('emptyRelatedResourcesCache')
      let resources = _.values(this.selectedResource.extraSources)
      _.each(resources, (resource)=> {
        const schema = ResourceService.getSchema(resource)
        ResourceService.removeFromCache(resource, schema.paging)
      })
    },
    async selectRecord (record) {
      this.emptyRelatedResourcesCache()
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
    async updateRecordList (record, limit = -1, page = 1, query = false, sift = false) {
      try {
        console.warn(`update record list - ${limit} - ${page}`, query, sift)
        this.$loading.start('updateRecordList')
        this.paging = _.get(this.selectResource, 'paging', this.paging)
        // TODO: hugo - if we have query or sift, we send a search request to backend
        const data = await ResourceService.cache(this.selectedResource.title, this.paging, page)
        const records = _.get(data, 'records', data)
        this.recordList = _.uniqBy(_.concat(this.recordList || [], records), (item)=> item._id)
        this.recordList = _.sortBy(this.recordList, item => -item._updatedAt)
        this.numRecords = _.get(data, 'numRecords', this.recordList.length)
        this.selectRecord(_.find(this.recordList, { _id: _.get(record, '_id') }))
        this.$loading.stop('updateRecordList')
        this.$forceUpdate()
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
@import '@a/scss/variables.scss';
.cms-layout {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  overflow: auto;
  .cms-inner-layout {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    flex: 1 1 0;
    height: 100vh;
    .resources {
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      align-items: stretch;
      flex-grow: 0;
      width: 270px;
      border-right: 1px solid #c7c7c7;
      overflow: hidden;
      .node-cms-title {
        padding: 2px;
        text-transform: capitalize;
        font-weight: bold;
        color: black;
      }
      ul {
        border-bottom: 1px solid #c7c7c7;
        padding: 1px;
        li {
          padding: 0px 12px;
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
      background-color: $record-editor-background;
      flex: 1 1 0;
      display: flex;
      align-items: stretch;
      overflow-y: auto;
    }
  }

  .border-wrapper  {
    border: 1px solid rgba(0,0,0,.42);
    border-radius: 4px;
    z-index: 1;
    overflow: hidden;
    padding-top: 6px;
  }
}
// NOTE: For ordered lists
.flip-list-move {
  transition: transform 0.2s;
}

.no-move {
  transition: transform 0s;
}

.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}
</style>
