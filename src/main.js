import '@a/scss/main.scss'

import _ from 'lodash'
import Vue from 'vue'
import VueRouter from 'vue-router'
import VueShortkey from 'vue-shortkey'
import VueTimeago from 'vue-timeago'
import TreeView from 'vue-json-tree-view'
import VueVirtualScroller from 'vue-virtual-scroller'
import Notifications from 'vue-notification'
import Croppa from 'vue-croppa'
import wysiwyg from 'vue-wysiwyg'
import axios from 'axios'
import draggable from 'vuedraggable'
import LogViewer from '@femessage/log-viewer'

import vuetify from './vuetify.js'
// Global components
import App from '@c/App.vue'
import LoginApp from '@c/LoginApp.vue'
import MultiselectPage from '@c/MultiselectPage.vue'
import CustomForm from '@c/CustomForm.vue'

// Pages
import PluginPage from '@c/pages/PluginPage.vue'
import Syslog from '@c/pages/Syslog.vue'
import CmsImport from '@c/pages/CmsImport.vue'
import SyncResource from '@c/pages/SyncResource.vue'

// Field components
import CustomTreeView from '@c/fields/CustomTreeView.vue'
import CustomCode from '@c/fields/CustomCode.vue'
import ColorPicker from '@c/fields/ColorPicker.vue'
import JsonEditor from '@c/fields/JsonEditor.vue'
import WysiwygField from '@c/fields/Wysiwyg.vue'
import ParagraphView from '@c/fields/ParagraphView.vue'
import ImageView from '@c/fields/ImageView.vue'
import AttachmentView from '@c/fields/AttachmentView.vue'
import ParagraphAttachmentView from '@c/fields/ParagraphAttachmentView.vue'
import CustomDatetimePicker from '@c/fields/CustomDatetimePicker.vue'
import CustomMultiSelect from '@c/fields/CustomMultiSelect.vue'
import CustomChecklist from '@c/fields/CustomChecklist.vue'
import CustomInput from '@c/fields/CustomInput.vue'
import CustomTextarea from '@c/fields/CustomTextarea.vue'
import CustomSwitch from '@c/fields/CustomSwitch.vue'
import CustomInputTag from '@c/fields/CustomInputTag.vue'
import Group from '@c/fields/Group.vue'

import Loading from './modules/Loading'

import TranslateFilter from '@f/Translate'
import TranslateService from '@s/TranslateService'

window.Vue = Vue
// Debug purpose
// Vue.config.devtools = false
Vue.component('CustomForm', CustomForm)
Vue.component('AttachmentView', AttachmentView)
Vue.component('ImageView', ImageView)
Vue.component('CustomInput', CustomInput)
Vue.component('CustomTextarea', CustomTextarea)
Vue.component('CustomSwitch', CustomSwitch)
Vue.component('ParagraphAttachmentView', ParagraphAttachmentView)
Vue.component('ParagraphView', ParagraphView)
Vue.component('CustomTreeView', CustomTreeView)
Vue.component('CustomCode', CustomCode)
Vue.component('ColorPicker', ColorPicker)
Vue.component('JsonEditor', JsonEditor)
Vue.component('WysiwygField', WysiwygField)
Vue.component('CustomDatetimePicker', CustomDatetimePicker)
Vue.component('CustomChecklist', CustomChecklist)
Vue.component('Group', Group)
Vue.component('CustomInputTag', CustomInputTag)
Vue.component('CustomMultiSelect', CustomMultiSelect)
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
Vue.use(TreeView)
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
