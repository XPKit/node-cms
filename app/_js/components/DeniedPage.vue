<template>
  <v-container class="denied-page">
    <div
      class="login-canvas"
    >
      {{ user }}
      <div class="title">{{ 'TL_UNAUTHORIZED' | translate }}</div>
      <div class="content"><span class="user-id">{{ user.id }}</span> is not registered as a portal user</div>
      <div class="actions">
        <button @click="onClickLogout">
          {{ "TL_RETRY" | translate }}
        </button>
      </div>
    </div>
  </v-container>
</template>

<script>
import LoginService from '../services/LoginService'

export default {
  props: {
    user: {
      type: Object,
      default: () => {}
    }
  },
  data () {
    return {
    }
  },
  methods: {
    async onClickLogout () {
      await LoginService.logout()
    }
  }
}
</script>
