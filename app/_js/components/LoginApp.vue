<template>
  <v-app>
    <notifications group="notification" position="bottom left" />
    <div class="cms-layout">
      <locale-list v-if="localeList" :locale-list="localeList" />
      <div class="login-canvas">
        <input v-model="username" :placeholder="'TL_USERNAME' | translate">
        <input v-model="password" :placeholder="'TL_PASSWORD' | translate">
        <button @click="login()">{{ 'TL_LOGIN' | translate }}</button>
      </div>
    </div>
    <loading :class="{active:LoadingService.isShow}" />
  </v-app>
</template>

<script>
import axios from 'axios/dist/axios.min'

import Loading from './Loading.vue'
import LocaleList from './LocaleList.vue'
import LoadingService from '../services/LoadingService'
import ConfigService from '../services/ConfigService'
import TranslateService from '../services/TranslateService'
export default {
  components: {
    Loading,
    LocaleList
  },
  data () {
    return {
      username: null,
      password: null,
      locale: 'enUS',
      localeList: [],
      LoadingService,
      TranslateService
    }
  },
  async mounted () {
    this.$loading.start('init')
    try {
      await ConfigService.init()
      await TranslateService.init()
      this.localeList = ConfigService.config.locales
    } catch (error) {
      console.error('Error happen durign mounted:', error)
    }
    this.$loading.stop('init')
  },
  methods: {
    async login () {
      this.$loading.start('login')
      try {
        await axios.post('.', {username: this.username, password: this.password})
        window.location.reload()
      } catch (error) {
        console.error('Error happen during login:', error)
        this.$notify({
          group: 'notification',
          type: 'error',
          text: TranslateService.get('TL_LOGIN_FAIL')
        })
      }
    }
  }
}
</script>
