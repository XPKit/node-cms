<template>
  <div class="theme-switch" @click="toggleTheme()">
    <v-icon :class="{selected: !getTheme()}">mdi-weather-sunny</v-icon>
    <v-icon :class="{selected: getTheme()}">mdi-weather-night</v-icon>
  </div>
</template>
<script setup>
import _ from 'lodash'
import { useTheme } from 'vuetify'
import LoginService from '@s/LoginService'

const theme = useTheme()
function getTheme () {
  return _.get(LoginService, 'user.theme', 'light') === 'dark'
}

if (getTheme()) {
  theme.global.name.value = 'dark'
}
function toggleTheme () {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
  _.set(LoginService, 'user.theme', theme.global.name.value)
}
</script>

<style lang="scss" scoped>
@import '@a/scss/variables.scss';

.theme-switch {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 4px;
    border: 2px solid $imag-pale-grey;
    border-radius: 100px;
    .v-icon {
      // padding: 6px;
      color: black;
      background-color: transparent;
      transition: all 0.3s;
      border-radius: 50%;
      padding: 2px;
      &.selected {
        color: white;
        background-color: $imag-purple;
      }
    }
  }
</style>
