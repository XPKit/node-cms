import _ from 'lodash'
import * as Vue from 'vue'
import { createApp, h } from 'vue'
import VueCookies from 'vue-cookies'
import JsonViewer from 'vue-json-viewer'
import { createRouter, createWebHashHistory } from 'vue-router'
import VueVirtualScroller from 'vue-virtual-scroller'
import VueShortkey from 'vue3-shortkey'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { VueDraggableNext } from 'vue-draggable-next'
import vuetify from './vuetify.js'
import '@p/js/main.js'
import '@a/scss/main.scss'
import '@p/scss/main.scss'

// Global components
import App from '@c/App.vue'
import CustomForm from '@c/CustomForm.vue'
import AttachmentView from '@c/fields/AttachmentView.vue'
import ColorPicker from '@c/fields/ColorPicker.vue'
import CustomCheckbox from '@c/fields/CustomCheckbox.vue'
import CustomCode from '@c/fields/CustomCode.vue'
import CustomDatetimePicker from '@c/fields/CustomDatetimePicker.vue'
import CustomInput from '@c/fields/CustomInput.vue'
import CustomInputTag from '@c/fields/CustomInputTag.vue'
import CustomMultiSelect from '@c/fields/CustomMultiSelect.vue'
import CustomTextarea from '@c/fields/CustomTextarea.vue'
import CustomTreeView from '@c/fields/CustomTreeView.vue'
// Field components
import FieldLabel from '@c/fields/FieldLabel.vue'
import Group from '@c/fields/Group.vue'
import ImageView from '@c/fields/ImageView.vue'
import JsonEditor from '@c/fields/JsonEditor.vue'
import ParagraphView from '@c/fields/ParagraphView.vue'
import Transliterate from '@c/fields/Transliterate.vue'
import WysiwygField from '@c/fields/Wysiwyg.vue'
import LoginApp from '@c/LoginApp.vue'
import CmsConfig from '@c/pages/CmsConfig.vue'
import CmsImport from '@c/pages/CmsImport.vue'
import ImportFromRemote from '@c/pages/ImportFromRemote.vue'
// Pages
import PluginPage from '@c/pages/PluginPage.vue'
import SyncResource from '@c/pages/SyncResource.vue'
import Syslog from '@c/pages/Syslog.vue'
import TranslateFilter from '@f/Translate'
import TruncateFilter from '@f/Truncate'
import DialogService from '@s/DialogService.js'
import RequestService from '@s/RequestService.js'
import TranslateService from '@s/TranslateService'
import Loading from './modules/Loading'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [{ path: '/', component: App }],
})

const app = createApp({
  render: () => {
    const mountEl = document.querySelector('#app')
    if (!mountEl) {
      return h(App)
    }
    return h(mountEl.getAttribute('type') === 'login' ? LoginApp : App)
  },
})
window.nodeCms = app
app.config.globalProperties.$filters = {
  translate: TranslateFilter,
  truncate: TruncateFilter,
}
app
  .use(router)
  .use(vuetify)

  // // Vue.config.devtools = false
  .component('CustomForm', CustomForm)
  .component('FieldLabel', FieldLabel)
  .component('AttachmentView', AttachmentView)
  .component('ImageView', ImageView)
  .component('CustomInput', CustomInput)
  .component('CustomTextarea', CustomTextarea)
  .component('CustomCheckbox', CustomCheckbox)
  .component('ParagraphView', ParagraphView)
  .component('CustomTreeView', CustomTreeView)
  .component('CustomCode', CustomCode)
  .component('ColorPicker', ColorPicker)
  .component('JsonEditor', JsonEditor)
  .component('WysiwygField', WysiwygField)
  .component('CustomDatetimePicker', CustomDatetimePicker)
  .component('Group', Group)
  .component('CustomInputTag', CustomInputTag)
  .component('Transliterate', Transliterate)
  .component('CustomMultiSelect', CustomMultiSelect)
  .component('PluginPage', PluginPage)
  .component('Syslog', Syslog)
  .component('CmsConfig', CmsConfig)
  .component('CmsImport', CmsImport)
  .component('ImportFromRemote', ImportFromRemote)
  .component('SyncResource', SyncResource)
  .component('Draggable', VueDraggableNext)
  .component('date-picker', VueDatePicker)
  .use(JsonViewer)
  .use(VueCookies)
  .use(Loading)
  .use(VueVirtualScroller)
  .use(VueShortkey, { prevent: ['input', 'textarea'] })

function addPlugin(title, displayName, group = 'System', allowed = ['admins', 'imagination']) {
  window.plugins = window.plugins || []
  console.info('adding plugin', displayName)
  window.plugins.push({
    title,
    displayname: displayName,
    component: title,
    group,
    allowed,
    type: 'plugin',
    pluginComponent: title,
  })
}

window.addEventListener('load', async () => {
  window.DialogService = DialogService
  _.each(window.plugins, (item) => {
    item.type = 'plugin'
  })
  window.TranslateService = TranslateService
  const config = await RequestService.get(`${window.location.pathname}config`)
  // console.warn('config = ', config)
  addPlugin('Syslog', 'Syslog')
  addPlugin('CmsConfig', 'Cms Config')
  if (config.import) {
    addPlugin('CmsImport', 'Cms Import')
  }
  if (config.importFromRemote) {
    addPlugin('ImportFromRemote', 'Import from remote')
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
