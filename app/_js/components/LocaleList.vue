<template>
  <div v-if="localeList && localeList.length > 1" class="locale-list">
    <div v-for="(locale, index) in localeList" :key="index" class="locale" :class="{active: TranslateService.locale == locale }" @click="select(locale)">
      {{ 'TL_' + locale.toUpperCase() | translate }}
    </div>
  </div>
</template>

<script>

import TranslateService from '../services/TranslateService'

export default {
  props: [
    'localeList'
  ],
  data () {
    return {
      TranslateService
    }
  },
  computed: {
  },
  methods: {
    select (item) {
      TranslateService.setLocale(item)
    }
  }
}
</script>
