import '@a/scss/main.scss'
import _ from 'lodash'
import { createApp, h } from 'vue'
import * as Vue from 'vue'

import { createRouter, createWebHashHistory } from 'vue-router'
// import 'vue-easytable/libs/theme-default/index.css'
// import VueEasytable from 'vue-easytable'
import VueShortkey from 'vue3-shortkey'
import VueTimeago from 'vue-timeago3'
import { JsonTreeView } from 'json-tree-view-vue3'
import VueVirtualScroller from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import axios from 'axios'
import draggable from 'vuedraggable'
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
import CustomInput from '@c/fields/CustomInput.vue'
import CustomTextarea from '@c/fields/CustomTextarea.vue'
import CustomCheckbox from '@c/fields/CustomCheckbox.vue'
import CustomInputTag from '@c/fields/CustomInputTag.vue'
import Group from '@c/fields/Group.vue'

// Table fields
import TableImageView from '@c/vue-table/TableImageView.vue'
import TableCustomCheckbox from '@c/vue-table/TableCustomCheckbox.vue'
import TableRowActions from '@c/vue-table/TableRowActions.vue'

// import enUS from 'vue-timeago3/locales/en-US.json'
// import zhCN from 'vue-timeago3/locales/zh-CN.json'

import Loading from './modules/Loading'

import TranslateFilter from '@f/Translate'
import TruncateFilter from '@f/Truncate'
import TranslateService from '@s/TranslateService'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [ { path: '/', component: App } ]
})

const app = createApp({
  render: () => {
    const mountEl = document.querySelector('#app')
    if (!mountEl) {
      return h(App)
    }
    return h(mountEl.getAttribute('type') === 'login' ? LoginApp : App)
  }
})
window.nodeCms = app

app.config.globalProperties.$filters = {
  translate: TranslateFilter,
  truncate: TruncateFilter
}
app.use(router)
  .use(vuetify)

// // Vue.config.devtools = false
  .component('CustomForm', CustomForm)
//   .component('AttachmentView', AttachmentView)
//   .component('ImageView', ImageView)
//   .component('CustomInput', CustomInput)
//   .component('CustomTextarea', CustomTextarea)
//   .component('CustomCheckbox', CustomCheckbox)
//   .component('ParagraphAttachmentView', ParagraphAttachmentView)
//   .component('ParagraphView', ParagraphView)
//   .component('CustomTreeView', CustomTreeView)
//   .component('CustomCode', CustomCode)
//   .component('ColorPicker', ColorPicker)
//   .component('JsonEditor', JsonEditor)
//   .component('WysiwygField', WysiwygField)
//   .component('CustomDatetimePicker', CustomDatetimePicker)
//   .component('Group', Group)
//   .component('CustomInputTag', CustomInputTag)
//   .component('CustomMultiSelect', CustomMultiSelect)
  .component('PluginPage', PluginPage)
  .component('MultiselectPage', MultiselectPage)
  .component('Syslog', Syslog)
  .component('CmsImport', CmsImport)
  .component('SyncResource', SyncResource)
//   .component('Draggable', draggable)
//   .component('TableImageView', TableImageView)
//   .component('TableCustomCheckbox', TableCustomCheckbox)
//   .component('TableRowActions', TableRowActions)

  .use(Loading)
//   // .use(VueEasytable)
//   // .use(JsonTreeView)
  .use(VueVirtualScroller)
  .use(VueShortkey)
  .use(VueTimeago, {
    name: 'timeago'
    // TODO: hugo - later - add locales via import { en, zh } from "date-fns/locale";
  })

function addPlugin (title, displayName, group = 'System', allowed = ['admins', 'imagination']) {
  window.plugins = window.plugins || []
  window.plugins.push({
    title,
    displayname: displayName,
    component: title,
    group,
    allowed,
    type: 'plugin',
    internal: true
  })
}

let recaptchaScript = document.createElement('script')
recaptchaScript.setAttribute('src', './plugins/scripts/bundle.js')
document.head.appendChild(recaptchaScript)
window.Vue = Vue

window.addEventListener('load', async function () {
  _.each(window.plugins, item => {
    item.type = 'plugin'
  })
  const externalPlugins = _.filter(window.plugins, (plugin) => plugin.internal !== false)
  _.each(externalPlugins, (externalPlugin) => {
    app.component(externalPlugin.name, externalPlugin.component)
    // app.component(externalPlugin.name, externalPlugin.component)
  })
  window.TranslateService = TranslateService
  const response = await axios.get(`${window.location.pathname}config`)
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
  app.mount('#app')
})
