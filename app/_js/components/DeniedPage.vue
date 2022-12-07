<template>
  <v-container class="denied-page">
    <v-card
      class="mx-auto my-12 pd-12"
      max-width="374"
    >
      <v-card-title>{{ 'T_UNAUTHORIZED' | translate }}</v-card-title>
      <v-card-text><span class="user-id">{{ user.id }}</span> is not registered as a portal user</v-card-text>
      <v-card-actions>
        <v-btn @click="onClickLogout">
          {{ "T_LOGOUT" | translate }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script>
import LoginService from '@/services/LoginService'

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

<style lang="scss" scoped>
  .v-card {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 0vw 1.5vw;
    text-align: center;
    .v-card__title, .v-card__actions {
      display: block;
      text-align: center;
    }
  }
  .error-msg {
    color: grey;
  }
  .user-id {
    font-style: italic;
  }
  button {
    margin-top: 2vh;
  }
</style>
