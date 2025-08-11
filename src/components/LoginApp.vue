<template>
  <v-app :class="{'unclickable': isLoading}">
    <div v-if="loaded" class="cms-layout" :class="{displayed: showLoginForm}">
      <div class="login-canvas">
        <form @submit.prevent="login">
          <div class="node-cms-title">
            {{ $filters.translate('TL_LOGIN') }}
          </div>
          <input
            ref="username" v-model="username" autofocus type="text" name="nodeCmsUsername" autocomplete="on"
            :placeholder="$filters.translate('TL_USERNAME')"
          >
          <input ref="password" v-model="password" type="password" name="nodeCmsPassword" autocomplete="on" :placeholder="$filters.translate('TL_PASSWORD')">
          <span v-if="loginFailed" class="error-message">{{ $filters.translate('TL_LOGIN_FAIL') }}</span>
          <div class="login-btn-wrapper" :class="{disabled: !username || !password || loggingIn}">
            <button :disabled="loggingIn">
              {{ $filters.translate('TL_CONFIRM') }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <loading v-if="isLoading" />
  </v-app>
</template>

<script>
  import _ from 'lodash'

  import Loading from '@c/Loading.vue'
  import LoadingService from '@s/LoadingService'
  import ConfigService from '@s/ConfigService'
  import TranslateService from '@s/TranslateService'
  import LoginService from '@s/LoginService'
  import RequestService from '@s/RequestService'

  export default {
    components: {
      Loading
    },
    data () {
      return {
        username: null,
        password: null,
        activeField: false,
        loginFailed: false,
        isLoading: false,
        loggingIn: false,
        showLoginForm: false,
        loaded: false,
        LoadingService,
        TranslateService
      }
    },
    async unmounted () {
      LoadingService.events.off('has-loading', this.onLoading)
    },
    async mounted () {
      LoadingService.events.on('has-loading', this.onLoading)
      this.$loading.start('init')
      try {
        const noLogin = _.get(window, 'noLogin', false)
        if (!noLogin) {
          LoginService.init()
        }
        await ConfigService.init()
        await TranslateService.init()
        this.loaded = true
      } catch (error) {
        console.error('Error happen during mounted:', error)
      }
      this.loaded = true
      this.$nextTick(() => {
        setTimeout(() => {
          this.showLoginForm = true
        }, 100)
      })
      this.$loading.stop('init')
    },
    methods: {
      async onLoading(isLoading) {
        await this.$nextTick()
        this.isLoading = isLoading
        this.$forceUpdate()
      },
      async login () {
        if (this.loggingIn) {
          return
        } else if (!this.username) {
          return this.$refs.username.focus()
        } else if (!this.password) {
          return this.$refs.password.focus()
        }
        this.$loading.start('login')
        this.loggingIn = true
        try {
          await RequestService.post(`${window.location.pathname}login`, {username: this.username, password: this.password})
          this.$loading.stop('login')
          window.location.reload()
        } catch (error) {
          console.error('Error happen during login:', error)
          this.loginFailed = true
          this.$loading.stop('login')
        }
        this.loggingIn = false
      }
    }
  }
</script>

<style lang="scss" scoped>

.cms-layout {
  background-color: #e9e9e9;
  color: black;
  opacity: 0;
  transition: opacity 0.3s;
  &.displayed {
    opacity: 1;
  }
}
.node-cms-title {
  text-align: left;
  font-size: 24px;
  font-weight: 600;
  text-transform: uppercase;
}
input {
  outline: none;
  z-index: 1;
  position: relative;
  background: none;
  width: 100%;
  padding: 0;
  border: 0;
  font-size: 16px;
  border-bottom: 1px solid #757575;
  margin-bottom: 15px;
}
.error-message {
  display: block;
  color: red;
  font-style: italic;
  text-align: center;
  padding-top: 10px;
}
.login-btn-wrapper {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}

</style>
