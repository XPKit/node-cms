import _ from 'lodash'
import { createApp, h } from 'vue'
import * as Vue from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import JsonViewer from 'vue-json-viewer'
import VueShortkey from 'vue3-shortkey'
import VueVirtualScroller from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { VueDraggableNext } from 'vue-draggable-next'
import vuetify from './vuetify.js'
import '@p/js/main.js'
import '@a/scss/main.scss'
import '@p/scss/main.scss'

// Global components
import App from '@c/App.vue'
import LoginApp from '@c/LoginApp.vue'
import CustomForm from '@c/CustomForm.vue'

// Pages
import PluginPage from '@c/pages/PluginPage.vue'
import Syslog from '@c/pages/Syslog.vue'
import CmsImport from '@c/pages/CmsImport.vue'
import SyncResource from '@c/pages/SyncResource.vue'

// Field components
import FieldLabel from '@c/fields/FieldLabel.vue'
import CustomTreeView from '@c/fields/CustomTreeView.vue'
import CustomCode from '@c/fields/CustomCode.vue'
import ColorPicker from '@c/fields/ColorPicker.vue'
import JsonEditor from '@c/fields/JsonEditor.vue'
import WysiwygField from '@c/fields/Wysiwyg.vue'
import ParagraphView from '@c/fields/ParagraphView.vue'
import ImageView from '@c/fields/ImageView.vue'
import AttachmentView from '@c/fields/AttachmentView.vue'
// import ParagraphAttachmentView from '@c/fields/ParagraphAttachmentView.vue'
import CustomDatetimePicker from '@c/fields/CustomDatetimePicker.vue'
import CustomMultiSelect from '@c/fields/CustomMultiSelect.vue'
import CustomInput from '@c/fields/CustomInput.vue'
import CustomTextarea from '@c/fields/CustomTextarea.vue'
import CustomCheckbox from '@c/fields/CustomCheckbox.vue'
import CustomInputTag from '@c/fields/CustomInputTag.vue'
import Group from '@c/fields/Group.vue'

import Loading from './modules/Loading'

import TranslateFilter from '@f/Translate'
import TruncateFilter from '@f/Truncate'
import TranslateService from '@s/TranslateService'
import RequestService from '@s/RequestService.js'
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
  .component('FieldLabel', FieldLabel)
  .component('AttachmentView', AttachmentView)
  .component('ImageView', ImageView)
  .component('CustomInput', CustomInput)
  .component('CustomTextarea', CustomTextarea)
  .component('CustomCheckbox', CustomCheckbox)
  // .component('ParagraphAttachmentView', ParagraphAttachmentView)
  .component('ParagraphView', ParagraphView)
  .component('CustomTreeView', CustomTreeView)
  .component('CustomCode', CustomCode)
  .component('ColorPicker', ColorPicker)
  .component('JsonEditor', JsonEditor)
  .component('WysiwygField', WysiwygField)
  .component('CustomDatetimePicker', CustomDatetimePicker)
  .component('Group', Group)
  .component('CustomInputTag', CustomInputTag)
  .component('CustomMultiSelect', CustomMultiSelect)
  .component('PluginPage', PluginPage)
  .component('Syslog', Syslog)
  .component('CmsImport', CmsImport)
  .component('SyncResource', SyncResource)
  .component('Draggable', VueDraggableNext)
  .use(JsonViewer)
  .use(Loading)
  .use(VueVirtualScroller)
  .use(VueShortkey, {prevent: ['input', 'textarea']})

function addPlugin (title, displayName, group = 'System', allowed = ['admins', 'imagination']) {
  window.plugins = window.plugins || []
  window.plugins.push({
    title,
    displayname: displayName,
    component: title,
    group,
    allowed,
    type: 'plugin',
    pluginComponent: title
  })
}

window.addEventListener('load', async function () {
  _.each(window.plugins, item => {
    item.type = 'plugin'
  })
  window.TranslateService = TranslateService
  const config = RequestService.get(`${window.location.pathname}config`)
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
  window.nodeCms = app
})
window.Vue = Vue
