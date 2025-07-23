<template>
  <div v-if="localeList && localeList.length > 1" class="locale-list">
    <div v-for="(locale, index) in localeList" :key="index" class="locale" :class="{active: TranslateService.locale == locale }" @click="TranslateService.setLocale(locale)">
      {{ $filters.translate('TL_' + locale.toUpperCase()) }}
    </div>
  </div>
</template>

<script>

import TranslateService from '@s/TranslateService'

export default {
  props: {
    localeList: { type: Array, default: () => [] }
   },
  data () {
    return {
      TranslateService
    }
  }
}
</script>
