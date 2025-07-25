<template>
  <v-app :class="{'unclickable': isLoading}">
    <v-theme-provider :theme="getTheme()">
      <v-snackbar
        v-model="showSnackBar" transition="scroll-y-reverse-transition" multi-line
        location="centered" class="notification elevation-10" :timeout="notification.type === 'error' ? -1 : 1000" :class="getNotificationClass()" @update:model-value="resetNotification()"
      >
        <p>{{ notification.message }}</p>
        <template #actions>
          <v-btn rounded @click="resetNotification()">
            <v-icon>mdi-close-circle-outline</v-icon>
          </v-btn>
        </template>
      </v-snackbar>
      <v-dialog v-model="displayDialog" location="centered" max-width="500" class="discard-changes" :class="`event-${recordDialog.event}`" @keydown="cancelDialog">
        <v-card :title="recordDialog.title || $filters.translate('TL_ARE_YOU_SURE_YOU_WANT_TO_DISCARD')">
          <v-card-text v-if="recordDialog.message" class="message">{{ recordDialog.message }}</v-card-text>
          <v-card-actions>
            <v-btn variant="outlined" rounded @click="cancelDialog()">{{ recordDialog.cancel || $filters.translate('TL_CANCEL') }}</v-btn>
            <v-btn variant="outlined" rounded class="apply" @click="confirmDialog()">{{ recordDialog.confirm || $filters.translate('TL_CONFIRM') }}</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <div v-if="user" class="cms-layout">
        <updates-notifier v-if="selectedResource && config && config.wsRecordUpdates" :selected-resource="selectedResource" :selected-record="selectedRecord" @reload-resource="reloadResource" />
        <div class="cms-inner-layout">
          <nav-bar
            v-if="resourceList.length > 0" :config="config" :toolbar-title="toolbarTitle" :locale-class="{locale:localeList && localeList.length > 1}" :select-resource-group-callback="selectResourceGroup" :select-resource-callback="selectResource" :grouped-list="groupedList" :selected-resource-group="selectedResourceGroup"
            :selected-item="selectedResource || selectedPlugin"
          />
          <div class="resources">
            <locale-list v-if="localeList" :locale-list="localeList" />
          </div>
          <div class="records" :class="{'full-width': selectedResource && selectedResource.maxCount === 1}">
            <template v-if="selectedResource && (!selectedResource.view || selectedResource.view == 'list')">
              <record-list
                v-if="selectedResource" :list="recordList" :locale="locale" :selected-item="selectedRecord"
                :grouped-list="groupedList"
                :resource-group="selectedResourceGroup" :resource="selectedResource" :select-resource-callback="selectResource"
                :multiselect="multiselect" :multiselect-items="multiselectItems"
                @select-item="selectRecord"
                @change-multiselect-items="onChangeMultiselectItems"
                @select-multiselect="onSelectMultiselect"
                @update-record-list="updateRecordList"
              />
              <record-editor
                v-if="selectedRecord && !multiselect" :key="selectedRecord._id" v-model:record="selectedRecord" v-model:locale="locale" :resource="selectedResource"
                :user-locale="TranslateService.locale" @update-record-list="updateRecordList"
              />
              <multiselect-page
                v-if="selectedResource && multiselect"
                :multiselect-items="multiselectItems"
                :locale="locale"
                :resource="selectedResource"
                :record-list="recordList"
                @cancel="onCancelMultiselectPage"
                @change-multiselect-items="onChangeMultiselectItems"
                @update-record-list="updateRecordList"
              />
            </template>
            <record-table
              v-if="selectedResource && selectedResource.view == 'table'"
              v-model:record="selectedRecord" v-model:locale="locale" :grouped-list="groupedList" :resource-group="selectedResourceGroup" :select-resource-callback="selectResource" :record-list="recordList" :resource="selectedResource" :user-locale="TranslateService.locale"
              @unset-record="unsetSelectedRecord" @update-record-list="updateRecordList"
            />
            <plugin-page v-if="selectedPlugin" :plugin="selectedPlugin" />
          </div>
          <loading v-if="isLoading" />
        </div>
      </div>
    </v-theme-provider>
  </v-app>
</template>

<script>
import _ from 'lodash'
import pAll from 'p-all'

