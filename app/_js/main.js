import Vue from 'vue/dist/vue.min'
import VueRouter from 'vue-router'
import VueTimeago from 'vue-timeago'
import Multiselect from 'vue-multiselect'
import JsonTreeView from 'vue-json-tree-view'
import VueVirtualScroller from 'vue-virtual-scroller'
import Notifications from 'vue-notification'
import Croppa from 'vue-croppa'
import wysiwyg from 'vue-wysiwyg'
import axios from 'axios'
import draggable from 'vuedraggable'

import App from './components/App.vue'
import LoginApp from './components/LoginApp.vue'
import TreeView from './components/TreeView.vue'
import ColorPicker from './components/ColorPicker.vue'
import JsonEditor from './components/JsonEditor.vue'
import WysiwygField from './components/Wysiwyg.vue'
import ParagraphView from './components/ParagraphView.vue'
import ImageView from './components/ImageView.vue'
import AttachmentView from './components/AttachmentView.vue'
import ParagraphAttachmentView from './components/ParagraphAttachmentView.vue'
import CustomDatetimePicker from './components/CustomDatetimePicker.vue'
import CustomMultiSelect from './components/CustomMultiSelect.vue'
import CustomChecklist from './components/CustomChecklist.vue'
import CustomInputTag from './components/CustomInputTag.vue'
import Group from './components/Group.vue'
import PluginPage from './components/PluginPage.vue'
import Syslog from './components/Syslog.vue'
import CmsImport from './components/CmsImport.vue'
import SyncResource from './components/SyncResource.vue'
import Loading from './modules/Loading'

import TranslateFilter from './filters/Translate'

import TranslateService from './services/TranslateService'

window.Vue = Vue
// Debug purpose
// Vue.config.devtools = false
Vue.component('fieldAttachmentView', AttachmentView)
Vue.component('fieldImageView', ImageView)
Vue.component('fieldParagraphAttachmentView', ParagraphAttachmentView)
Vue.component('fieldParagraphView', ParagraphView)
Vue.component('fieldTreeView', TreeView)
Vue.component('fieldColorPicker', ColorPicker)
Vue.component('fieldJsonEditor', JsonEditor)
Vue.component('fieldWysiwyg', WysiwygField)
Vue.component('fieldCustomDatetimePicker', CustomDatetimePicker)
Vue.component('fieldCustomChecklist', CustomChecklist)
Vue.component('fieldGroup', Group)
Vue.component('fieldCustomInputTag', CustomInputTag)
Vue.component('fieldCustomMultiSelect', CustomMultiSelect)
Vue.component('multiselect', Multiselect)
Vue.component('pluginPage', PluginPage)
Vue.component('Syslog', Syslog)
Vue.component('CmsImport', CmsImport)
Vue.component('SyncResource', SyncResource)
Vue.component('draggable', draggable)
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
Vue.use(VueTimeago, {
  name: 'timeago',
  locale: 'enUS',
  locales: {
    enUS: require('vue-timeago/locales/en-US.json'),
    zhCN: require('vue-timeago/locales/zh-CN.json')
  }
})

window.addEventListener('load', async function (event) {
  window.TranslateService = TranslateService

  const response = await axios.get('./config')
  const config = response.data

  if (config.syslog) {
    // await axios.get('../api/_syslog')
    window.plugins = window.plugins || []
    window.plugins.push({
      title: 'Syslog',
      displayname: 'Syslog',
      component: 'Syslog',
      group: '- System -',
      allowed: ['admins', 'imagination']
    })
  }

  if (config.import) {
    window.plugins = window.plugins || []
    window.plugins.push({
      title: 'CmsImport',
      displayname: 'Cms Import',
      component: 'CmsImport',
      group: '- System -',
      allowed: ['admins', 'imagination']
    })
  }

  if (config.sync && !config.sync.disablePlugin) {
    window.plugins = window.plugins || []
    window.plugins.push({
      title: 'SyncResource',
      displayname: 'Sync Resource',
      component: 'SyncResource',
      group: '- System -',
      allowed: ['admins', 'imagination']
    })
  }

  const router = new VueRouter({})
  // eslint-disable-next-line no-new
  new Vue({
    el: '#app',
    router,
    render: function (createElement) {
      return createElement(this.$el.getAttribute('type') === 'login' ? LoginApp : App)
    }
  })
})
