<template>
  <div class="theme-switch" @click="toggleTheme()">
    <v-icon :class="{selected: !isDark()}">mdi-weather-sunny</v-icon>
    <v-icon :class="{selected: isDark()}">mdi-weather-night</v-icon>
  </div>
</template>
<script setup>
import { useTheme } from 'vuetify'
import LoginService from '@s/LoginService'

const theme = useTheme()
function isDark () {
  return theme.global.name.value === 'dark'
}

async function toggleTheme () {
  theme.change(await LoginService.changeTheme())
}
</script>

<style lang="scss" scoped>
@use '@a/scss/variables.scss' as *;

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