import LoadingService from '@s/LoadingService'
import NotificationsService from '@s/NotificationsService'
import LoginService from '@s/LoginService'
import ConfigService from '@s/ConfigService'
import TranslateService from '@s/TranslateService'
import ResourceService from '@s/ResourceService'
import Notification from '@m/Notification'
import Loading from '@c/Loading.vue'
import LocaleList from '@c/LocaleList.vue'
import NavBar from '@c/NavBar.vue'
import RecordList from '@c/RecordList.vue'
import MultiselectPage from '@c/MultiselectPage.vue'
import RecordEditor from '@c/RecordEditor.vue'
import RecordTable from '@c/RecordTable.vue'
import UpdatesNotifier from '@c/UpdatesNotifier.vue'

export default {
  components: {
    NavBar,
    RecordList,
    MultiselectPage,
    RecordEditor,
    Loading,
    LocaleList,
    RecordTable,
    UpdatesNotifier
  },
  mixins: [Notification],
  data () {
    return {
      config: false,
      locale: 'enUS',
      resourceList: [],
      selectedResource: null,
      localeList: [],
      recordList: [],
      allowedPlugins: [],
      notification: {},
      showSnackBar: false,
      toolbarTitle: false,
      selectedResourceGroup: null,
      selectedRecord: null,
      selectedPlugin: null,
      isLoading: false,
      TranslateService,
      user: null,
      multiselect: false,
      multiselectItems: [],
      isEditing: false,
      recordDialog: false,
      displayDialog: false
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
            if (group === item.group || group.name === item.group || _.includes(_.values(group.name), item.group)) {
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
      list = _.cloneDeep(list)
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
      const plugins =  _.filter(window.plugins, (item) => {
        if (_.isUndefined(item.allowed)) {
          return true
        }
        return _.isEmpty(this.user) ? false : _.includes(item.allowed, this.user.group)
      })
      return _.filter(plugins, (plugin)=> _.includes(this.allowedPlugins, plugin.displayname))
    }
  },
  watch: {
    '$route': function () {
      if (this.$route.query.id != null) {
        const allResources = this.getResourcesAndPlugins()
        if (allResources.length > 0) {
          this.selectResource(_.find(allResources, {title: this.$route.query.id}))
        }
      }
    }
  },
  unmounted () {
    LoadingService.events.off('has-loading', this.onLoading)
    NotificationsService.events.off('notification', this.onGetNotification)
    window.DialogService.events.off('dialog', this.onGetRecordEdition)
    window.DialogService.events.off('dialog:show', this.onGetRecordEditionShowDialog)
    window.DialogService.events.off('dialog:confirm', this.onGetRecordEditionConfirm)
  },
  async mounted () {
    LoadingService.events.on('has-loading', this.onLoading)
    this.$loading.start('init')
    LoginService.onLogout(() => {
      console.info('User logged out')
      window.location.reload()
    })
    NotificationsService.events.on('notification', this.onGetNotification)
    window.DialogService.events.on('dialog', this.onGetRecordEdition)
    window.DialogService.events.on('dialog:show', this.onGetRecordEditionShowDialog)
    window.DialogService.events.on('dialog:confirm', this.onGetRecordEditionConfirm)
    await this.$nextTick()
    await ConfigService.init()
    this.config = ConfigService.config
    await TranslateService.init()
    this.setToolbarTitle()
    await this.getUser()
    try {
      const data = await ResourceService.getAll()
      await ResourceService.getAllParagraphs()
      this.$loading.stop('init')
      const resourceList = _.sortBy(data, item => item.title)
      this.resourceList = _.filter(resourceList, resource => {
        return _.isUndefined(resource.allowed) ||  _.includes(resource.allowed, this.user.group)
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
  },
  methods: {
    async reloadResource(id = false) {
      console.warn(`Will reload resource:${this.selectedResource.name} - id: ${id}`)
      await this.selectResource(this.selectedResource, true)
      const record = id ? _.find(this.recordList, {_id: id}) : this.selectedRecord
      await this.selectRecord(record, true)
    },
    async onLoading(isLoading) {
      await this.$nextTick()
      this.isLoading = isLoading
      this.$forceUpdate()
    },
    getResourcesAndPlugins() {
      return _.union(this.pluginList, this.resourceList)
    },
    async getUser() {
      if (_.get(window, 'noLogin', false)) {
        this.user = {}
        return
      }
      LoginService.init()
      try {
        this.user = await LoginService.getStatus()
        this.allowedPlugins = await LoginService.getPlugins()
        console.info('Plugins available:', this.allowedPlugins)
        this.$vuetify.theme.dark = _.get(this.user, 'theme', 'light') === 'dark'
        this.$forceUpdate()
      } catch (error) {
        this.notify(_.get(error, 'response.data.message', error.message), 'error')
        throw error
      }
    },
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
    cancelDialog() {
      this.recordDialog = false
      this.displayDialog = false
    },
    confirmDialog() {
      window.DialogService.confirm(this.recordDialog)
    },
    onGetRecordEdition (isEditing) {
      this.isEditing = isEditing
    },
    async onGetRecordEditionShowDialog (data) {
      this.recordDialog = data
      this.displayDialog = true
    },
    async onGetRecordEditionConfirm (data) {
      window.DialogService.send(false)
      this.cancelDialog()
      if (data.callback) {
        return data.callback()
      }
    },
    async selectResourceGroup (resourceGroup) {
      this.selectedResourceGroup = resourceGroup
    },
    async selectResource (resource, force = false) {
      if (_.isUndefined(resource)) {
        return
      }
      if (!force && this.isEditing) {
        return window.DialogService.show({event: 'selectResource', callback: ()=> this.selectResource(resource)})
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
        await this.cacheRelatedResources(resource)
        const data = ResourceService.get(resource.title)
        this.recordList = _.sortBy(data, item => -item._updatedAt)
        if (_.get(resource, 'maxCount', 0) === 1) {
          const first = _.get(this.recordList, '[0]', false)
          this.selectRecord(!first ? { _local: true } : first)
        }
        this.$loading.stop('selectResource')
      } catch (error) {
        console.error('Error happen during selectResource:', error)
      }
    },
    async cacheRelatedResources (resource) {
      let resources = _.union([resource.title], _.values(resource.extraSources))
      const extraResources = (obj) => {
        if (_.isArray(obj)) {
          _.each(obj, item => {
            extraResources(item)
          })
        } else {
          _.each(obj, (value, key) => {
            if (key === 'input') {
              const extraSources = _.get(obj, 'options.extraSources')
              resources.push(..._.values(extraSources))
              if (value === 'select' || value === 'multiselect') {
                const source = _.get(obj, 'source')
                if (_.isString(source)) {
                  resources.push(source)
                  const schema = ResourceService.getSchema(source)
                  if (_.get(schema, 'extraSources', false)) {
                    resources.push(..._.values(schema.extraSources))
                  }
                }
              } else if (value === 'paragraph') {
                _.each(_.get(obj, 'options.types'), item => {
                  extraResources(item)
                  const paragraphSchema = _.get(item, 'schema')
                  extraResources(paragraphSchema)
                })
              }
            } else if (key === 'extraSources') {
              resources.push(..._.values(value))
            }
          })
        }
      }
      extraResources(resource.schema)
      resources = _.uniq(resources)
      await pAll(_.map(resources, item => {
        return async () => {
          try {
            return await ResourceService.cache(item)
          } catch (error) {
            console.error(`Failed to get extra resource ${item}`, error)
          }
        }
      }), {concurrency: 10})
    },
    selectRecord (record, force = false) {
      if (!force && this.isEditing && this.selectedRecord !== record) {
        return window.DialogService.show({event: 'selectRecord', callback: ()=> this.selectRecord(record)})
      }
      this.selectedRecord = record
    },
    onSelectMultiselect (isMultiselect) {
      if (this.isEditing) {
        return window.DialogService.show({event: 'selectMultiselect', callback: ()=> this.onSelectMultiselect(isMultiselect)})
      }
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
        this.recordList = []
        this.selectedRecord = false
        await this.$nextTick()
        this.recordList = _.sortBy(data, item => -item._updatedAt)
        let updatedRecord = _.find(this.recordList, { _id: _.get(record, '_id') })
        updatedRecord = _.isUndefined(updatedRecord) ? {_local: true} : updatedRecord
        this.selectRecord(updatedRecord)
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
@use '@a/scss/variables.scss' as *;
@use '@a/scss/mixins.scss' as *;
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
    min-width: 1080px;
    overflow-y: auto;
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
      &.full-width {
        overflow-x: hidden;
        flex-direction: column;
        .record-list {
          max-width: 100vw;
          width: 100vw;
          height: auto;
          flex-shrink: 0;
        }
      }
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
.sort-records {
  .v-field__input {
    padding-top: 0;
    padding-bottom: 0;
  }
}
.discard-changes {
  .v-overlay__content > div {
    padding: 15px;
  }
  .apply {
    color: $btn-action-color;
    background-color: $btn-action-background;
    @include cta-text;
  }
}
</style>
