<template>
  <div class="user-nav-bar">
    <button @click="logout()">{{ 'TL_LOGOUT' | translate }}</button>
  </div>
</template>

<script>
import LoginService from '../services/LoginService'

export default {
  data () {
    return {

    }
  },
  methods: {
    async logout () {
      await LoginService.logout()
      window.location.reload()
    }
  }

}
</script>

<style lang="scss" scoped>
.user-nav-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 50px;
  border-bottom: 1px solid #c7c7c7;
  padding: 0 2.5vw;
  button {
    user-select: none;
  }
}
</style>
