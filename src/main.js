import '@a/scss/main.scss'

import _ from 'lodash'
import Vue from 'vue'
import VueRouter from 'vue-router'
import VueShortkey from 'vue-shortkey'
import VueTimeago from 'vue-timeago'
import Multiselect from 'vue-multiselect'
import JsonTreeView from 'vue-json-tree-view'
import VueVirtualScroller from 'vue-virtual-scroller'
import Notifications from 'vue-notification'
import Croppa from 'vue-croppa'
import wysiwyg from 'vue-wysiwyg'
import axios from 'axios'
import draggable from 'vuedraggable'
import LogViewer from '@femessage/log-viewer'

import vuetify from './vuetify.js'
import App from '@c/App.vue'
import LoginApp from '@c/LoginApp.vue'
import TreeView from '@c/TreeView.vue'
import ColorPicker from '@c/ColorPicker.vue'
import JsonEditor from '@c/JsonEditor.vue'
import WysiwygField from '@c/Wysiwyg.vue'
import ParagraphView from '@c/ParagraphView.vue'
import ImageView from '@c/ImageView.vue'
import AttachmentView from '@c/AttachmentView.vue'
import ParagraphAttachmentView from '@c/ParagraphAttachmentView.vue'
import CustomDatetimePicker from '@c/CustomDatetimePicker.vue'
import CustomMultiSelect from '@c/CustomMultiSelect.vue'
import CustomChecklist from '@c/CustomChecklist.vue'
import CustomInputTag from '@c/CustomInputTag.vue'
import Group from '@c/Group.vue'
import PluginPage from '@c/PluginPage.vue'
import MultiselectPage from '@c/MultiselectPage.vue'
import Syslog from '@c/Syslog.vue'
import CmsImport from '@c/CmsImport.vue'
import SyncResource from '@c/SyncResource.vue'
import Loading from './modules/Loading'

import TranslateFilter from '@f/Translate'
import TranslateService from '@s/TranslateService'

window.Vue = Vue
// Debug purpose
// Vue.config.devtools = false
Vue.component('FieldAttachmentView', AttachmentView)
Vue.component('FieldImageView', ImageView)
Vue.component('FieldParagraphAttachmentView', ParagraphAttachmentView)
Vue.component('FieldParagraphView', ParagraphView)
Vue.component('FieldTreeView', TreeView)
Vue.component('FieldColorPicker', ColorPicker)
Vue.component('FieldJsonEditor', JsonEditor)
Vue.component('FieldWysiwyg', WysiwygField)
Vue.component('FieldCustomDatetimePicker', CustomDatetimePicker)
Vue.component('FieldCustomChecklist', CustomChecklist)
Vue.component('FieldGroup', Group)
Vue.component('FieldCustomInputTag', CustomInputTag)
Vue.component('FieldCustomMultiSelect', CustomMultiSelect)
Vue.component('Multiselect', Multiselect)
Vue.component('LogViewer', LogViewer)
Vue.component('PluginPage', PluginPage)
Vue.component('MultiselectPage', MultiselectPage)
Vue.component('Syslog', Syslog)
Vue.component('CmsImport', CmsImport)
Vue.component('SyncResource', SyncResource)
Vue.component('Draggable', draggable)
Vue.mixin({
  filters: {
    translate: TranslateFilter
  }
})

Vue.use(wysiwyg, {})
Vue.use(Loading)
Vue.use(Croppa)
Vue.use(Notifications)
Vue.use(JsonTreeView)
Vue.use(VueVirtualScroller)
Vue.use(VueRouter)
Vue.use(VueShortkey)
Vue.use(VueTimeago, {
  name: 'timeago',
  locale: 'enUS',
  locales: {
    enUS: require('vue-timeago/locales/en-US.json'),
    zhCN: require('vue-timeago/locales/zh-CN.json')
  }
})

function addPlugin (title, displayName, group = 'System', allowed = ['admins', 'imagination']) {
  window.plugins = window.plugins || []
  window.plugins.push({
    title,
    displayname: displayName,
    component: title,
    group,
    allowed
  })
}

window.addEventListener('load', async function () {
  window.TranslateService = TranslateService
  const response = await axios.get('./config')
  const config = response.data
  addPlugin('Syslog', 'Syslog')
  if (config.import) {
    addPlugin('CmsImport', 'Cms Import')
  }
  if (config.sync && !config.sync.disablePlugin) {
    addPlugin('SyncResource', 'Sync Resource')
  }
  window.disableJwtLogin = _.get(config, 'disableJwtLogin', false)
  window.noLogin = window.disableJwtLogin && _.get(config, 'disableAuthentication', false)
  const router = new VueRouter({})
  // eslint-disable-next-line no-new
  new Vue({
    el: '#app',
    vuetify,
    router,
    render: function (createElement) {
      return createElement(this.$el.getAttribute('type') === 'login' ? LoginApp : App)
    }
  })
})
