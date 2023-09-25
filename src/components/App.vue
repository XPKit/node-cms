<template>
  <v-app>
    <v-scroll-y-transition>
      <v-snackbar v-if="notification.type" v-model="notification" multi-line top centered elevation="10" :light="$vuetify && $vuetify.theme && !$vuetify.theme.isDark" :timeout="notification.type === 'error' ? -1 : 1000" class="notification" :class="getNotificationClass()">
        <p>{{ notification.message }}</p>
        <template #action="{ attrs }">
          <v-btn rounded icon v-bind="attrs" @click="notification = {}">
            <v-icon>mdi-close-circle-outline</v-icon>
          </v-btn>
        </template>
      </v-snackbar>
    </v-scroll-y-transition>
    <div v-if="user" class="cms-layout">
      <div class="cms-inner-layout" :class="getThemeClass()">
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
              v-if="selectedResource" :list="recordList" :locale="locale" :selected-item="selectedRecord"
              :grouped-list="groupedList"
              :resource-group="selectedResourceGroup" :resource="selectedResource" :select-resource-callback="selectResource"
              :multiselect="multiselect" :multiselect-items="multiselectItems"
              @selectItem="selectRecord"
              @changeMultiselectItems="onChangeMultiselectItems"
              @selectMultiselect="onSelectMultiselect"
              @updateRecordList="updateRecordList"
            />
            <record-editor
              v-if="selectedRecord" :key="selectedRecord._id" :record.sync="selectedRecord" :resource="selectedResource" :locale.sync="locale"
              :user-locale="TranslateService.locale" @updateRecordList="updateRecordList"
            />
          </template>
          <record-table
            v-if="selectedResource && selectedResource.view == 'table'"
            :grouped-list="groupedList" :resource-group="selectedResourceGroup" :select-resource-callback="selectResource" :record-list="recordList" :resource="selectedResource" :record.sync="selectedRecord" :locale.sync="locale" :user-locale="TranslateService.locale"
            @unsetRecord="unsetSelectedRecord" @updateRecordList="updateRecordList"
          />
          <plugin-page v-if="selectedPlugin" :plugin="selectedPlugin" />

          <!-- <multiselect-page
            v-if="selectedResource && multiselect"
            :multiselect-items="multiselectItems"
            :locale="locale"
            :resource="selectedResource"
            :record-list="recordList"
            @cancel="onCancelMultiselectPage"
            @changeMultiselectItems="onChangeMultiselectItems"
            @updateRecordList="updateRecordList"
          /> -->
        </div>
        <loading v-if="LoadingService.isShow" />
      </div>
    </div>
  </v-app>
</template>

<script>
import axios from 'axios/dist/axios.min'
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
// import ResourceList from '@c/ResourceList.vue'
import RecordList from '@c/RecordList.vue'
import RecordEditor from '@c/RecordEditor.vue'
import RecordTable from '@c/RecordTable.vue'

export default {
  components: {
    // ResourceList,
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
      locale: 'enUS',
      resourceList: [],
      selectedResource: null,
      localeList: [],
      recordList: [],
      notification: {},
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
        this.selectResource(_.find(_.union(this.pluginList, this.resourceList), {title: this.$route.query.id}))
      }
    }
  },
  destroyed () {
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
        const resourcesResponse = await axios.get(`${window.location.pathname}resources`)
        this.$loading.stop('init')
        const resourceList = _.sortBy(resourcesResponse.data, item => item.title)
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
      }
    })
  },
  methods: {
    setToolbarTitle () {
      this.toolbarTitle = _.get(ConfigService.config, `toolbarTitle.${TranslateService.locale}`, _.get(ConfigService.config, 'toolbarTitle', false))
    },
    onGetNotification (data) {
      this.notification = data
      // console.warn('received notification !', data)
    },
    getNotificationClass () {
      return `notification-${this.notification.type}`
    },
    getThemeClass () {
      const classes = {}
      _.set(classes, `theme--${_.get(this.user, 'theme', 'light')}`, true)
      return classes
    },
    async selectResourceGroup (resourceGroup) {
      this.selectedResourceGroup = resourceGroup
    },
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
          if (!first) {
            this.selectRecord({ _local: true })
          } else {
            this.selectRecord(first)
          }
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
                      extraResources(item)
                      const paragraphSchema = _.get(item, 'schema')
                      extraResources(paragraphSchema)
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
      extraResources(resource.schema)
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
  .field-label {
    @include subtext;
    padding-left: 16px;
    color: $field-label-color;
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
