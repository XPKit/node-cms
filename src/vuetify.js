import Vue from 'vue'
import Vuetify from 'vuetify/lib/framework'
import '@mdi/font/css/materialdesignicons.min.css'
import 'vuetify/dist/vuetify.min.css'

const vuetify = new Vuetify({
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
      },
      dark: {
        primary: '#00142E',
        'node-cms-black': '#00142E',
        'node-cms-blue': '00142E',
        'node-cms-grabber': '00142E',
        'node-cms-twilight': '00142E',
        'node-cms-grey': '00142E',
        'node-cms-light-grey': '00142E',
        'node-cms-light-white-grey': '00142E',
        'node-cms-off-white': '00142E',
        'node-cms-red': '00142E'
      }
    }
  },
  icons: {
    iconfont: 'mdi'
  }
})

Vue.use(Vuetify)
window.Vuetify = Vuetify

export default vuetify
