<template>
  <v-app>
    <notifications group="notification" position="bottom left" />
    <div class="cms-layout">
      <locale-list v-if="localeList && localeList.length > 0" :locale-list="localeList" />
      <div class="login-canvas">
        <form @submit.prevent="login">
          <input v-model="username" autofocus type="test" name="nodeCmsUsername" :placeholder="'TL_USERNAME' | translate" autocomplete="on">
          <input v-model="password" type="password" name="nodeCmsPassword" :placeholder="'TL_PASSWORD' | translate" autocomplete="on">
          <template v-if="loginFailed">
            <span class="error-message">{{ 'TL_LOGIN_FAIL' | translate }}</span>
          </template>
          <button :disabled="!username || !password || loggingIn">{{ 'TL_LOGIN' | translate }}</button>
        </form>
      </div>
    </div>
    <loading v-if="LoadingService.isShow" />
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
      loginFailed: false,
      loggingIn: false,
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
      console.error('Error happen during mounted:', error)
    }
    this.$loading.stop('init')
  },
  methods: {
    async login () {
      if (this.loggingIn || !this.username || !this.password) {
        return
      }
      this.$loading.start('login')
      this.loggingIn = true
      try {
        await axios.post('./login', {username: this.username, password: this.password})
        this.$loading.stop('login')
        window.location.reload()
      } catch (error) {
        console.error('Error happen during login:', error)
        this.$notify({
          group: 'notification',
          type: 'error',
          text: TranslateService.get('TL_LOGIN_FAIL')
        })
        this.loginFailed = true
        this.$loading.stop('login')
      }
      this.loggingIn = false
    }
  }
}
</script>

<style lang="scss" scoped>
.login-canvas {
  padding: 5vw;
  border: 1px solid #c7c7c7;
  border-radius: 16px;
  box-shadow: 0px 0px 20px 0px rgba(0,0,0,0.5);
}
.error-message {
  color: red;
  font-style: italic;
  text-align: center;
}
button {
  // background-color: aqua;
  &:disabled {
    opacity: 0.5;
    touch-action: none;
    pointer-events: none;
  }
}
</style>
