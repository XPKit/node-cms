<template>
  <div class="theme-switch" @click="toggleTheme()">
    <v-icon :class="{selected: !isDark()}">mdi-weather-sunny</v-icon>
    <v-icon :class="{selected: isDark()}">mdi-weather-night</v-icon>
  </div>
</template>
<script setup>
import LoginService from '@s/LoginService'
import _ from 'lodash'
import { ref, watch } from 'vue'
import { useTheme } from 'vuetify'
const theme = useTheme()
const currentTheme = ref(theme.global.name.value)

function isDark () {
  return currentTheme.value === 'dark'
}

async function toggleTheme () {
  if (_.isFunction(theme.change)) {
    const newTheme = await LoginService.changeTheme()
    theme.change(newTheme)
    currentTheme.value = newTheme
    // document.body.classList.remove('v-theme--dark', 'v-theme--light')
    // document.body.classList.add(`v-theme--${newTheme}`)
  } else {
    console.error(`Cannot call theme change:`, theme)
  }
}

// Watch for theme changes and update body class
watch(() => theme.global.name.value, (newVal) => {
  currentTheme.value = newVal
  console.warn(`THEME IS NOW: `, newVal)
  document.body.classList.remove('v-theme--dark', 'v-theme--light')
  document.body.classList.add(`v-theme--${newVal}`)
})
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
