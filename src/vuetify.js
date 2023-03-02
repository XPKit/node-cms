// import Vue from 'vue'
// import Vuetify, {
//     VRow,
//     VCol,
//     VTextField,
//     VTooltip,
//     VCheckbox,
//     VSelect,
// } from 'vuetify'
// import { Ripple, Intersect, Touch, Resize } from 'vuetify/lib/directives'
// import 'vuetify/dist/vuetify.min.css'

// Vue.use(Vuetify)
// Vue.use(Vuetify, {
// components: { VRow, VTooltip, VCol, VTextField, VCheckbox, VSelect },
// directives: { Ripple, Intersect, Touch, Resize },
// });
// export default new Vuetify({
//   theme: {
//     themes: {
//       light: {
//         primary: '#00095B',
//         'node-cms-black': '#00142E',
//         'node-cms-blue': '#00095B',
//         'node-cms-grabber': '#1700F4',
//         'node-cms-twilight': '#00142E',
//         'node-cms-grey': '#AFAFAF',
//         'node-cms-light-grey': '#DBDBDB',
//         'node-cms-light-white-grey': '#EDEDED',
//         'node-cms-off-white': '#F6F6F6',
//         'node-cms-red': '#C90000'
//       }
//     }
//   }})

import Vue from 'vue'
import Vuetify from 'vuetify/lib/framework'
import 'vuetify/dist/vuetify.min.css'
import '@mdi/font/scss/materialdesignicons.scss'

Vue.use(Vuetify)

export default new Vuetify({
  theme: {
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
