import Vue from 'vue'
import Vuetify from 'vuetify/lib/framework'
// import Vuetify, {
//   VRow,
//   VCol,
//   VTextField,
//   VTooltip,
//   VCard,
//   VForm,
//   VInput,
//   VTextarea,
//   VCheckbox,
//   VSwitch,
//   VSelect
// } from 'vuetify/lib'
// import { Ripple, Intersect, Touch, Resize, ClickOutside } from 'vuetify/lib/directives'
import 'vuetify/dist/vuetify.min.css'
import '@mdi/font/scss/materialdesignicons.scss'

Vue.use(Vuetify)
// Vue.use(Vuetify, {
//   components: { VRow, VTooltip, VCard, VCol, VTextField, VForm, VInput, VTextarea, VCheckbox, VSwitch, VSelect },
//   directives: { Ripple, Intersect, Touch, Resize, ClickOutside }
// })

export default new Vuetify({
  theme: {
    dark: true,
    themes: {
      light: {
        primary: '#00095B',
        'node-cms-black': '#00142E',
        'node-cms-blue': '#00095B',
        'node-cms-grabber': '#1700F4',
        'node-cms-twilight': '#00142E',
        'node-cms-grey': '#AFAFAF',
        'node-cms-light-grey': '#DBDBDB',
        'node-cms-light-white-grey': '#EDEDED',
        'node-cms-off-white': '#F6F6F6',
        'node-cms-red': '#C90000'
      }
    }
  },
  icons: {
    iconfont: 'mdiSvg' // 'mdi' || 'mdiSvg' || 'md' || 'fa' || 'fa4' || 'faSvg'
  }
})
